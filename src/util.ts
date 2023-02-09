export async function sleep(millisecond: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecond);
  });
}

export function formatError(e: unknown) {
  if (e instanceof Error) {
    return `${e.name},${e.message}`;
  }
  if (typeof e === "string" || typeof e === "number") {
    return e;
  }
  if (typeof e === "object") {
    if (e === null) {
      return "null";
    }
    if ("message" in e) {
      return e.message;
    }
  }
  return `${e}`.substring(0, 100);
}

export async function retryFunction<T>(
  func: () => Promise<T>,
  retry: number,
  onRetry?: (retry: number, error: unknown) => void
): Promise<T> {
  try {
    return await func();
  } catch (error) {
    if (retry > 0) {
      onRetry?.(retry, error);
      return await retryFunction(func, retry - 1, onRetry);
    }
    throw error;
  }
}
