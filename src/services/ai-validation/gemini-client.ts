import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.8-flash";
export const FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-flash-latest",
] as const;

/**
 * Resolves the Gemini API Key from available runtime environments.
 */
export function resolveGeminiApiKey(customKey?: string): string | null {
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }

  // Vite import.meta.env check with safe optional chaining
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv?.["VITE_GEMINI_API_KEY"]) return metaEnv["VITE_GEMINI_API_KEY"];
    if (metaEnv?.["GEMINI_API_KEY"]) return metaEnv["GEMINI_API_KEY"];
  } catch {
    // Ignore in non-Vite environments
  }

  // Node global process.env check via safe globalThis
  try {
    const procEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })?.process?.env;
    if (procEnv?.["VITE_GEMINI_API_KEY"]) return procEnv["VITE_GEMINI_API_KEY"];
    if (procEnv?.["GEMINI_API_KEY"]) return procEnv["GEMINI_API_KEY"];
  } catch {
    // Ignore in non-Node environments
  }

  return null;
}

/**
 * Initializes and returns a GoogleGenAI client instance if an API key is available.
 */
export function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const apiKey = resolveGeminiApiKey(customKey);
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Helper to execute content generation with automatic model migration and resilience fallback
 * across gemini-3.8-flash and gemini-3-flash-preview.
 */
export async function generateContentWithFallback(
  gemini: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
) {
  const primaryModel = params.model || GEMINI_MODEL;
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  let lastError: unknown = null;
  for (const model of modelsToTry) {
    try {
      return await gemini.models.generateContent({
        ...params,
        model,
      });
    } catch (err: unknown) {
      lastError = err;
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      // If error indicates model is retired, not found, or temporary spike 503, try next compatible model
      if (
        errMsg.includes("not found") ||
        errMsg.includes("no longer available") ||
        errMsg.includes("404") ||
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("unavailable")
      ) {
        console.warn(`Model ${model} returned error (${errMsg.slice(0, 80)}), attempting fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
