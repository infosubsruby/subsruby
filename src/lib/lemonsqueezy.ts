import { lemonsqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export const configureLemonSqueezy = () => {
  /**
   * Lemon Squeezy configuration using environment variables.
   * We check process.env as requested, but also support import.meta.env for Vite compatibility.
   */
  let apiKey: string | undefined;

  try {
    // Attempt to access process.env (Node.js environment)
    if (typeof process !== "undefined" && process.env) {
      apiKey = process.env.LEMONSQUEEZY_API_KEY;
    }
  } catch (error) {
    // Ignore error if process is not defined
  }

  // Fallback for Vite (Client-side)
  if (!apiKey && typeof import.meta !== "undefined" && import.meta.env) {
    apiKey = import.meta.env.VITE_LEMONSQUEEZY_API_KEY;
  }

  if (!apiKey) {
    console.error(
      "Lemon Squeezy API Key not found! Please set LEMONSQUEEZY_API_KEY (or VITE_LEMONSQUEEZY_API_KEY) in your .env file."
    );
    return;
  }

  lemonsqueezySetup({
    apiKey,
    onError: (error) => console.error("Lemon Squeezy Error:", error),
  });
};
