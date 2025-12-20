
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
  getRecommendation: async (goal: string, history: string[]): Promise<string> => {
    // API 키를 함수 내부에서 직접 참조하여 초기화 시점의 레이스 컨디션 방지
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      console.warn("Gemini API Key is not configured. Returning default recommendation.");
      return "고객님의 목표에 맞춘 최적화된 웰니스 프로그램을 제안해 드립니다.";
    }

    try {
      // 인스턴스를 매 호출마다 생성하여 최신 API 키 반영 보장
      const ai = new GoogleGenAI({ apiKey });
      const historyStr = history.length > 0 ? history.join(', ') : '최근 관리 내역 없음';
      
      const prompt = `당신은 프리미엄 웰니스 센터 '더 한남'의 전문 컨설턴트입니다. 
고객의 핵심 건강 목표: ${goal}
최근 센터 이용 내역: ${historyStr}

위 정보를 바탕으로 품격 있는 한국어 추천사를 2문장 내외로 작성하세요.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "당신은 세계 최고 수준의 웰니스 큐레이터입니다. 우아하고 전문적인 어조를 유지하세요.",
          temperature: 0.7,
        },
      });

      // SDK 가이드에 따라 .text 프로퍼티 사용
      return response.text?.trim() || "전담 전문가가 고객님만을 위한 맞춤형 테라피를 구상 중입니다.";
    } catch (error) {
      console.error('Gemini API Error:', error);
      return "상담을 통해 고객님께 가장 필요한 관리 프로그램을 안내해 드리겠습니다.";
    }
  }
};
