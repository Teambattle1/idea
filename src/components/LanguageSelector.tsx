import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES, TranslationLanguage } from '../lib/translator';

const LanguageSelector = ({
  current,
  onChange,
  isTranslating,
}: {
  current: string;
  onChange: (lang: TranslationLanguage) => void;
  isTranslating: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
          current !== 'da'
            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
            : 'bg-white/10 border-white/10 text-gray-300 hover:text-white'
        }`}
      >
        {isTranslating ? (
          <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span>{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-battle-grey border border-white/10 rounded-lg shadow-xl py-1 min-w-[180px]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onChange(lang);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  lang.code === current
                    ? 'bg-battle-orange/20 text-battle-orange'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.code === 'da' && (
                  <span className="text-xs text-gray-500 ml-auto">Original</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
