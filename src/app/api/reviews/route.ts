import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessId, reviewerName, rating, reviewText, reviewDate } = body;

    if (!businessId || !reviewerName || !rating) {
      return NextResponse.json({ error: "businessId, reviewerName, and rating are required" }, { status: 400 });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Verify the business belongs to the user
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        business_id: businessId,
        reviewer_name: reviewerName.trim(),
        rating,
        review_text: reviewText?.trim() || null,
        review_date: reviewDate || new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("Create review error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create review" },
      { status: 500 }
    );
  }
}
