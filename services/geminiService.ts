
import { GoogleGenAI } from "@google/genai";

/**
 * Gemini Intelligence Service
 * Provides AI-powered personalized wellness recommendations.
 */
export const geminiService = {
  /**
   * Generates a personalized wellness recommendation based on member goals and history.
   * Uses gemini-3-flash-preview for fast and relevant text generation.
   */
  getRecommendation: async (goal: string, history: string[]): Promise<string> => {
    // API key is obtained from process.env.API_KEY as per guidelines.
    // Create a new instance right before call to ensure up-to-date key usage.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const historyStr = history.length > 0 ? history.join(', ') : '최근 관리 내역 없음';
    
    const prompt = `당신은 대한민국 한남동에 위치한 프리미엄 웰니스 센터 '더 한남(The Hannam)'의 전문 웰니스 컨설턴트입니다. 
다음 고객 정보를 바탕으로, 고객의 품격에 어울리는 맞춤형 테라피 추천사를 한국어로 작성해 주세요.

고객의 핵심 건강 목표: ${goal}
최근 센터 이용 내역: ${historyStr}

작성 지침:
1. 어조는 매우 전문적이고 우아하며 세심해야 합니다.
2. 고객의 목표를 존중하고 그에 맞는 다음 단계의 테라피를 제안하세요.
3. 2문장 내외로 간결하지만 임팩트 있게 작성하세요.
4. 결과물에 '추천사:'와 같은 머리말은 제외하고 본문만 반환하세요.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "당신은 세계 최고 수준의 웰니스 전문가입니다. 품격 있는 한국어로 고객을 위한 최고의 제언을 수행합니다.",
          temperature: 0.7,
          topP: 0.95,
        },
      });

      // Extracting text output directly from the .text property (not a method) as per guidelines.
      const text = response.text?.trim();
      return text || "고객님을 위한 맞춤 테라피를 구상 중입니다.";
    } catch (error) {
      console.error('Gemini Recommendation Service Error:', error);
      // Fallback for when API is unreachable or key is missing
      return "담당 전문가와 상담을 통해 맞춤 플랜을 확인해 보세요.";
    }
  }
};
