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

    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed", error: { requestId } });
      return;
    }

    const token = getBearerToken(req);
    if (!token) {
      sendJson(res, 401, { message: "Unauthorized", error: { requestId } });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
    if (!supabaseUrl || !supabaseAnonKey) {
      sendJson(res, 500, { message: "Supabase not configured", error: { requestId } });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      console.error("[customer-portal] unauthorized", { requestId, authError: safeStringifyError(authError) });
      sendJson(res, 401, { message: "Unauthorized", error: { requestId } });
      return;
    }

    const userId = authData.user.id;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!serviceRoleKey) {
      sendJson(res, 200, { url: "https://subsruby.lemonsqueezy.com/billing" });
      return;
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: subscriptionRow, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("customer_portal_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (subscriptionError) {
      console.error("[customer-portal] sub query failed", {
        requestId,
        subscriptionError: safeStringifyError(subscriptionError),
      });
    }

    const portalUrlRaw =
      subscriptionRow && typeof subscriptionRow === "object" && "customer_portal_url" in subscriptionRow
        ? (subscriptionRow as { customer_portal_url?: unknown }).customer_portal_url
        : null;
    const portalUrl = typeof portalUrlRaw === "string" ? portalUrlRaw : null;
    if (portalUrl) {
      sendJson(res, 200, { url: portalUrl });
      return;
    }

    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("lemon_squeezy_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[customer-portal] profile query failed", { requestId, profileError: safeStringifyError(profileError) });
    }

    const customerIdRaw =
      profileRow && typeof profileRow === "object" && "lemon_squeezy_customer_id" in profileRow
        ? (profileRow as { lemon_squeezy_customer_id?: unknown }).lemon_squeezy_customer_id
        : null;
    const customerId = typeof customerIdRaw === "string" ? customerIdRaw : null;

    const fallbackUrl = customerId
      ? `https://subsruby.lemonsqueezy.com/billing?customer_id=${encodeURIComponent(customerId)}`
      : "https://subsruby.lemonsqueezy.com/billing";

    sendJson(res, 200, { url: fallbackUrl });
  } catch (error) {
    console.error("[customer-portal] unhandled error", { requestId, error: safeStringifyError(error) });
    sendJson(res, 500, { message: "Internal Server Error", error: { requestId } });
  }
}

