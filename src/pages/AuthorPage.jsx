import { authors } from "../services/api.js";
import PageLayout from "../components/PageLayout.jsx";
import { useT } from "../context/LangContext.jsx";

export default function AuthorPage({ navigate }) {
  const t = useT();
  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>{t("author.sectionLabel")}</span>
        <h1>{t("author.heading")}</h1>
      </div>

      <div className="author-grid">
        {authors.map((author, i) => (
          <article className="author-card" key={author.name} data-aos="fade-up" data-aos-delay={i * 50}>
            <div className="author-card-avatar">{author.name.charAt(0)}</div>
            <strong>{author.name}</strong>
            <span>{author.role}</span>
            <small>{t("author.publishedCount", { count: author.count })}</small>
          </article>
        ))}
      </div>
    </PageLayout>
  );
}
