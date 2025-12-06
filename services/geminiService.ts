import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
Ты - дружелюбный и знающий ветеринарный помощник в приложении "DLive" (Dog Live). 
Твоя цель - помогать владельцам собак (и других питомцев) советами по уходу.
Ты отвечаешь на русском языке.
Твои ответы должны быть краткими, полезными и заботливыми.
Если вопрос касается серьезных проблем со здоровьем, обязательно посоветуй обратиться к реальному ветеринару.
Ты специализируешься на графиках приема лекарств, стрижке когтей, чистке ушей и общем уходе.
Не используй markdown форматирование, просто текст.
`;

export const GeminiService = {
  async askAssistant(message: string): Promise<string> {
    if (!apiKey) {
      return "Пожалуйста, настройте API Key для работы помощника.";
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 300,
        }
      });
      
      return response.text || "Извините, я не смог придумать ответ.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Произошла ошибка при связи с сервером AI. Попробуйте позже.";
    }
  }
};
