import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      email,
      firstName,
      lastName,
      age,
      password,
    } = body;

    // Use upsert instead of insert to handle existing users
    const { error } = await supabase.from("users").upsert({
      id: userId,
      auth_user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      age: Number(age),
      password: password, // ⚠️ Plain text - DEVELOPMENT ONLY
      bank_origin: "Malta Global Crypto Bank",
      kyc_status: "not_started",
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'id', // Handle duplicate id
      ignoreDuplicates: false // Update if exists
    });

    if (error) {
      console.error("SERVICE ROLE UPSERT ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}