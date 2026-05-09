import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getAiChaResponse = async (message: string, systemInstruction: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: systemInstruction || "あなたは「あいちゃ」という名前の明るくフレンドリーなAIアシスタントです。"
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "ごめんなさい、ちょっと考えがまとまらなくて……。もう一度言ってもらえるかな？";
  }
};
