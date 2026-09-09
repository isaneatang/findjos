import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

// Finds the signed-in seller and rejects viewer/admin-less requests.
async function requireSeller() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "seller" && profile?.role !== "admin") return { supabase, user: null, response: NextResponse.json({ error: "Seller access required." }, { status: 403 }) };
  return { supabase, user, response: null };
}

// Returns products belonging to a business owned by the signed-in seller.
export async function GET(request: Request) {
  const { supabase, user, response } = await requireSeller();
  if (response || !user) return response;
  const businessId = new URL(request.url).searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId is required." }, { status: 400 });
  const { data: business } = await supabase.from("businesses").select("id").eq("id", businessId).eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const { data, error } = await supabase.from("products").select("*").eq("business_id", businessId).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// Creates a pending product for a seller-owned business.
export async function POST(request: Request) {
  const { supabase, user, response } = await requireSeller();
  if (response || !user) return response;
  const body = await request.json() as { businessId?: string; name?: string; description?: string; price?: string };
  if (!body.businessId || !body.name?.trim()) return NextResponse.json({ error: "Business and product name are required." }, { status: 400 });
  const { data: business } = await supabase.from("businesses").select("id").eq("id", body.businessId).eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const { data, error } = await supabase.from("products").insert({ business_id: body.businessId, name: body.name.trim(), description: body.description || "", price: body.price || null, status: "pending" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}

// Toggles availability only for a product owned by the current seller.
export async function PATCH(request: Request) {
  const { supabase, user, response } = await requireSeller();
  if (response || !user) return response;
  const body = await request.json() as { id?: string; available?: boolean };
  if (!body.id || typeof body.available !== "boolean") return NextResponse.json({ error: "Product id and availability are required." }, { status: 400 });
  const { data, error } = await supabase.from("products").update({ available: body.available, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}
