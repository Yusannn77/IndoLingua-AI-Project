import Groq from "groq-sdk";
import { Schema } from "./features";

// Pastikan GROQ_API_KEY ada di .env (Server-side)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface AIRequestConfig {
  prompt: string;
  schema?: Schema;
  model?: string;
  temperature?: number;
}

export async function generateContentWithRetry(config: AIRequestConfig, retries = 3) {
  // Gunakan model Llama 3.1 8B Instant yang cepat & murah
  const modelName = config.model || 'openai/gpt-oss-120b';
  
  let systemInstruction = "You are a helpful AI language tutor specialized in Indonesian and English.";
  
  if (config.schema) {
    systemInstruction += ` You MUST output valid JSON only. Do not include markdown code blocks (like \`\`\`json). Just the raw JSON string. The JSON must strictly follow this schema structure: ${JSON.stringify(config.schema)}`;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: config.prompt },
        ],
        model: modelName,
        temperature: config.temperature ?? 0.3,
        // Aktifkan JSON mode Groq jika schema diminta
        response_format: config.schema ? { type: "json_object" } : undefined,
      });

      const text = completion.choices[0]?.message?.content;
      const tokens = completion.usage?.total_tokens || 0;

      if (!text) {
        throw new Error("Empty response from AI");
      }

      return { text, tokens };

    } catch (error: unknown) {
      let msg = "";
      if (error instanceof Error) {
        msg = error.message;
      } else {
        msg = String(error);
      }

      // Deteksi error Rate Limit / Overload spesifik Groq
      const isOverloaded = msg.includes("429") || msg.includes("503") || msg.includes("rate_limit_exceeded");
      
      if (isOverloaded && i < retries - 1) {
        const waitTime = 1000 * Math.pow(2, i); // Exponential backoff
        console.warn(`[Groq RETRY] Attempt ${i + 1}/${retries} failed (${modelName}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}