import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, is_online, last_seen } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("user_presence")
      .upsert(
        {
          user_id,
          is_online,
          last_seen,
          updated_at: now,
          created_at: now,
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error upserting user presence:", error);
      return NextResponse.json(
        { error: "Failed to update presence" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
