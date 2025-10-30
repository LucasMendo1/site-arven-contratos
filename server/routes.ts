import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertContractSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

const MemStore = MemoryStore(session);

// Session middleware setup
function setupSession(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "arven-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new MemStore({
        checkPeriod: 86400000, // 24 hours
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );
}

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupSession(app);

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("🔐 Login attempt:", { email, passwordLength: password?.length });

      if (!email || !password) {
        console.log("❌ Missing email or password");
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.verifyUserPassword(email, password);
      console.log("👤 User verification result:", user ? "✅ Valid" : "❌ Invalid");

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      console.log("✅ Login successful for:", email);
      
      res.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error: any) {
      console.error("💥 Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ id: user.id, email: user.email });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Contract routes
  app.get("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error: any) {
      console.error("Get contracts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);

      // Send webhook if configured
      const webhookConfig = await storage.getWebhookConfig();
      if (webhookConfig && webhookConfig.isActive === "true") {
        try {
          await fetch(webhookConfig.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event: "contract.created",
              data: contract,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (webhookError) {
          console.error("Webhook error:", webhookError);
        }
      }

      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Create contract error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid contract data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContract(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete contract error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage routes for PDF uploads
  // NOTA: Rotas públicas - formulário de contrato é público (clientes enviam sem login)
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      console.log("[Upload URL] Generated:", uploadURL ? "Success" : "Failed");
      
      if (!uploadURL) {
        throw new Error("Upload URL is empty");
      }
      
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Get upload URL error:", error.message || error);
      res.status(500).json({ 
        error: "Failed to generate upload URL",
        details: error.message 
      });
    }
  });

  app.post("/api/contracts/pdf", async (req, res) => {
    try {
      const { pdfUrl } = req.body;
      
      if (!pdfUrl) {
        return res.status(400).json({ error: "PDF URL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        pdfUrl,
        {
          owner: "system",
          visibility: "public",
        }
      );

      res.json({ pdfUrl: objectPath });
    } catch (error: any) {
      console.error("Set PDF ACL error:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.sendStatus(401);
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Webhook config routes
  app.get("/api/webhook", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getWebhookConfig();
      res.json(config || { url: "", isActive: "false" });
    } catch (error: any) {
      console.error("Get webhook config error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/webhook", isAuthenticated, async (req, res) => {
    try {
      const { url, isActive } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Webhook URL is required" });
      }

      const config = await storage.upsertWebhookConfig({
        url,
        isActive: isActive || "true",
      });

      res.json(config);
    } catch (error: any) {
      console.error("Update webhook config error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
