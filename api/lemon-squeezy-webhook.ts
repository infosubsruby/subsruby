import type { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS, HEAD, GET",
};

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(payload));
}

function sendText(res: ServerResponse, status: number, body: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(body);
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function safeStringId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function getNestedSubscriptionId(data: Record<string, unknown>, attrs: Record<string, unknown>): string | null {
  const directId = data.id;
  if (directId != null) return String(directId);

  const firstItem = attrs.first_subscription_item;
  if (isRecord(firstItem)) {
    const nested = firstItem.subscription_id ?? firstItem.id;
    if (nested != null) return String(nested);
  }

  const nested = attrs.subscription_id;
  if (nested != null) return String(nested);

  return null;
}

function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : String(message ?? "");
  }
  return "";
}

function isMissingRelation(error: unknown, relation: string): boolean {
  const message = errorMessage(error);
  if (!message) return false;
  return message.includes(relation) && message.includes("does not exist");
}

function extractUserIdFromMeta(meta: Record<string, unknown>): string | null {
  const customData = meta.custom_data;
  if (isRecord(customData)) {
    const fromSnake = safeStringId(customData.user_id);
    if (fromSnake) return fromSnake;
    const fromCamel = safeStringId(customData.userId);
    if (fromCamel) return fromCamel;
    const fromUid = safeStringId(customData.uid);
    if (fromUid) return fromUid;
  }

  const custom = meta.custom;
  if (isRecord(custom)) {
    const fromSnake = safeStringId(custom.user_id);
    if (fromSnake) return fromSnake;
    const fromCamel = safeStringId(custom.userId);
    if (fromCamel) return fromCamel;
  }

  return null;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    console.log("1. WEBHOOK TETİKLENDİ");

    if (req.method === "OPTIONS") {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 200;
      res.end();
      return;
    }

    if (req.method === "HEAD" || req.method === "GET") {
      sendJson(res, 200, { message: "OK" });
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { error: `Method not allowed: ${req.method ?? "unknown"}` });
      return;
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      sendJson(res, 500, { error: "Webhook secret not configured" });
      return;
    }

    const signatureHeader = req.headers["x-signature"];
    const signature = safeString(Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader);
    if (!signature) {
      sendJson(res, 401, { error: "No signature provided" });
      return;
    }

    const rawBody = await readRawBody(req);
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!timingSafeEqualHex(expected, signature)) {
      sendJson(res, 401, { error: "Invalid signature" });
      return;
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as JsonRecord;

    const meta = payload.meta;
    const data = payload.data;
    if (!isRecord(meta) || !isRecord(data)) {
      sendJson(res, 400, { error: "Invalid payload" });
      return;
    }

    const eventName = safeString(meta.event_name);
    const userId = extractUserIdFromMeta(meta);

    console.log("2. İMZA DOĞRULANDI, Payload:", eventName);
    console.log("3. ALINAN USER ID:", userId);

    if (!eventName) {
      sendJson(res, 400, { error: "Missing event_name" });
      return;
    }

    const isSubscriptionEvent =
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled";

    if (!isSubscriptionEvent) {
      sendJson(res, 200, { message: "Ignored" });
      return;
    }

    if (!userId) {
      console.error("[lemon-webhook] Missing user_id in meta.custom_data", {
        eventName,
        type: data.type,
        id: data.id,
      });
      sendJson(res, 400, { error: "Missing meta.custom_data.user_id" });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      sendJson(res, 500, { error: "Supabase not configured" });
      return;
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const attributes = data.attributes;
    const attrs = isRecord(attributes) ? attributes : {};

    const lemonCustomerId = attrs.customer_id != null ? String(attrs.customer_id) : null;
    const subscriptionId = getNestedSubscriptionId(data, attrs);
    const variantId = attrs.variant_id != null ? String(attrs.variant_id) : null;
    const subscriptionStatus = attrs.status != null ? String(attrs.status) : null;
    const currentPeriodEnd =
      (attrs.current_period_end ?? attrs.renews_at ?? attrs.ends_at ?? null) != null
        ? String(attrs.current_period_end ?? attrs.renews_at ?? attrs.ends_at)
        : null;

    const baseUpdate = {
      lemon_squeezy_customer_id: lemonCustomerId,
      subscription_id: subscriptionId,
      variant_id: variantId,
      current_period_end: currentPeriodEnd,
    };

    console.log("4. SUPABASE'E YAZILIYOR...");
    const first = await supabaseAdmin.from("user_subscriptions").upsert(
      {
        user_id: userId,
        status: subscriptionStatus,
        ...baseUpdate,
      },
      { onConflict: "user_id" }
    );

    const error = first.error;

    if (error) {
      if (isMissingRelation(error, "user_subscriptions")) {
        console.error("Webhook DB Yazma Hatası:", error);
        sendJson(res, 500, { error: "user_subscriptions table not found" });
        return;
      }
      console.error("Webhook DB Yazma Hatası:", error);
      sendJson(res, 500, { error: "Database error" });
      return;
    }

    console.log("5. SUPABASE BAŞARILI");
    sendJson(res, 200, { message: "Webhook başarılı" });
  } catch (error) {
    console.error("WEBHOOK FATAL ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    sendJson(res, 500, { error: message });
  }
}
