import crypto from "crypto";

export const getCloudinaryPublicId = (imageUrl: string) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  const url = new URL(imageUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const uploadIndex = pathParts.indexOf("upload");

  if (
    url.hostname !== "res.cloudinary.com" ||
    pathParts[0] !== cloudName ||
    uploadIndex === -1
  ) {
    throw new Error("Invalid Cloudinary image URL");
  }

  const partsAfterUpload = pathParts.slice(uploadIndex + 1);
  const versionIndex = partsAfterUpload.findIndex((part) => /^v\d+$/.test(part));
  const publicIdParts =
    versionIndex === -1 ? partsAfterUpload : partsAfterUpload.slice(versionIndex + 1);
  const publicIdWithExtension = publicIdParts.join("/");

  if (!publicIdWithExtension) {
    throw new Error("Cloudinary public id was not found");
  }

  return decodeURIComponent(publicIdWithExtension.replace(/\.[^/.]+$/, ""));
};

export const deleteFromCloudinary = async (imageUrl: string) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary delete credentials are not configured");
  }

  const publicId = getCloudinaryPublicId(imageUrl);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp,
    api_key: apiKey,
    signature,
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body,
  });
  const data = await response.json();

  if (!response.ok || (data.result !== "ok" && data.result !== "not found")) {
    throw new Error(data.error?.message || "Failed to delete Cloudinary image");
  }

  return data;
};
