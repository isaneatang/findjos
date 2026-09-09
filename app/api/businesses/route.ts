import { NextResponse } from "next/server";
import { businesses as demoBusinesses, type Business } from "../../data";
import { isSupabaseConfigured } from "../../../lib/supabase/config";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type SupabaseBusiness = {
  id: string;
  name: string;
  description: string;
  area: string;
  landmark: string | null;
  hours: Record<string, string>;
  tags: string[];
  accent: string;
  verified: boolean;
  featured: boolean;
  category: { name: string } | { name: string }[] | null;
};

// Converts the relational Supabase row into the small public card model.
function toPublicBusiness(row: SupabaseBusiness): Business {
  const category = Array.isArray(row.category) ? row.category[0]?.name : row.category?.name;
  const closingTime = row.hours?.closing || "Hours to confirm";

  return {
    id: row.id,
    name: row.name,
    category: category || "Services",
    description: row.description,
    area: row.landmark || row.area,
    hours: closingTime === "Hours to confirm" ? closingTime : `Open until ${closingTime}`,
    rating: "New",
    tags: row.tags || [],
    accent: row.accent,
    verified: row.verified,
    featured: row.featured,
  };
}

// Reads published businesses when Supabase is configured and preserves demo mode otherwise.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ businesses: demoBusinesses, source: "demo" });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("id,name,description,area,landmark,hours,tags,accent,verified,featured,category:categories(name)")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ businesses: (data as SupabaseBusiness[]).map(toPublicBusiness), source: "supabase" });
}
