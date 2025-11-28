import { GoogleGenAI, Schema } from "@google/genai";

// Pastikan menggunakan GEMINI_API_KEY (Server-side key)
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface AIRequestConfig {
  prompt: string;
  schema?: Schema;
  model?: string;
  temperature?: number;
}

export async function generateContentWithRetry(config: AIRequestConfig, retries = 3) {
  const modelName = config.model || 'gemini-2.5-flash-lite';

  for (let i = 0; i < retries; i++) {
    try {
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

      const isOverloaded = msg.includes("429") || msg.includes("503") || msg.includes("Overloaded");
      
      if (isOverloaded && i < retries - 1) {
        const waitTime = 1000 * Math.pow(2, i);
        console.warn(`[AI RETRY] Attempt ${i + 1}/${retries} failed (${modelName}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}