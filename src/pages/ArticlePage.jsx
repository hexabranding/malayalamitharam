import { useState, useEffect } from "react";
import { Facebook, Linkedin, MessageCircle, Send, Twitter } from "lucide-react";
import { fetchArticle, fetchNews, incrementView } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import Meta from "../components/Meta.jsx";
import PageLayout from "../components/PageLayout.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import ArticleCard from "../components/ArticleCard.jsx";

export default function ArticlePage({ slug, navigate }) {
  const fallbackArticle = fallback.find(a => a.id === slug);
  const [article, setArticle] = useState(fallbackArticle || null);
  const [fontSize, setFontSize] = useState(null);
  const [related, setRelated] = useState(() => {
    if (!fallbackArticle) return [];
    return fallback.filter(a => a.category === fallbackArticle.category && a.id !== fallbackArticle.id).slice(0, 3);
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchArticle(slug);
        if (data) setArticle(data);
        if (data) {
          incrementView(slug).catch(() => {});
          const relatedData = await fetchNews({ category: data.category, limit: 5 });
          const r = (relatedData.news || []).filter(a => a.id !== data.id).slice(0, 3);
          if (r.length > 0) setRelated(r);
        }
      } catch (err) {
        if (!fallbackArticle) setArticle(null);
      }
    }
    if (slug) load();
  }, [slug]);

  if (!article) return <NotFoundPage navigate={navigate} />;

  const displayRelated = related.length >= 2
    ? related
    : [];

  const articleTitle = (
    <header className="article-page-title" style={{ "--title-bg": article.backgroundColor || "#c91f26" }} data-aos="fade-up">
      <AdSlot slot="article-top" label="Article Top Advertisement (728 x 90)" />
      <span className="pill" data-aos="fade-up" data-aos-delay="50">{article.categoryMl}</span>
      <h1 data-aos="fade-left" data-aos-delay="100">{article.title}</h1>
    </header>
  );

  return (
    <PageLayout navigate={navigate} className="article-page" fullWidthHeader={articleTitle}>
        <article className="article-detail" style={{ "--title-bg": article.backgroundColor || "#c91f26" }} data-aos="fade-up">
        <Meta article={article} />

        <div data-aos="zoom-in" data-aos-delay="120">
          <ArticleImage article={article} alt={article.title} className="detail-image" />
        </div>

        <blockquote
          className="article-lead-blockquote"
          data-aos="fade-up"
          data-aos-delay="150"
          style={fontSize ? { fontSize: fontSize + "px" } : undefined}
          onClick={() => setFontSize(prev => Math.min((prev || 23) + 2, 36))}
        >
          {article.excerpt}
        </blockquote>

        <div className="article-body-text" data-aos="fade-up" data-aos-delay="200">
          {(article.body || []).map((paragraph, index) => (
            <div key={index}>
              {index === 1 && <AdSlot slot="article" label="In-Article Advertisement (300 x 250)" compact />}
              <p
                style={fontSize ? { fontSize: fontSize + "px" } : undefined}
                onClick={() => setFontSize(prev => Math.min((prev || 22) + 2, 36))}
              >{paragraph}</p>
            </div>
          ))}
        </div>

        <div className="tags" data-aos="fade-up" data-aos-delay="250">
          {(article.tags || []).map((tag) => (
            <button key={tag} type="button" onClick={() => navigate("/tags/" + encodeURIComponent(tag))}>
              #{tag}
            </button>
          ))}
        </div>

        <div className="article-share" data-aos="fade-up" data-aos-delay="300">
          <span>Share:</span>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><Facebook size={20} /></a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter"><Twitter size={20} /></a>
          <a href={`https://wa.me/?text=${encodeURIComponent(article.title + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><MessageCircle size={20} /></a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"><Send size={20} /></a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
        </div>

        <div className="article-author-card" data-aos="fade-up" data-aos-delay="350">
          <div className="author-avatar">{article.author.charAt(0)}</div>
          <div className="author-details">
            <h4>{article.author}</h4>
            <p>മലയാളമിത്രം ചീഫ് കറസ്‌പോണ്ടന്റ്. ദേശീയ-അന്തർദേശീയ വിഷയങ്ങളെക്കുറിച്ചും സാമൂഹിക മാറ്റങ്ങളെക്കുറിച്ചും വിശകലനം ചെയ്യുന്നു.</p>
          </div>
        </div>
      </article>

      <section className="related-articles-section" data-aos="fade-up" data-aos-delay="400">
        <h3 className="section-block-title" data-aos="fade-left">
          <span>കൂടുതൽ വായിക്കൂ (Related Stories)</span>
        </h3>
        <div className="card-grid">
          {displayRelated.map((relatedStory, i) => (
            <ArticleCard
              key={relatedStory.id}
              article={relatedStory}
              navigate={navigate}
              dataAosDelay={i * 100}
            />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
