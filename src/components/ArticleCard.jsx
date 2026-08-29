import { useEffect } from "react";
import Meta from "./Meta.jsx";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import { getTitleSlug, registerArticle } from "../utils/articleStore";

export default function ArticleCard({ article, navigate, variant = "default", dataAosDelay }) {
  if (!article) return null;

  useEffect(() => {
    registerArticle(article);
  }, [article?.engSlug || article?.slug]);

  const handleClick = () => {
    const slug = getTitleSlug(article);
    if (slug) {
      navigate("/news/" + slug);
    }
  };
  return (
    <article
      className={"article-card clickable " + variant}
      data-aos="fade-up"
      data-aos-delay={dataAosDelay}
      onClick={handleClick}
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
