/// <reference types="vite/client" />

interface Window {
  LemonSqueezy?: {
    Url: {
      Open: (url: string) => void;
    };
    Setup: (options: { eventHandler?: (event: unknown) => void }) => void;
  };
}
