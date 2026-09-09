import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

type ListingStatus = "draft" | "published" | "hidden" | "archived" | "closed";

type DatabaseListing = {
  id: string;
  name: string;
  description: string;
  area: string;
  hours: Record<string, string> | null;
  tags: string[] | null;
  accent: string;
  status: ListingStatus;
  verified: boolean;
  featured: boolean;
  category: { name: string } | { name: string }[] | null;
};

// Converts a database row into the model consumed by the administrator UI.
function toAdminListing(row: DatabaseListing) {
  const category = Array.isArray(row.category) ? row.category[0]?.name : row.category?.name;
  const labels: Record<ListingStatus, string> = { draft: "Draft", published: "Published", hidden: "Hidden", archived: "Archived", closed: "Closed" };
  return { id: row.id, name: row.name, category: category || "Services", description: row.description, area: row.area, hours: row.hours?.closing ? `Open until ${row.hours.closing}` : "Hours to confirm", rating: "New", tags: row.tags || [], accent: row.accent, status: labels[row.status], verified: row.verified, featured: row.featured };
}

// Confirms that the current Supabase session belongs to an administrator.
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return { supabase, response: null };
}

// Returns all listings for the administrator's review table.
export async function GET() {
  const { supabase, response } = await requireAdmin();
  if (response) return response;
  const { data, error } = await supabase.from("businesses").select("*, category:categories(name)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: (data as DatabaseListing[]).map(toAdminListing) });
}

// Creates a new administrator-owned draft listing after validating required fields.
export async function POST(request: Request) {
  const { supabase, response } = await requireAdmin();
  if (response) return response;
  const body = await request.json() as { name?: string; category?: string; description?: string; area?: string; tags?: string[] };
  if (!body.name?.trim()) return NextResponse.json({ error: "Business name is required." }, { status: 400 });

  const slug = `${body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const { data: category } = await supabase.from("categories").select("id").eq("name", body.category || "Services").single();
  const { data, error } = await supabase.from("businesses").insert({ name: body.name.trim(), slug, category_id: category?.id, description: body.description || "", area: body.area || "Terminus", tags: body.tags || [], status: "draft", source: "admin" }).select("*, category:categories(name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: toAdminListing(data as DatabaseListing) }, { status: 201 });
}

// Updates publication and verification controls from the administrator dashboard.
export async function PATCH(request: Request) {
  const { supabase, response } = await requireAdmin();
  if (response) return response;
  const body = await request.json() as { id?: string; status?: ListingStatus; verified?: boolean; featured?: boolean };
  if (!body.id) return NextResponse.json({ error: "Listing id is required." }, { status: 400 });
  const updates = { ...(body.status ? { status: body.status } : {}), ...(typeof body.verified === "boolean" ? { verified: body.verified, last_reviewed_at: new Date().toISOString() } : {}), ...(typeof body.featured === "boolean" ? { featured: body.featured } : {}), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("businesses").update(updates).eq("id", body.id).select("*, category:categories(name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: toAdminListing(data as DatabaseListing) });
}
