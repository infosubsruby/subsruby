export type LoadState = "idle" | "loading" | "empty" | "error" | "success" | "disabled";

export interface AsyncResourceState<T> {
  status: LoadState;
  data: T;
  error: string | null;
}

export interface FeatureUiState {
  featureKey: string;
  access: "locked" | "available" | "limited";
  reason: string;
}

export const createAsyncState = <T>(data: T, status: LoadState = "idle"): AsyncResourceState<T> => ({
  status,
  data,
  error: null,
});
