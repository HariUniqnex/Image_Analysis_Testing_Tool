// utils/uploadToCloudinary.ts
export async function uploadToCloudinary(fileOrDataUrl: File | string): Promise<string> {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const formData = new FormData();
  if (typeof fileOrDataUrl === "string") {
    // data URL
    const res = await fetch(fileOrDataUrl);
    const blob = await res.blob();
    formData.append("file", blob, "upload.jpg");
  } else {
    // File object
    formData.append("file", fileOrDataUrl);
  }
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  return data.secure_url as string;
}