import { v2 as cloudinary } from "cloudinary";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
export async function uploadToCloudinary(
  file: Buffer,
  folder: string,
  publicId?: string,
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary not configured");
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result!.secure_url, publicId: result!.public_id });
      },
    );
    uploadStream.end(file);
  });
}
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId);
}
export async function uploadImage(
  file: Buffer,
  entityType: "student" | "teacher" | "document",
  entityId: string,
  documentType?: string,
): Promise<{ url: string; publicId: string }> {
  const folder = `school-erp/${entityType}/${entityId}`;
  const publicId = documentType ? `${documentType}-${Date.now()}` : undefined;
  return uploadToCloudinary(file, folder, publicId);
}
