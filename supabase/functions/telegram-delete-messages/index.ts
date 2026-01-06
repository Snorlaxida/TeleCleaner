import { createClient } from "../shared/createClient.ts";
import { supabase } from "../shared/supabaseClient.ts";

export default async function handler(req: Request) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const body = await req.json();
    const { userId, chatId, messageIds } = body || {};

    if (!userId || !chatId || !Array.isArray(messageIds) || messageIds.length === 0) {
      return new Response(JSON.stringify({ error: "userId, chatId and messageIds are required" }), { status: 400 });
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

    // call deleteMessages (entity, messageIds)
    const result = await client.deleteMessages(chatId, messageIds, { revoke: false });
    // result may be array of deleted ids or boolean
    let deletedCount = 0;
    if (Array.isArray(result)) {
      deletedCount = result.length;
    } else if (result === true) {
      deletedCount = messageIds.length;
    } // In all other cases (including object/null/undefined), deletedCount remains 0

    return new Response(JSON.stringify({ success: true, deletedCount }), { status: 200 });
  } catch (err) {
    console.error("telegram-delete-messages error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}