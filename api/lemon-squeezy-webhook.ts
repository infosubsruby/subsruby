import type { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

function sendText(res: ServerResponse, status: number, body: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "HEAD" || req.method === "GET") {
      sendText(res, 200, "OK");
      return;
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendText(res, 405, `Method not allowed: ${req.method ?? "unknown"}`);
      return;
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      sendText(res, 500, "Webhook secret not configured");
      return;
    }

    const signatureHeader = req.headers["x-signature"];
    const signature = safeString(Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader);
    if (!signature) {
      sendText(res, 401, "No signature provided");
      return;
    }

    const rawBody = await readRawBody(req);
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!timingSafeEqualHex(expected, signature)) {
      sendText(res, 401, "Invalid signature");
      return;
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as JsonRecord;

    const meta = payload.meta;
    const data = payload.data;
    if (!isRecord(meta) || !isRecord(data)) {
      sendText(res, 400, "Invalid payload");
      return;
    }

    const eventName = safeString(meta.event_name);
    const customData = meta.custom_data;
    const userId =
      isRecord(customData) && typeof customData.user_id === "string" ? customData.user_id : null;

    if (!eventName) {
      sendText(res, 400, "Missing event_name");
      return;
    }

    const isSubscriptionEvent =
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_cancelled";

    if (!isSubscriptionEvent) {
      sendText(res, 200, "Ignored");
      return;
    }

    if (!userId) {
      sendText(res, 200, "No user_id provided");
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!supabaseUrl || !serviceKey) {
      sendText(res, 500, "Supabase not configured");
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

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

    const { error } = await supabase
      .from("profiles")
      .update({
        lemon_squeezy_customer_id: lemonCustomerId,
        subscription_id: subscriptionId,
        variant_id: variantId,
        status: subscriptionStatus,
        current_period_end: currentPeriodEnd,
      })
      .eq("id", userId);

    if (error) {
      sendText(res, 500, "Database error");
      return;
    }

    sendText(res, 200, "OK");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    sendText(res, 500, message);
  }
}
