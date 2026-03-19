function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function profileSubscriptionStatus(profile: unknown): string | null {
  if (!isRecord(profile)) return null;
  const raw = profile.subscription_status ?? profile.status;
  if (raw == null) return null;
  return String(raw);
}

export function isProFromStatus(status: string | null): boolean {
  if (!status) return false;
  return status === "active" || status === "trialing";
}

