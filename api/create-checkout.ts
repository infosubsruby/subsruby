import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(payload));
}

function sendRedirect(res: ServerResponse, location: string) {
  res.statusCode = 303;
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader("Location", location);
  res.end();
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickFirstErrorDetail(payload: JsonRecord): string | null {
  const errors = payload.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first = errors[0];
  if (!isRecord(first)) return null;
  const detail = first.detail;
  return typeof detail === "string" ? detail : null;
}

function pickCheckoutUrl(payload: JsonRecord): string | null {
  const data = payload.data;
  if (!isRecord(data)) return null;
  const attributes = data.attributes;
  if (!isRecord(attributes)) return null;
  const url = attributes.url;
  return typeof url === "string" ? url : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "OPTIONS") {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 200;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed" });
      return;
    }

    const rawBody = await readRawBody(req);
    const body = (rawBody.length ? JSON.parse(rawBody.toString("utf8")) : {}) as JsonRecord;

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const monthlyVariantId = process.env.LEMON_VARIANT_MONTHLY;
    const yearlyVariantId = process.env.LEMON_VARIANT_YEARLY;

    if (!apiKey || !storeId || !monthlyVariantId || !yearlyVariantId) {
      sendJson(res, 500, { message: "Missing server configuration" });
      return;
    }

    const planRaw = body.plan ?? body.billing_cycle ?? "monthly";
    const plan = planRaw === "yearly" ? "yearly" : "monthly";
    const variantId = plan === "yearly" ? yearlyVariantId : monthlyVariantId;

    const bodyUserId = typeof body.user_id === "string" ? body.user_id : null;

    const token = getBearerToken(req);
    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

    let userId: string | null = bodyUserId;
    if (token && supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        sendJson(res, 401, { message: "Unauthorized" });
        return;
      }
      userId = data.user.id;
      if (bodyUserId && bodyUserId !== userId) {
        sendJson(res, 401, { message: "Unauthorized" });
        return;
      }
    }

    if (!userId) {
      sendJson(res, 400, { message: "Missing user_id" });
      return;
    }

    const shouldRedirect = body.redirect === true || body.redirect === "true";

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: {
              user_id: userId,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as JsonRecord;
    if (!response.ok) {
      sendJson(res, 502, { message: pickFirstErrorDetail(data) ?? "Lemon Squeezy API Error" });
      return;
    }

    const checkoutUrl = pickCheckoutUrl(data);

    if (shouldRedirect && checkoutUrl) {
      sendRedirect(res, checkoutUrl);
      return;
    }

    sendJson(res, 200, { checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    sendJson(res, 500, { message });
  }
}
