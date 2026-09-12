import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ORDER_REFERENCE_BUCKET,
  referenceObjectPath,
} from "./references";

export async function storeOrderReferences(
  supabase: SupabaseClient,
  bakeryId: string,
  orderId: string,
  files: File[],
) {
  const uploaded: string[] = [];

  for (const file of files) {
    const path = referenceObjectPath(bakeryId, orderId, file);
    const { error } = await supabase.storage
      .from(ORDER_REFERENCE_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("storeOrderReferences: upload failed", error);
      if (uploaded.length > 0) {
        await supabase.storage.from(ORDER_REFERENCE_BUCKET).remove(uploaded);
      }
      return "referenceUploadFailed";
    }

    uploaded.push(path);
  }

  const { error } = await supabase.from("order_references").insert(
    uploaded.map((storagePath) => ({
      bakery_id: bakeryId,
      order_id: orderId,
      kind: "image",
      storage_path: storagePath,
    })),
  );

  if (error) {
    console.error("storeOrderReferences: insert failed", error);
    await supabase.storage.from(ORDER_REFERENCE_BUCKET).remove(uploaded);
    return "referenceUploadFailed";
  }

  return null;
}
