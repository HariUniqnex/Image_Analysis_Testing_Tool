import { uploadToCloudinary } from "./uploadToCloudinary";

// components/uploadForClaid.ts
export async function uploadForClaid(base64Image: string): Promise<string> {
  try {
    // Use your existing Cloudinary upload function
    const cloudinaryUrl = await uploadToCloudinary(base64Image);
    
    // Ensure it's a direct image URL (not a Cloudinary transformation URL)
    const directUrl = cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
    
    return directUrl;
  } catch (error) {
    console.error('Failed to upload image for Claid:', error);
    throw error;
  }
}   