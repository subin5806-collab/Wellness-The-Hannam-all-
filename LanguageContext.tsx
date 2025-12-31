
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('hannam_lang');
    return (saved as Language) || 'ko';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('hannam_lang', newLang);
  };

  // 객체 경로를 이용해 번역 텍스트를 찾는 헬퍼 (예: 'portal.home.title')
  const t = (path: string): string => {
    const keys = path.split('.');
    let result: any = translations[lang];
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path; // 키가 없을 경우 경로 자체 반환
      }
    }
    return typeof result === 'string' ? result : path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
