// @ts-nocheck
// Import gramjs via npm: specifier; Deno doesn't expose named exports consistently,
// so use the default export and pull classes off it.
// eslint-disable-next-line @typescript-eslint/no-var-requires
// deno-lint-ignore no-explicit-any
import TelegramPkg from "npm:telegram@2.24.11";

// deno-lint-ignore no-explicit-any
const { TelegramClient, StringSession } = TelegramPkg as any;

const API_ID = Number(process.env.TG_API_ID);
const API_HASH = process.env.TG_API_HASH;

if (!API_ID || !API_HASH) {
  console.warn("TG_API_ID or TG_API_HASH not set.");
}

/**
 * createClient - returns an object with client and ensureConnected()
 * sessionString may be empty ("") for unauthenticated client
 */
export async function createClient(sessionString = "") {
  const stringSession = new StringSession(sessionString);

  // In Node runtime the low-level transport is provided internally by gramjs.
  const client = new TelegramClient(
    stringSession,
    API_ID,
    API_HASH ?? "",
    {
      connectionRetries: 5,
      // logger: new Logger('info') // optional
    }
  );


  async function ensureConnected() {
    // Start is not needed for auth'd sessions; connect is enough.
    if (!client.connected) {
      await client.connect();
    }
  }

  return { client, stringSession, ensureConnected };
}