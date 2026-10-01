import { Languages } from "lucide-react";
import { useLang } from "../context/LangContext.jsx";
import { LANGS } from "../i18n/index.js";

export default function LanguageBar() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="lang-bar" role="region" aria-label={t("common.language")}>
      <div className="lang-bar-inner">
        <span className="lang-label"><Languages size={15} /> {t("common.language")}</span>
        <div className="lang-switch" role="group" aria-label={t("common.language")}>
          {LANGS.map((item) => (
            <button
              key={item.code}
              type="button"
              className={lang === item.code ? "active" : ""}
              aria-pressed={lang === item.code}
              lang={item.htmlLang}
              dir={item.dir}
              onClick={() => setLang(item.code)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
