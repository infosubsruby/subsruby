import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";

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

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[customer-portal] Supabase URL veya Key bulunamadı!", { requestId });
      sendJson(res, 500, { error: "Supabase not configured" });
      return;
    }

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
    const { data: subscriptionRow, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("customer_portal_url")
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

    const portalUrlRaw = subscriptionRow?.customer_portal_url;
    const portalUrl = typeof portalUrlRaw === "string" ? portalUrlRaw : null;
    if (!portalUrl) {
      sendJson(res, 400, { error: "Aktif bir abonelik portalınız bulunamadı." });
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
