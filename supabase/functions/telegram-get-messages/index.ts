import { createClient } from "../shared/createClient.ts";
import { supabase } from "../shared/supabaseClient.ts";

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const body = await req.json();
    const { userId, chatId, limit = 50 } = body || {};

    if (!userId || !chatId) {
      return new Response(JSON.stringify({ error: "userId and chatId are required" }), { status: 400 });
    }

    const { data: sessionRows, error: fetchErr } = await supabase
      .from("telegram_sessions")
      .select("session")
      .eq("user_id", userId)
      .limit(1);

    if (fetchErr) {
      console.error("DB fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message || fetchErr }), { status: 500 });
    }

    if (!sessionRows || sessionRows.length === 0) {
      return new Response(JSON.stringify({ error: "session not found" }), { status: 404 });
    }

    const sessionString = sessionRows[0].session;
    const { client } = await createClient(sessionString);
    await client.connect();

    // chatId may be numeric or string, convert
    const target = chatId;

    const messages = [];
    // fetch messages via client.getMessages or iterMessages
    for await (const msg of client.iterMessages(target, { limit })) {
      messages.push({
        id: msg.id,
        text: msg.message || null,
        date: msg.date ? msg.date.toString() : null,
        outgoing: !!msg.out
      });
    }

    return new Response(JSON.stringify({ messages }), { status: 200 });
  } catch (err) {
    console.error("telegram-get-messages error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}