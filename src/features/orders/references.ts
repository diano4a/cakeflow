export const ORDER_REFERENCE_BUCKET = "order-references";
export const MAX_ORDER_REFERENCES = 8;
export const MAX_ORDER_REFERENCE_BYTES = 5 * 1024 * 1024;

export const ORDER_REFERENCE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type OrderReference = {
  id: string;
  storagePath: string;
  url: string;
};

export function readReferenceFiles(formData: FormData) {
  return formData.getAll("reference").filter((value): value is File => {
    return value instanceof File && value.size > 0;
  });
}

export function validateReferenceFiles(files: File[], alreadyAttached = 0) {
  if (alreadyAttached + files.length > MAX_ORDER_REFERENCES) {
    return "referenceTooMany";
  }

  for (const file of files) {
    if (!ORDER_REFERENCE_MIME[file.type]) {
      return "referenceInvalid";
    }
    if (file.size > MAX_ORDER_REFERENCE_BYTES) {
      return "referenceTooLarge";
    }
  }

  return null;
}

export function referenceObjectPath(
  bakeryId: string,
  orderId: string,
  file: File,
) {
  const extension = ORDER_REFERENCE_MIME[file.type] ?? "jpg";
  return `${bakeryId}/${orderId}/${crypto.randomUUID()}.${extension}`;
}
