import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

// Requires the current session to have the database-managed administrator role.
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return { supabase, response: null };
}

// Loads claims, seller edits, and public reports for the administrator queue.
export async function GET() {
  const { supabase, response } = await requireAdmin();
  if (response) return response;
  const [claims, edits, reports] = await Promise.all([
    supabase.from("claims").select("id,business_id,claimant_id,message,status,created_at,businesses(name)").eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("listing_edits").select("id,business_id,seller_id,changes,status,created_at,businesses(name)").eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("reports").select("id,business_id,reason,status,created_at,businesses(name)").in("status", ["open", "reviewing"]).order("created_at", { ascending: false }),
  ]);
  const error = claims.error || edits.error || reports.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: claims.data || [], edits: edits.data || [], reports: reports.data || [] });
}

// Applies an admin decision through the database security-definer review functions.
export async function PATCH(request: Request) {
  const { supabase, response } = await requireAdmin();
  if (response) return response;
  const body = await request.json() as { type?: "claim" | "edit" | "report"; id?: string; decision?: "approved" | "rejected" | "resolved" | "dismissed" };
  if (!body.type || !body.id || !body.decision) return NextResponse.json({ error: "Review type, id, and decision are required." }, { status: 400 });

  if (body.type === "claim" || body.type === "edit") {
    const functionName = body.type === "claim" ? "review_business_claim" : "apply_listing_edit";
    const { error } = await supabase.rpc(functionName, { [body.type === "claim" ? "claim_id" : "edit_id"]: body.id, decision: body.decision });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("reports").update({ status: body.decision }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
