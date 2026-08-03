import { useEffect, useState } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { useSettings } from "../context/DataContext.jsx";

export default function Layout({ children, navigate, activeSlug }) {
  const settings = useSettings();
  const [titleBg, setTitleBg] = useState("#bd1d25");

  useEffect(() => {
    if (settings.title_bg_color) setTitleBg(settings.title_bg_color);
  }, [settings.title_bg_color]);

  useEffect(() => {
    document.documentElement.style.setProperty("--title-bg", titleBg);
  }, [titleBg]);

  return (
    <div className="site-shell">
      <Header navigate={navigate} activeSlug={activeSlug} />
      <div className="site-body">{children}</div>
      <Footer navigate={navigate} />
    </div>
  );
}
