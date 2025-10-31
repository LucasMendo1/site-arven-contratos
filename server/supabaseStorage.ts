import { supabase } from "./supabase";
import { randomUUID } from "crypto";

export class SupabaseStorageService {
  private bucketName = "contracts";

  async ensureBucketExists(): Promise<void> {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      throw listError;
    }

    const bucketExists = buckets?.some((b) => b.name === this.bucketName);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ["application/pdf"],
      });

      if (createError) {
        console.error("Error creating bucket:", createError);
        throw createError;
      }

      console.log(`✅ Bucket '${this.bucketName}' created successfully`);
    }
  }

  async uploadPDF(file: Buffer, originalName: string): Promise<string> {
    await this.ensureBucketExists();

    const fileId = randomUUID();
    const fileName = `${fileId}.pdf`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    console.log(`✅ PDF uploaded to Supabase: ${data.path}`);
    return filePath;
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error("Failed to generate signed URL");
    }

    return data.signedUrl;
  }

  async getPublicUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async deletePDF(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      throw error;
    }

    console.log(`🗑️ PDF deleted from Supabase: ${filePath}`);
  }

  async downloadPDF(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(filePath);

    if (error) {
      console.error("Download error:", error);
      throw error;
    }

    if (!data) {
      throw new Error("File not found");
    }

    return data;
  }
}

export const supabaseStorage = new SupabaseStorageService();
