// @ts-nocheck
import { createClient } from "../shared/createClient.ts";
import { Api } from "npm:telegram@2.24.11";

export default async function handler(req: Request) {
  try {
    console.log('send-code: start');

    if (req.method !== "POST") {
      console.log('send-code: wrong method', req.method);
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const body = await req.json();
    console.log('send-code: body', body);
    const { userId, phoneNumber } = body || {};

    console.log('send-code: before createClient');
    const { client } = await createClient("");
    console.log('send-code: after createClient, before connect');
    await client.connect();
    console.log('send-code: after connect, before SendCode');

    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber,
        apiId: Number(process.env.TG_API_ID),
        apiHash: process.env.TG_API_HASH || "",
        settings: new Api.CodeSettings({}),
      })
    );
    console.log('send-code: after SendCode', result);

    const phoneCodeHash = (result as any)?.phoneCodeHash || (result as any)?.phone_code_hash || null;
    console.log('send-code: done, hash', phoneCodeHash);

    return new Response(JSON.stringify({ phoneCodeHash }), { status: 200 });
  } catch (err) {
    console.error("telegram-send-code error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}