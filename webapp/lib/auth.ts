// Autentificare simplă cu o singură parolă comună (nu Supabase Auth — un singur
// "utilizator" pentru toată parohia). Folosește Web Crypto (crypto.subtle),
// disponibil atât în Node runtime cât și în Edge runtime (middleware).

export const SESSION_COOKIE = "enoriasi_session";

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Valoarea pe care trebuie s-o aibă cookie-ul de sesiune ca să fie valid. */
export async function expectedSessionToken(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  const password = process.env.APP_PASSWORD;
  if (!secret || !password) return null;
  return hmacHex(secret, password);
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const real = process.env.APP_PASSWORD;
  if (!real) return false;
  return candidate === real;
}
