import { supabase } from "./supabase";
import bcrypt from "bcrypt";
import type {
  User,
  InsertUser,
  Contract,
  InsertContract,
  WebhookConfig,
  InsertWebhookConfig,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUserPassword(email: string, password: string): Promise<User | null>;

  getAllContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  deleteContract(id: string): Promise<void>;

  getWebhookConfig(): Promise<WebhookConfig | undefined>;
  upsertWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error getting user:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Map snake_case from DB to camelCase for frontend
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      createdAt: data.created_at,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Error getting user by email:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Map snake_case from DB to camelCase for frontend
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      createdAt: data.created_at,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const { data, error } = await supabase
      .from("users")
      .insert({
        ...insertUser,
        password: hashedPassword,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as User;
  }

  async verifyUserPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    // Compare the provided password with the hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      return user;
    }

    return null;
  }

  async getAllContracts(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error getting contracts:", error);
      return [];
    }

    // Map snake_case from DB to camelCase for frontend
    return (data || []).map((row: any) => ({
      id: row.id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      contractDuration: row.contract_duration,
      product: row.product,
      pdfUrl: row.pdf_url,
      submittedAt: row.submitted_at,
    }));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error getting contract:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Map snake_case from DB to camelCase for frontend
    return {
      id: data.id,
      clientName: data.client_name,
      clientPhone: data.client_phone,
      contractDuration: data.contract_duration,
      product: data.product,
      pdfUrl: data.pdf_url,
      submittedAt: data.submitted_at,
    };
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    // Map camelCase from frontend to snake_case for DB
    const dbContract = {
      client_name: insertContract.clientName,
      client_phone: insertContract.clientPhone,
      contract_duration: insertContract.contractDuration,
      product: insertContract.product,
      pdf_url: insertContract.pdfUrl,
    };

    const { data, error } = await supabase
      .from("contracts")
      .insert(dbContract)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contract: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned after contract creation");
    }

    // Map snake_case from DB back to camelCase for response
    return {
      id: data.id,
      clientName: data.client_name,
      clientPhone: data.client_phone,
      contractDuration: data.contract_duration,
      product: data.product,
      pdfUrl: data.pdf_url,
      submittedAt: data.submitted_at,
    };
  }

  async deleteContract(id: string): Promise<void> {
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete contract: ${error.message}`);
    }
  }

  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    const { data, error } = await supabase
      .from("webhook_config")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return undefined;
      }
      console.error("Error getting webhook config:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Map snake_case from DB to camelCase for frontend
    return {
      id: data.id,
      url: data.url,
      isActive: data.is_active,
      updatedAt: data.updated_at,
    };
  }

  async upsertWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig> {
    const existing = await this.getWebhookConfig();

    // Map camelCase from frontend to snake_case for DB
    const dbConfig = {
      url: config.url,
      is_active: config.isActive,
    };

    if (existing) {
      const { data, error } = await supabase
        .from("webhook_config")
        .update(dbConfig)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update webhook config: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned after webhook update");
      }

      // Map snake_case from DB back to camelCase for response
      return {
        id: data.id,
        url: data.url,
        isActive: data.is_active,
        updatedAt: data.updated_at,
      };
    } else {
      const { data, error } = await supabase
        .from("webhook_config")
        .insert(dbConfig)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create webhook config: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned after webhook creation");
      }

      // Map snake_case from DB back to camelCase for response
      return {
        id: data.id,
        url: data.url,
        isActive: data.is_active,
        updatedAt: data.updated_at,
      };
    }
  }
}

export const storage = new SupabaseStorage();
