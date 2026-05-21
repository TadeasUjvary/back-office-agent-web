/**
 * Server-side web fetch tool — gives the agent real internet access without
 * any external API key. Used for "podívej se na tento Sreality odkaz" /
 * "co se píše na této URL" type requests.
 */

const MAX_BYTES = 200_000;
const MAX_CHARS = 8000;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
// Block private/internal IP ranges to prevent SSRF
const BLOCKED_HOSTS = [/^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^0\.0\.0\.0$/, /^localhost$/i];

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().slice(0, 200) : null;
}

export async function fetchWebUrl(url: string): Promise<{
  ok: boolean;
  url: string;
  finalUrl?: string;
  status?: number;
  contentType?: string;
  title?: string | null;
  textPreview?: string;
  truncated?: boolean;
  error?: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, url, error: "Neplatná URL." };
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, url, error: "Povoleny jsou jen http:// a https://." };
  }
  if (BLOCKED_HOSTS.some((re) => re.test(parsed.hostname))) {
    return { ok: false, url, error: "Hostname patří do privátní sítě a je zablokovaný." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "BackOfficeAgent/1.0 (+https://back-office-agent-web.vercel.app)",
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5",
        "Accept-Language": "cs,en;q=0.7",
      },
    });
    const contentType = res.headers.get("content-type") ?? "";
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (received < MAX_BYTES) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
      }
      await reader.cancel().catch(() => {});
    }
    const buf = chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length);
      merged.set(acc, 0);
      merged.set(c, acc.length);
      return merged;
    }, new Uint8Array());

    // ── Charset detection: HTTP header → meta charset → BOM → utf-8 default
    let charset = (contentType.match(/charset=([^;\s]+)/i)?.[1] ?? "").toLowerCase();
    if (!charset) {
      // Sniff <meta charset="..."> or <meta http-equiv="content-type" content="...; charset=...">
      const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
      const m =
        head.match(/<meta[^>]+charset\s*=\s*["']?([a-zA-Z0-9\-_]+)/i)?.[1] ??
        head.match(/<meta[^>]+content=["'][^"']*charset=([a-zA-Z0-9\-_]+)/i)?.[1];
      if (m) charset = m.toLowerCase();
    }
    if (!charset) charset = "utf-8";
    // Normalize aliases
    if (charset === "win-1250" || charset === "cp1250" || charset === "x-cp1250") charset = "windows-1250";
    let body: string;
    try {
      body = new TextDecoder(charset, { fatal: false }).decode(buf);
    } catch {
      body = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    }

    if (contentType.includes("application/json")) {
      const truncated = body.length > MAX_CHARS;
      return {
        ok: res.ok,
        url,
        finalUrl: res.url,
        status: res.status,
        contentType,
        textPreview: body.slice(0, MAX_CHARS),
        truncated,
      };
    }

    const title = extractTitle(body);
    const text = stripHtml(body);
    const truncated = text.length > MAX_CHARS;
    return {
      ok: res.ok,
      url,
      finalUrl: res.url,
      status: res.status,
      contentType,
      title,
      textPreview: text.slice(0, MAX_CHARS),
      truncated,
    };
  } catch (e) {
    return {
      ok: false,
      url,
      error: e instanceof Error ? e.message : "Neznámá chyba při fetch.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
