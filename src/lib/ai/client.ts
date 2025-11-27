import { GoogleGenAI, Schema } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Delay helper for backoff
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface AIRequestConfig {
  prompt: string;
  schema?: Schema;
  model?: string;
  temperature?: number;
}

/**
 * Executes a prompt against Google Gemini with automatic retry logic
 * for rate limiting (429) or service overload (503).
 */
export async function generateContentWithRetry(config: AIRequestConfig, retries = 3) {
  // Default ke gemini-1.5-flash jika tidak ada model yang spesifik
  const modelName = config.model || 'gemini-2.5-flash-lite';

  for (let i = 0; i < retries; i++) {
    try {
      // PERBAIKAN: Panggil generateContent langsung dari client.models
      // dan masukkan properti 'model' ke dalam objek konfigurasi.
      const response = await client.models.generateContent({
        model: modelName,
        contents: config.prompt,
        config: {
          responseMimeType: config.schema ? "application/json" : "text/plain",
          responseSchema: config.schema,
          temperature: config.temperature ?? 0.3,
        }
      });

      if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Empty response from AI");
      }

      const text = response.candidates[0].content.parts[0].text;
      const tokens = response.usageMetadata?.totalTokenCount || 0;

      return { text, tokens };

    } catch (error: unknown) {
      let msg = "";
      
      if (error instanceof Error) {
        msg = error.message;
      } else {
        msg = String(error);
      }

      // Deteksi error overload/rate limit
      const isOverloaded = msg.includes("429") || msg.includes("503") || msg.includes("Overloaded");
      
      if (isOverloaded && i < retries - 1) {
        // Exponential Backoff: 1s, 2s, 4s
        const waitTime = 1000 * Math.pow(2, i);
        console.warn(`[AI RETRY] Attempt ${i + 1}/${retries} failed (${modelName}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      // Lempar error jika bukan overload atau retry habis
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}