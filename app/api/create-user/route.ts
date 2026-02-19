import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, serviceRoleKey!);

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

    const userData = {
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      age: Number(age),
      password: password,
      bank_origin: "Malta Global Crypto Bank",
    };

    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update(userData)
      .eq("id", userId)
      .select();

    if (updateError || !updateData || updateData.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: retryData, error: retryError } = await supabase
        .from("users")
        .update(userData)
        .eq("id", userId)
        .select();

      if (retryError || !retryData || retryData.length === 0) {
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          auth_user_id: userId,
          ...userData,
          kyc_status: "not_started",
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("SERVICE ROLE INSERT ERROR:", insertError);
          return NextResponse.json(
            { error: insertError.message },
            { status: 400 }
          );
        }
      }
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