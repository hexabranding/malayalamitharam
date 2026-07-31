import Meta from "./Meta.jsx";
import { ArticleImage } from "../services/images.jsx";

export default function ArticleCard({ article, navigate, variant = "default", dataAosDelay }) {
  if (!article) return null;
  return (
    <article
      className={"article-card clickable " + variant}
      data-aos="fade-up"
      data-aos-delay={dataAosDelay}
      onClick={() => navigate("/post/" + article.id)}
    >
      <div className="image-link">
        <ArticleImage article={article} alt={article.title} />
        <span>{article.categoryMl}</span>
      </div>
      <div className="card-copy">
        <Meta article={article} />
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
      </div>
    </article>
  );
}


