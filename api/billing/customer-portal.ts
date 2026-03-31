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
    console.log("2. Supabase'den ID çekiliyor...");
    const { data: subData, error: subError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("customer_id")
      .eq("user_id", userId)
      .single();

    if (subError || !subData || !subData.customer_id) {
      sendJson(res, 400, { error: "Müşteri ID'si bulunamadı. Aktif bir ödeme kaydınız yok." });
      return;
    }

    const customerId = subData.customer_id;
    console.log("3. Lemon Squeezy'ye istek atılıyor. Bulunan ID:", customerId);
    const lemonResponse = await getCustomer(customerId);
    const lemonData = (lemonResponse as unknown as { data?: unknown }).data ?? null;
    const lemonError = (lemonResponse as unknown as { error?: unknown }).error ?? null;

    if (lemonError || !lemonData) {
      console.error("[customer-portal] lemon customer error", { requestId, lemonError: safeStringifyError(lemonError) });
      sendJson(res, 500, { error: "Lemon Squeezy API error" });
      return;
    }

    const portalUrl = isRecord(lemonData)
      ? (lemonData as { data?: unknown }).data &&
        isRecord((lemonData as { data?: unknown }).data) &&
        isRecord(((lemonData as { data?: unknown }).data as { attributes?: unknown }).attributes) &&
        isRecord(
          (((lemonData as { data?: unknown }).data as { attributes?: unknown }).attributes as { urls?: unknown }).urls
        ) &&
        typeof (
          (((lemonData as { data?: unknown }).data as { attributes?: unknown }).attributes as { urls?: unknown }).urls as {
            customer_portal?: unknown;
          }
        ).customer_portal === "string"
        ? String(
            (
              (
                (((lemonData as { data?: unknown }).data as { attributes?: unknown }).attributes as { urls?: unknown })
                  .urls as { customer_portal?: unknown }
              ).customer_portal
            ) ?? ""
          )
        : null
      : null;

    console.log("4. Bulunan Portal URL:", portalUrl);
    if (!portalUrl) {
      sendJson(res, 400, { error: "Portal linki üretilemedi." });
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
