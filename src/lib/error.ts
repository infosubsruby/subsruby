export function errorMessageOrValue(error: unknown): unknown {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return message || error;
  }
  return error;
}

