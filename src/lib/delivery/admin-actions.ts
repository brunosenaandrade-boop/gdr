"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentAdmin, logAdminAction } from "@/lib/admin/auth";
import { deliverBumpToCustomer } from "./bump-delivery";

type ActionResult = { ok: true } | { ok: false; error: string };

async function getIP(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function updateBumpProduct(
  id: string,
  input: {
    name?: string;
    description?: string;
    hotmart_product_id?: string;
    amount_cents?: number;
    active?: boolean;
  },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const service = await createServiceClient();

  const updates: {
    name?: string;
    description?: string | null;
    hotmart_product_id?: string;
    amount_cents?: number;
    active?: boolean;
  } = {};

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.hotmart_product_id !== undefined) updates.hotmart_product_id = input.hotmart_product_id.trim();
  if (input.amount_cents !== undefined) updates.amount_cents = input.amount_cents;
  if (input.active !== undefined) updates.active = input.active;

  const { error } = await service.from("bump_products").update(updates).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminUserId: admin.userId,
    action: "bump_product.update",
    targetType: "bump_product",
    targetId: id,
    details: updates as Record<string, unknown>,
    ipAddress: await getIP(),
  });

  revalidatePath("/admin/bumps");
  return { ok: true };
}

export async function redeliverBump(purchaseBumpId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const result = await deliverBumpToCustomer({ purchaseBumpId });

  await logAdminAction({
    adminUserId: admin.userId,
    action: "bump.redeliver",
    targetType: "purchase_bump",
    targetId: purchaseBumpId,
    ipAddress: await getIP(),
  });

  revalidatePath("/admin/bumps");
  return result;
}
