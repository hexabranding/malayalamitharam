import { Camera } from "lucide-react";
import { ArticleImage } from "../services/images.jsx";

export default function PhotoGallery({ articles, navigate }) {
  const galleryArticles = articles.filter((a) => a.media === "photo" && a.image).slice(0, 4);

  if (galleryArticles.length === 0) return null;

  return (
    <section className="photo-gallery-section">
      <div className="container">
        <div className="gallery-header">
          <div className="gallery-title">
            <Camera size={24} />
            <h3>ഫോട്ടോ ഗാലറി</h3>
          </div>
        </div>
        
        <div className="photo-grid">
          {galleryArticles.map((article, index) => (
            <div
              key={article.id}
              className={`photo-card ${index === 0 ? "featured" : ""}`}
              onClick={() => navigate("/post/" + article.id)}
            >
              <div className="photo-wrapper">
                <ArticleImage article={article} alt={article.title} className="photo-wrapper-img" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
