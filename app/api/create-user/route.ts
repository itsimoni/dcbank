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

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          age: Number(age),
          password: password,
          bank_origin: "Malta Global Crypto Bank",
        })
        .eq("id", userId);

      if (updateError) {
        console.error("SERVICE ROLE UPDATE ERROR:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else {
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        auth_user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        age: Number(age),
        password: password,
        bank_origin: "Malta Global Crypto Bank",
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

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}