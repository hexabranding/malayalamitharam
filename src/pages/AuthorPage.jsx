import { authors } from "../services/api.js";
import PageLayout from "../components/PageLayout.jsx";

export default function AuthorPage({ navigate }) {
  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>ലേഖകർ</span>
        <h1>മലയാളമിത്രം ടീം (Authors &amp; Editorial Team)</h1>
      </div>

      <div className="author-grid">
        {authors.map((author, i) => (
          <article className="author-card" key={author.name} data-aos="fade-up" data-aos-delay={i * 50}>
            <div className="author-card-avatar">{author.name.charAt(0)}</div>
            <strong>{author.name}</strong>
            <span>{author.role}</span>
            <small>{author.count} ലേഖനങ്ങൾ പ്രസിദ്ധീകരിച്ചു</small>
          </article>
        ))}
      </div>
    </PageLayout>
  );
}
