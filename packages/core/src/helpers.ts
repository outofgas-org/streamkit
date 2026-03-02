/**
 * Create a banner message for monorepo projects
 */
export function createMonorepoBanner(options: {
  projectName: string;
  packageCount: number;
}): string {
  return `${options.projectName} · ${options.packageCount} packages`;
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {},
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const waitTime = backoff ? delayMs * 2 ** (attempt - 1) : delayMs;
        await delay(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * Check if code is running in development mode
 */
export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if code is running in production mode
 */
export function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Get an environment variable with a fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (fallback === undefined) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return fallback;
  }
  return value;
}
