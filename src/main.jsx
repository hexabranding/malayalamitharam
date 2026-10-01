import React from "react";
import { createRoot } from "react-dom/client";
import "aos/dist/aos.css";
import "./styles.css";
import App from "./App.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import { AdsProvider } from "./context/AdsContext.jsx";
import { LangProvider, useLang } from "./context/LangContext.jsx";

// Remounting on language change makes every page refetch its news in the
// newly selected language instead of keeping the previous one on screen.
function Root() {
  const { lang } = useLang();
  return (
    <DataProvider>
      <AdsProvider>
        <App key={lang} />
      </AdsProvider>
    </DataProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <LangProvider>
    <Root />
  </LangProvider>
);
