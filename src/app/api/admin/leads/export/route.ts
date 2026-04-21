import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const planFilter = searchParams.get("plan");

  const supabase = await createServiceClient();
  let query = supabase
    .from("checkout_leads")
    .select(
      "id, email, plan_type, payment_method, has_bump, tenant_id, status, created_at, completed_at, external_reference, mp_preference_id, ip_address",
    )
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (planFilter) query = query.eq("plan_type", planFilter);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "id",
    "email",
    "plan_type",
    "payment_method",
    "has_bump",
    "tenant_id",
    "status",
    "created_at",
    "completed_at",
    "external_reference",
    "mp_preference_id",
    "ip_address",
  ];

  const rows = [
    header.join(","),
    ...(data ?? []).map((r) =>
      [
        r.id,
        r.email,
        r.plan_type,
        r.payment_method,
        r.has_bump,
        r.tenant_id,
        r.status,
        r.created_at,
        r.completed_at,
        r.external_reference,
        r.mp_preference_id,
        r.ip_address,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const csv = "\uFEFF" + rows.join("\r\n"); // BOM pra Excel abrir em UTF-8
  const timestamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="checkout-leads-${timestamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
