import { Globe2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

function LanguageSelector({ className = "" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ${className}`}>
      <Globe2 size={14} className="text-slate-500" aria-hidden="true" />
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="cursor-pointer border-0 bg-transparent text-xs font-bold text-slate-700 outline-none"
      >
        <option value="en">English</option>
        <option value="hi">हिन्दी</option>
        <option value="mr">मराठी</option>
      </select>
    </label>
  );
}

export default LanguageSelector;
