import { NextResponse } from "next/server";
import { generateContentWithRetry } from "@/shared/lib/ai/client";
import { FeatureRequestSchema, FEATURE_PROMPTS } from "@/shared/lib/ai/features";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    
    // 1. Validation
    const validation = FeatureRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid Request Params", 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { feature, params } = validation.data;

    // 2. Prompt Generation (Type-safe access)
    // @ts-expect-error - TypeScript difficulty mapping union discriminators perfectly without casting in generic maps
    const { prompt, schema } = FEATURE_PROMPTS[feature](params);

    // 3. Execution (With Retry & Error Handling)
    const { text, tokens } = await generateContentWithRetry({
      prompt,
      schema,
      temperature: 0.3 // Rendah agar hasil konsisten/deterministik
    });

    // 4. Parsing (If schema exists)
    let data: unknown = text;
    if (schema) {
      try {
        const parsed = JSON.parse(text);
        // Post-processing khusus
        if (feature === 'grammar_question' && !parsed.id) {
          parsed.id = Date.now().toString();
        }
        data = parsed;
      } catch (e) {
        console.error("[API_ERROR] JSON Parse Failed:", text);
        return NextResponse.json({ error: "AI produced invalid JSON" }, { status: 500 });
      }
    }

    return NextResponse.json({ data, tokens });

  } catch (error: unknown) {
    console.error("[API_CRITICAL_ERROR]", error);
    
    let msg = "Unknown Server Error";
    let status = 500;
    
    if (error instanceof Error) {
      msg = error.message;
      if (msg.includes("429") || msg.includes("503") || msg.includes("Overloaded")) {
        msg = "AI Service is currently busy. Please try again in a moment.";
        status = 503;
      }
      if (msg.includes("404") || msg.includes("not found")) {
        msg = "AI Model Configuration Error.";
      }
    }
    
    return NextResponse.json({ error: msg }, { status });
  }
}