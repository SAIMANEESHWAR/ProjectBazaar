import { prepAdminApi } from "../../../services/preparationApi";

export type SdMediaKind = "image" | "pdf" | "thumbnail";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function defaultContentType(mediaKind: SdMediaKind): string {
  if (mediaKind === "pdf") return "application/pdf";
  return "image/png";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const base64 = result.includes(",") ? result.split(",", 2)[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadSdMediaFile(
  file: File,
  mediaKind: SdMediaKind,
): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File is too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB).`,
    );
  }

  const contentType = file.type || defaultContentType(mediaKind);
  const fileBase64 = await fileToBase64(file);

  const result = await prepAdminApi.uploadSystemDesignMedia(
    file.name,
    contentType,
    fileBase64,
    mediaKind,
  );

  if (!result?.publicUrl) {
    throw new Error(`Failed to upload ${file.name}`);
  }

  return result.publicUrl;
}
