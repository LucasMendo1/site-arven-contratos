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
import bcrypt from "bcrypt";
import multer from "multer";
import { randomUUID } from "crypto";
import { supabaseStorage } from "./supabaseStorage";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

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
        secure: false, // Permite HTTP (sem HTTPS)
        sameSite: 'lax',
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

  app.post("/api/contracts", isAuthenticated, async (req, res) => {
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
      
      // Check if error is related to missing database columns (migration not executed)
      if (error.message && (error.message.includes("company_name") || error.message.includes("document"))) {
        return res.status(500).json({ 
          error: "Database migration required",
          message: "Please execute the SQL migration in supabase_add_company_fields.sql to add the required columns to the database.",
          details: error.message
        });
      }
      
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Buscar o contrato para obter o pdfUrl
      const contracts = await storage.getAllContracts();
      const contract = contracts.find(c => c.id === id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Deletar o PDF do Supabase Storage (se existir)
      if (contract.pdfUrl) {
        try {
          console.log(`🗑️ Deleting PDF from Supabase: ${contract.pdfUrl}`);
          await supabaseStorage.deletePDF(contract.pdfUrl);
          console.log(`✅ PDF deleted successfully: ${contract.pdfUrl}`);
        } catch (pdfError: any) {
          console.error("Error deleting PDF from storage:", pdfError);
          // Continuar mesmo se o PDF não puder ser deletado
          // (pode já ter sido deletado ou não existir)
        }
      }
      
      // Deletar o registro do banco de dados
      await storage.deleteContract(id);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete contract error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Configuração do multer para upload local
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  // Object storage routes for PDF uploads
  // NOTA: Rotas protegidas - apenas admins podem fazer upload
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      
      console.log("[Upload URL] Generated:", uploadURL ? "Success" : "Failed");
      console.log("[Object Path]:", objectPath);
      
      if (!uploadURL) {
        throw new Error("Upload URL is empty");
      }
      
      res.json({ uploadURL, objectPath });
    } catch (error: any) {
      console.error("Get upload URL error:", error.message || error);
      res.status(500).json({ 
        error: "Failed to generate upload URL",
        details: error.message 
      });
    }
  });

  // Endpoint para upload no Supabase Storage
  app.post("/api/upload/supabase", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log("[Supabase Upload] Starting upload, file size:", req.file.size);
      
      // Upload para Supabase Storage
      const filePath = await supabaseStorage.uploadPDF(req.file.buffer, req.file.originalname);
      
      // Gera URL assinada (válida por 1 hora)
      const signedUrl = await supabaseStorage.getSignedUrl(filePath, 3600);
      
      console.log("[Supabase Upload] File uploaded successfully:", filePath);
      
      // Retorna o path do arquivo (será salvo no banco)
      res.json({ 
        objectPath: filePath,
        signedUrl: signedUrl // URL temporária para visualização
      });
    } catch (error: any) {
      console.error("Supabase upload error:", error.message || error);
      res.status(500).json({ 
        error: "Failed to upload file to Supabase",
        details: error.message 
      });
    }
  });

  // Endpoint para download de PDF do Supabase
  app.get("/api/storage/:filePath(*)", isAuthenticated, async (req, res) => {
    try {
      const filePath = req.params.filePath;
      console.log("[Download] Requesting file:", filePath);
      
      // Gera URL assinada temporária
      const signedUrl = await supabaseStorage.getSignedUrl(filePath, 3600);
      
      // Redireciona para a URL assinada do Supabase
      res.redirect(signedUrl);
    } catch (error: any) {
      console.error("Download error:", error.message || error);
      res.status(404).json({ 
        error: "File not found",
        details: error.message 
      });
    }
  });

  app.post("/api/contracts/pdf", isAuthenticated, async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      console.log("[PDF Processing] Received objectPath:", objectPath);
      
      if (!objectPath) {
        return res.status(400).json({ error: "Object path is required" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Retry logic for race condition between upload and ACL setting
      let retries = 3;
      let finalPath = null;
      
      while (retries > 0 && !finalPath) {
        try {
          finalPath = await objectStorageService.trySetObjectEntityAclPolicy(
            objectPath,
            {
              owner: "system",
              visibility: "public",
            }
          );
          console.log("[PDF Processing] ACL set successfully:", finalPath);
        } catch (error: any) {
          retries--;
          if (retries > 0 && error.name === "ObjectNotFoundError") {
            console.log(`[PDF Processing] Object not found, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          } else {
            throw error;
          }
        }
      }

      if (!finalPath) {
        throw new Error("Failed to set ACL after retries");
      }

      res.json({ pdfUrl: finalPath });
    } catch (error: any) {
      console.error("Set PDF ACL error:", error);
      res.status(500).json({ error: "Failed to process PDF", details: error.message });
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

  // User management routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user - storage will hash the password
      const user = await storage.createUser({ email, password });

      res.json({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.session.userId;

      // Prevent users from deleting themselves
      if (id === currentUserId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
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
