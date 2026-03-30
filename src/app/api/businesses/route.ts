import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id, business_name, google_place_id, google_account_id, google_location_id, auto_reply_enabled, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ businesses: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessName, googlePlaceId } = body;

    if (!businessName || typeof businessName !== "string" || businessName.trim().length === 0) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        business_name: businessName.trim(),
        google_place_id: googlePlaceId || null,
        tone_description: "friendly and professional",
        example_responses: [],
        negative_review_strategy: "apologize_resolve",
        auto_reply_enabled: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (err) {
    console.error("Create business error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create business" },
      { status: 500 }
    );
  }
}
