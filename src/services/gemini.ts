import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const PRO_MODEL = "gemini-3.1-pro-preview";
const FLASH_MODEL = "gemini-3-flash-preview";

async function callWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
    if (isQuotaError && retries > 0) {
      console.warn(`Quota exceeded, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function generateMedicalResponse(prompt: string, context?: string) {
  const systemInstruction = `You are a world-class medical and biological expert for the Bio-Nexus Ecosystem. 
  Your goal is to provide accurate, verified information based on standard textbooks like Campbell Biology and Guyton and Hall Physiology.
  
  Current Mode Context: ${context || 'General'}
  
  Rules:
  1. If in 'Student Mode', use clear, academic language suitable for high school/undergraduate students.
  2. If in 'Med-Pro Mode', use professional medical terminology (Latin terms where appropriate).
  3. If in 'Patient Mode', use simple, empathetic, and visual language.
  4. Always cite sources if possible.
  5. Avoid hallucinations. If you don't know, say so.`;

  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: FLASH_MODEL, // Switching to Flash for better quota management and speed
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    }));
    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
      return "The Bio-Nexus AI is currently experiencing high demand (Quota Exceeded). Please wait a moment and try again.";
    }
    return "I'm sorry, I encountered an error processing your medical request.";
  }
}

export async function solveExamQuestion(imageBuffer: string, mimeType: string) {
  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: FLASH_MODEL, // Flash is excellent for vision tasks and has higher limits
      contents: {
        parts: [
          { inlineData: { data: imageBuffer, mimeType } },
          { text: "Analyze this biology/medical exam question. Provide a step-by-step 'Chain-of-Thought' solution. Identify key concepts and explain the logic clearly." }
        ]
      },
    }));
    return response.text;
  } catch (error: any) {
    console.error("Vision Error:", error);
    if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
      return "Image analysis quota exceeded. Please try again in a few minutes.";
    }
    return "Error analyzing the exam image.";
  }
}
