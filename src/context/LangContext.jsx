import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANG,
  detectInitialLang,
  getLangMeta,
  readStoredLang,
  STORAGE_KEY,
  translate,
} from "../i18n/index.js";

const LangContext = createContext({
  lang: DEFAULT_LANG,
  dir: "ltr",
  setLang: () => {},
  t: (key, vars) => key,
});

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => detectInitialLang());

  const setLang = useCallback((next) => {
    if (!next) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  const meta = getLangMeta(lang);
  const dir = meta.dir;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = meta.htmlLang;
    root.dir = dir;
    root.classList.toggle("rtl", dir === "rtl");
  }, [meta.htmlLang, dir]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY && e.newValue) setLangState(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const t = useCallback(
    (key, vars) => translate(lang, key, vars),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, dir, setLang, t, languages: [], meta }),
    [lang, dir, setLang, t, meta]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  return useContext(LangContext).t;
}

export { readStoredLang };
