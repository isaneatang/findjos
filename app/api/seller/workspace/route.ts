import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

// Returns a verified seller session for every workspace operation.
async function requireSeller() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).single();
  if (profile?.role !== "seller" && profile?.role !== "admin") return { supabase, user: null, response: NextResponse.json({ error: "Seller access required." }, { status: 403 }) };
  return { supabase, user, profile, response: null };
}

// Loads the seller profile, owned businesses, products, and pending edits.
export async function GET() {
  const { supabase, user, profile, response } = await requireSeller();
  if (response || !user) return response;
  const { data: businesses, error } = await supabase.from("businesses").select("*, category:categories(name), products(*)").eq("owner_id", user.id).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: edits } = await supabase.from("listing_edits").select("id,business_id,changes,status,created_at").eq("seller_id", user.id).order("created_at", { ascending: false });
  return NextResponse.json({ profile, businesses, edits: edits || [] });
}

// Creates a seller-owned draft business that remains private until an admin publishes it.
export async function POST(request: Request) {
  const { supabase, user, response } = await requireSeller();
  if (response || !user) return response;
  const body = await request.json() as { name?: string; category?: string; description?: string; area?: string; phone?: string; whatsapp?: string; landmark?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "Business name is required." }, { status: 400 });
  const { data: category } = await supabase.from("categories").select("id").eq("name", body.category || "Services").single();
  const slug = `${body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const { data, error } = await supabase.from("businesses").insert({ owner_id: user.id, category_id: category?.id, name: body.name.trim(), slug, description: body.description || "", area: body.area || "Terminus", phone: body.phone || null, whatsapp: body.whatsapp || null, landmark: body.landmark || null, status: "draft", source: "seller" }).select("*, category:categories(name), products(*)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ business: data }, { status: 201 });
}

// Submits seller profile changes for administrator approval without changing public data.
export async function PATCH(request: Request) {
  const { supabase, user, response } = await requireSeller();
  if (response || !user) return response;
  const body = await request.json() as { businessId?: string; changes?: Record<string, string> };
  if (!body.businessId || !body.changes || !Object.keys(body.changes).length) return NextResponse.json({ error: "Business and changes are required." }, { status: 400 });
  const allowedKeys = ["name", "description", "phone", "whatsapp", "address", "landmark", "area"];
  const safeChanges = Object.fromEntries(Object.entries(body.changes).filter(([key, value]) => allowedKeys.includes(key) && typeof value === "string"));
  const { data: business } = await supabase.from("businesses").select("id").eq("id", body.businessId).eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const { data, error } = await supabase.from("listing_edits").insert({ business_id: body.businessId, seller_id: user.id, changes: safeChanges }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ edit: data }, { status: 201 });
}
