import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  ORDER_REFERENCE_BUCKET,
  type OrderReference,
} from "./references";

export type OrderListItem = {
  id: string;
  productType: string;
  status: string;
  deadlineAt: string;
};

export type OrderDetail = OrderListItem & {
  bakeryId: string;
  shape: string | null;
  sizeNote: string | null;
  weightKg: number | null;
  quantity: number | null;
  decorationNotes: string | null;
  inscription: string | null;
  price: number | null;
  prepayment: number;
  managerNotes: string | null;
};

export async function listOrders(bakeryId: string): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, product_type, status, deadline_at")
    .eq("bakery_id", bakeryId)
    .order("deadline_at", { ascending: true });

  if (error) {
    console.error("listOrders: failed to read orders", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    productType: row.product_type,
    status: row.status,
    deadlineAt: row.deadline_at,
  }));
}

export async function getOrder(
  bakeryId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, bakery_id, product_type, status, deadline_at, shape, size_note, weight_kg, quantity, decoration_notes, inscription, price, prepayment, manager_notes",
    )
    .eq("bakery_id", bakeryId)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("getOrder: failed to read order", error);
    return null;
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    bakeryId: data.bakery_id,
    productType: data.product_type,
    status: data.status,
    deadlineAt: data.deadline_at,
    shape: data.shape,
    sizeNote: data.size_note,
    weightKg: data.weight_kg === null ? null : Number(data.weight_kg),
    quantity: data.quantity,
    decorationNotes: data.decoration_notes,
    inscription: data.inscription,
    price: data.price === null ? null : Number(data.price),
    prepayment: Number(data.prepayment),
    managerNotes: data.manager_notes,
  };
}

export async function listOrderReferences(
  bakeryId: string,
  orderId: string,
): Promise<OrderReference[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_references")
    .select("id, storage_path")
    .eq("bakery_id", bakeryId)
    .eq("order_id", orderId)
    .eq("kind", "image")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listOrderReferences: failed to read references", error);
    return [];
  }

  const rows = (data ?? []).filter((row) => row.storage_path);
  if (rows.length === 0) {
    return [];
  }

  const signed = await Promise.all(
    rows.map(async (row) => {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(ORDER_REFERENCE_BUCKET)
        .createSignedUrl(row.storage_path, 60 * 60);
      if (signedError || !signedData?.signedUrl) {
        console.error(
          "listOrderReferences: failed to sign object",
          signedError,
        );
        return null;
      }
      return {
        id: row.id,
        storagePath: row.storage_path,
        url: signedData.signedUrl,
      };
    }),
  );

  return signed.filter((row): row is OrderReference => row !== null);
}
