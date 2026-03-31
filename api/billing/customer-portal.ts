import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { getCustomer, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(payload));
}

function getBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const value = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function safeStringifyError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: typeof error === "string" ? error : "Unknown error", error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickCustomerPortalUrlFromLemonData(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const attributes = data.attributes;
  if (!isRecord(attributes)) return null;
  const urls = attributes.urls;
  if (!isRecord(urls)) return null;
  const portal = urls.customer_portal;
  return typeof portal === "string" ? portal : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const requestId = `portal_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  try {
    if (req.method === "OPTIONS") {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.statusCode = 200;
      res.end();
      return;
    }

    if (req.method !== "POST" && req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    console.log("1. Auth kontrolü yapılıyor");
    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[customer-portal] Supabase URL veya Key bulunamadı!", { requestId });
      sendJson(res, 500, { error: "Supabase not configured" });
      return;
    }

    const lemonApiKey = process.env.LEMON_SQUEEZY_API_KEY ?? "";
    if (!lemonApiKey) {
      sendJson(res, 500, { error: "Missing LEMON_SQUEEZY_API_KEY" });
      return;
    }

    lemonSqueezySetup({ apiKey: lemonApiKey });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      console.error("[customer-portal] unauthorized", { requestId, authError: safeStringifyError(authError) });
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const userId = authData.user.id;
    console.log("2. Supabase'den ID çekiliyor");
    const { data: subscriptionRow, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (subscriptionError) {
      console.error("[customer-portal] subscription query failed", {
        requestId,
        subscriptionError: safeStringifyError(subscriptionError),
      });
      sendJson(res, 500, { error: "Bilinmeyen bir sunucu hatası oluştu" });
      return;
    }

    const customerIdRaw = subscriptionRow?.customer_id;
    const customerId =
      typeof customerIdRaw === "string" || typeof customerIdRaw === "number" ? customerIdRaw : null;

    if (!customerId) {
      sendJson(res, 400, { error: "Müşteri ID'si bulunamadı. Aktif bir ödeme kaydınız yok." });
      return;
    }

    console.log("3. Lemon Squeezy'ye istek atılıyor");
    const { statusCode, error: lemonError, data } = await getCustomer(customerId);
    if (lemonError || !data) {
      console.error("[customer-portal] lemon customer error", {
        requestId,
        statusCode,
        lemonError: safeStringifyError(lemonError),
      });
      sendJson(res, 500, { error: `Lemon Squeezy API error (HTTP ${statusCode ?? "unknown"})` });
      return;
    }

    const portalUrl = pickCustomerPortalUrlFromLemonData(data);
    if (!portalUrl) {
      sendJson(res, 400, { error: "Henüz aktif bir aboneliğiniz veya fatura kaydınız bulunmuyor." });
      return;
    }

    sendJson(res, 200, { url: portalUrl });
  } catch (error) {
    console.error("[Billing API Error]:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen bir sunucu hatası oluştu";
    const stack = error instanceof Error ? error.stack ?? null : null;
    sendJson(res, 500, { error: message, stack });
  }
}
