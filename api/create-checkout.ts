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

function safeStringifyError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: typeof error === "string" ? error : "Unknown error",
    error,
  };
}

function getBaseUrl(req: IncomingMessage): string | null {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) return null;
  return `${proto === "https" ? "https" : "http"}://${host}`;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const requestId = `ls_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  try {
    if (req.method === "OPTIONS") {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 200;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed", error: { requestId } });
      return;
    }

    const rawBody = await readRawBody(req);
    let body: JsonRecord = {};
    try {
      body = (rawBody.length ? JSON.parse(rawBody.toString("utf8")) : {}) as JsonRecord;
    } catch (error) {
      console.error("[create-checkout] invalid JSON body", { requestId, error: safeStringifyError(error) });
      sendJson(res, 400, { message: "Invalid JSON body", error: safeStringifyError(error) });
      return;
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const monthlyVariantId = process.env.LEMON_VARIANT_MONTHLY;
    const yearlyVariantId = process.env.LEMON_VARIANT_YEARLY;

    if (!apiKey || !storeId || !monthlyVariantId || !yearlyVariantId) {
      const missing = [
        !apiKey ? "LEMON_SQUEEZY_API_KEY" : null,
        !storeId ? "LEMON_SQUEEZY_STORE_ID" : null,
        !monthlyVariantId ? "LEMON_VARIANT_MONTHLY" : null,
        !yearlyVariantId ? "LEMON_VARIANT_YEARLY" : null,
      ].filter(Boolean);
      console.error("[create-checkout] missing env", { requestId, missing });
      sendJson(res, 500, { message: "Missing server configuration", error: { requestId, missing } });
      return;
    }

    const planRaw = body.plan ?? body.billing_cycle ?? "monthly";
    const plan = planRaw === "yearly" ? "yearly" : "monthly";
    const variantId = plan === "yearly" ? yearlyVariantId : monthlyVariantId;

    const bodyUserId =
      typeof body.user_id === "string"
        ? body.user_id
        : typeof body.userId === "string"
          ? body.userId
          : null;

    const token = getBearerToken(req);
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      "";

    let userId: string | null = bodyUserId;
    if (token && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        console.error("[create-checkout] unauthorized token", {
          requestId,
          error: safeStringifyError(error),
        });
        sendJson(res, 401, { message: "Unauthorized", error: { requestId } });
        return;
      }
      userId = data.user.id;
      if (bodyUserId && bodyUserId !== userId) {
        console.error("[create-checkout] user_id mismatch", { requestId, bodyUserId, userId });
        sendJson(res, 401, { message: "Unauthorized", error: { requestId } });
        return;
      }
    }

    if (!userId) {
      console.error("[create-checkout] missing user_id", { requestId, bodyKeys: Object.keys(body) });
      sendJson(res, 400, { message: "Missing user_id", error: { requestId } });
      return;
    }

    const shouldRedirect = body.redirect === true || body.redirect === "true";
    const baseUrl = getBaseUrl(req);
    const redirectUrl =
      typeof body.redirect_url === "string"
        ? body.redirect_url
        : baseUrl
          ? `${baseUrl}/`
          : "https://www.subsruby.com/";

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          product_options: redirectUrl ? { redirect_url: redirectUrl } : undefined,
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

    let response: Response;
    try {
      response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("[create-checkout] fetch failed", {
        requestId,
        plan,
        storeId,
        variantId,
        error: safeStringifyError(error),
      });
      sendJson(res, 502, { message: "Failed to reach Lemon Squeezy", error: safeStringifyError(error) });
      return;
    }

    const responseText = await response.text();
    let data: JsonRecord = {};
    try {
      data = responseText ? (JSON.parse(responseText) as JsonRecord) : {};
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      const detail = pickFirstErrorDetail(data) ?? "Lemon Squeezy API Error";
      console.error("[create-checkout] Lemon error", {
        requestId,
        plan,
        storeId,
        variantId,
        status: response.status,
        detail,
        data,
      });
      sendJson(res, 502, {
        message: detail,
        error: {
          requestId,
          status: response.status,
          data,
        },
      });
      return;
    }

    const checkoutUrl = pickCheckoutUrl(data);

    if (shouldRedirect && checkoutUrl) {
      sendRedirect(res, checkoutUrl);
      return;
    }

    if (!checkoutUrl) {
      console.error("[create-checkout] missing checkout url", {
        requestId,
        plan,
        storeId,
        variantId,
        status: response.status,
        data,
      });
      sendJson(res, 502, { message: "Checkout URL not returned", error: { requestId, data } });
      return;
    }

    sendJson(res, 200, { checkoutUrl });
  } catch (error) {
    console.error("[create-checkout] unhandled error", { requestId, error: safeStringifyError(error) });
    const message = error instanceof Error ? error.message : "Internal Server Error";
    sendJson(res, 500, { message, error: safeStringifyError(error) });
  }
}
