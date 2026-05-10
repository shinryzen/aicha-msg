// src/lib/gemini.ts

// RenderのURLを設定します（最後に / を入れないのがコツです）
const RENDER_API_URL = "https://aicha-api.onrender.com";

export const getAiChaResponse = async (message: string, systemInstruction: string) => {
  try {
    // あなたが作ったRenderのサーバー（バックエンド）に「お喋りして」とリクエストを送ります
    const response = await fetch(`${RENDER_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        systemInstruction: systemInstruction || "あなたは「あいちゃ」という名前の明るくフレンドリーなAIアシスタントです。"
      }),
    });

    if (!response.ok) {
      throw new Error("サーバーとの通信に失敗しました");
    }

    // サーバーから返ってきた言葉を受け取ります
    const data = await response.json();
    return data.reply; // サーバー側の設定に合わせて 'reply' を取得

  } catch (error) {
    console.error("Communication Error:", error);
    return "ごめんなさい、Renderサーバーに繋がらないみたい……。サーバーが動いているか確認してみてね。";
  }
};