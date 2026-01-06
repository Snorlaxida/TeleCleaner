// @ts-nocheck
import { createClient } from "../shared/createClient.ts";
import { supabase } from "../shared/supabaseClient.ts";
import { Api } from "npm:telegram@2.24.11";

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const body = await req.json();
    const { userId, phoneNumber, phoneCodeHash, code } = body || {};

    if (!userId || !phoneNumber || !phoneCodeHash || !code) {
      return new Response(JSON.stringify({ error: "userId, phoneNumber, phoneCodeHash and code are required" }), { status: 400 });
    }

    const { client, stringSession } = await createClient("");
    await client.connect();

    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode: code,
      })
    );

    // Save session string to DB
    const sessionString = stringSession.save();

    // Upsert into telegram_sessions by user_id
    const { data, error } = await supabase
      .from("telegram_sessions")
      .upsert(
        [{ user_id: userId, phone: phoneNumber, session: sessionString }],
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("DB upsert error:", error);
      return new Response(JSON.stringify({ error: error.message || error }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("telegram-sign-in error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}