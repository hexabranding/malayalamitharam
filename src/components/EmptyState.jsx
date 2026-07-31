import { Search, Newspaper } from "lucide-react";

export default function EmptyState({ title, message, navigate, query }) {
  return (
    <section className="empty-state-panel">
      <Newspaper size={34} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="empty-state-actions">
          <button type="button" onClick={() => navigate("/")}>Home</button>
          <button type="button" onClick={() => navigate("/category/kerala")}>Kerala</button>
          <button type="button" onClick={() => navigate("/category/photos")}><Search size={15} /> Photos</button>
          {query ? <button type="button" onClick={() => navigate("/search?q=" + encodeURIComponent(query))}>Search all</button> : null}
        </div>
      </div>
    </section>
  );
}
