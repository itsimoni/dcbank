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
      password,
    } = body;

    if (!userId || !password) {
      return NextResponse.json(
        { error: "Missing userId or password" },
        { status: 400 }
      );
    }

    // 1. First, check if the user exists and get current password
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("password")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching user:", fetchError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 2. Check if password field is empty or null
    const currentPassword = userData.password;
    
    if (!currentPassword || currentPassword.trim() === "") {
      // 3. Update the password field if empty
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          password: password 
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating password:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      console.log(`Updated empty password for user: ${userId}`);
      return NextResponse.json({ 
        success: true, 
        message: "Password field updated" 
      });
    } else {
      // Password already exists, do nothing
      console.log(`Password already exists for user: ${userId}`);
      return NextResponse.json({ 
        success: true, 
        message: "Password already exists, no update needed" 
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}