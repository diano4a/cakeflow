import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  ORDER_REFERENCE_BUCKET,
  type OrderReference,
} from "./references";
import type { ListOrder } from "./list";

export type OrderListItem = ListOrder;

export type OrderDetail = Omit<ListOrder, "assigneeName" | "updatedAt" | "deadlineAt"> & {
  bakeryId: string;
  deadlineAt: string;
  shape: string | null;
  decorationNotes: string | null;
  inscription: string | null;
  price: number | null;
  prepayment: number;
  managerNotes: string | null;
  updatedAt: string;
  assigneeName: string | null;
};

type ProfileName = { full_name: string | null };

type OrderRow = {
  id: string;
  bakery_id?: string;
  order_number: number;
  product_type: string;
  status: string;
  deadline_at: string;
  updated_at: string;
  quantity: number | null;
  weight_kg: number | string | null;
  size_note: string | null;
  shape?: string | null;
  decoration_notes?: string | null;
  inscription?: string | null;
  price?: number | string | null;
  prepayment?: number | string;
  manager_notes?: string | null;
  profiles: ProfileName | ProfileName[] | null;
};

function profileName(profiles: OrderRow["profiles"]): string | null {
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const name = profile?.full_name?.trim();
  return name ? name : null;
}

function toListItem(row: OrderRow): ListOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    productType: row.product_type,
    status: row.status,
    deadlineAt: row.deadline_at,
    updatedAt: row.updated_at,
    quantity: row.quantity,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    sizeNote: row.size_note,
    assigneeName: profileName(row.profiles),
  };
}

export async function listOrders(bakeryId: string): Promise<ListOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, product_type, status, deadline_at, updated_at, quantity, weight_kg, size_note, profiles!assignee_id(full_name)",
    )
    .eq("bakery_id", bakeryId);

  if (error) {
    console.error("listOrders: failed to read orders", error);
    return [];
  }

  return (data ?? []).map((row) => toListItem(row as OrderRow));
}

export async function getOrder(
  bakeryId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, bakery_id, order_number, product_type, status, deadline_at, updated_at, shape, size_note, weight_kg, quantity, decoration_notes, inscription, price, prepayment, manager_notes, profiles!assignee_id(full_name)",
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

  const row = data as OrderRow;
  const list = toListItem(row);

  return {
    ...list,
    bakeryId: row.bakery_id ?? bakeryId,
    deadlineAt: row.deadline_at,
    shape: row.shape ?? null,
    decorationNotes: row.decoration_notes ?? null,
    inscription: row.inscription ?? null,
    price: row.price == null ? null : Number(row.price),
    prepayment: Number(row.prepayment ?? 0),
    managerNotes: row.manager_notes ?? null,
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
