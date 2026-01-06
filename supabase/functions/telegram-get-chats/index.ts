import { createClient } from "../shared/createClient.ts";
import { supabase } from "../shared/supabaseClient.ts";

export default async function handler(req: Request) {
  try {
    // allow GET or POST
    const body = req.method === "POST" ? await req.json() : Object.fromEntries(new URL(req.url).searchParams);
    const { userId } = body || {};

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), { status: 400 });
    }

    const { data: sessionRows, error: fetchErr } = await supabase
      .from("telegram_sessions")
      .select("session, phone")
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

    // fetch dialogs/chats
    const dialogs = [];
    for await (const dialog of client.iterDialogs({ limit: 100 })) {
      // dialog has entity, id, title, unreadCount, lastMessage
      const lastMessage = dialog.message;
      dialogs.push({
        id: dialog.id?.toString?.() || null,
        title: dialog.title || (dialog.entity) || null,
        type: dialog.isUser ? "user" : dialog.isChannel ? "channel" : dialog.isGroup ? "group" : "unknown",
        unreadCount: dialog.unreadCount || 0,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          text: lastMessage.message || null,
          date: lastMessage.date ? lastMessage.date.toString() : null
        } : null
      });
    }

    return new Response(JSON.stringify({ chats: dialogs }), { status: 200 });
  } catch (err) {
    console.error("telegram-get-chats error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}