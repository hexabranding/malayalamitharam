import { useEffect } from "react";
import Meta from "./Meta.jsx";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import { getTitleSlug, registerArticleAsync } from "../utils/articleStore";

export default function ArticleCard({ article, navigate, variant = "default", dataAosDelay }) {
  if (!article) return null;

  useEffect(() => {
    registerArticleAsync(article);
  }, [article?.id]);

  const postSlug = getTitleSlug(article);
  return (
    <article
      className={"article-card clickable " + variant}
      data-aos="fade-up"
      data-aos-delay={dataAosDelay}
      onClick={() => navigate("/post/" + postSlug)}
    >
      <div className="image-link">
        <ArticleImage article={article} alt={article.title} />
        <span>{getCategoryName(article)}</span>
      </div>
      <div className="card-copy">
        <Meta article={article} />
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
      </div>
    </article>
  );
}
