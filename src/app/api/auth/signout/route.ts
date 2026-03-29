import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", getAppUrl()), {
    status: 303,
  });
}
