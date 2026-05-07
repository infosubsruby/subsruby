export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export const ok = <T>(data: T): ServiceResult<T> => ({ data, error: null });

export const fail = <T>(error: string): ServiceResult<T> => ({ data: null, error });

export const toFriendlyError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

