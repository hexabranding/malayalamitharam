import { useEffect, useState } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { fetchSettings } from "../services/api.js";

export default function Layout({ children, navigate, activeSlug }) {
  const [titleBg, setTitleBg] = useState("#bd1d25");

  useEffect(() => {
    fetchSettings().then(s => {
      if (s.title_bg_color) setTitleBg(s.title_bg_color);
    }).catch(() => {});
  }, []);

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
