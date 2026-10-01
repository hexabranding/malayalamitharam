import { Search, Newspaper } from "lucide-react";
import { useT } from "../context/LangContext.jsx";

export default function EmptyState({ title, message, navigate, query }) {
  const t = useT();
  return (
    <section className="empty-state-panel">
      <Newspaper size={34} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="empty-state-actions">
          <button type="button" onClick={() => navigate("/")}>{t("empty.home")}</button>
          <button type="button" onClick={() => navigate("/category/kerala")}>{t("empty.kerala")}</button>
          <button type="button" onClick={() => navigate("/category/photos")}><Search size={15} /> {t("empty.photos")}</button>
          {query ? <button type="button" onClick={() => navigate("/search?q=" + encodeURIComponent(query))}>{t("empty.searchAll")}</button> : null}
        </div>
      </div>
    </section>
  );
}
