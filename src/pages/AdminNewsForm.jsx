import { useState, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Save, X, Upload } from "lucide-react";
import { fetchNews, createArticle, updateArticle, loadMenuGroups, uploadImage, fetchAuthors } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";
import { articles as fallback } from "../data/news.js";
import { slugify as frontendSlugify } from "../utils/slugify.js";
import { generateSlugFromTitle } from "../utils/transliterate.js";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    [{ align: [] }],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold", "italic", "underline", "strike",
  "list", "bullet",
  "blockquote", "code-block",
  "link", "image",
  "align",
];

export default function AdminNewsForm({ navigate, newsId }) {
  const isEditing = !!newsId;

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    category: "",
    categories: [],
    categoryMl: "",
    author: "",
    date: "",
    readTime: "",
    image: "",
    images: [],
    titleEn: "",
    slug: "",
    slugManuallyEdited: false,
    featured: false,
    breaking: false,
    mainNews: false,
    popular: false,
    media: "standard",
    videoUrl: "",
    relatedVideos: [],
    content: "",
    body: "",
    tags: "",
    backgroundColor: "",
    likes: 0,
    views: 0,
  });

  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuGroupsData, setMenuGroupsData] = useState([]);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [authorsList, setAuthorsList] = useState([]);

  useEffect(() => {
    loadMenuGroups().then(setMenuGroupsData).catch(() => {});
    fetchAuthors().then(res => {
      const list = res?.authors || res || [];
      setAuthorsList(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      if (isEditing) {
        try {
          const article = await fetchNews({ limit: 1000 });
          let found = (article.news || []).find(a => a.id === newsId);
          if (!found) found = fallback.find(a => a.id === newsId);
          if (found) {
            setFormData({
              id: found.id || "",
              title: found.title || "",
              excerpt: found.excerpt || "",
              category: found.category || "",
              categories: found.categories || (found.category ? [found.category] : []),
              categoryMl: found.categoryMl || "",
              author: found.author || "",
              date: found.date || "",
              readTime: found.readTime || "",
              image: found.image || "",
              images: found.images || [],
              titleEn: found.titleEn || "",
              slug: found.slug || "",
              slugManuallyEdited: true,
              featured: found.featured || false,
              breaking: found.breaking || false,
              mainNews: found.mainNews || false,
              popular: found.popular || false,
              media: found.media || "standard",
              videoUrl: found.videoUrl || "",
              relatedVideos: found.relatedVideos || [],
              content: found.content || "",
              body: Array.isArray(found.body) ? found.body.join("\n\n") : (found.body || ""),
              tags: found.tags?.join(", ") || "",
              backgroundColor: found.backgroundColor || "",
              likes: found.likes || 0,
              views: found.views || 0,
            });
            setImagePreview(found.image || "");
          }
        } catch (err) {
          console.error("Failed to load article:", err);
        }
      }
      setLoading(false);
    }
    load();
  }, [isEditing, newsId]);

  const allCategories = menuGroupsData.flatMap(group => 
    group.children ? group.children.map(child => ({
      slug: child.slug,
      label: group.label + " > " + child.label,
      labelMl: child.titleMl
    })) : []
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if ((name === "titleEn" || name === "title") && !prev.slugManuallyEdited) {
        const englishTitle = name === "titleEn" ? value : prev.titleEn;
        const malayalamTitle = name === "title" ? value : prev.title;
        const base = englishTitle ? frontendSlugify(englishTitle) : generateSlugFromTitle(malayalamTitle);
        if (base) next.slug = base.split("-").slice(0, 5).join("-");
      }
      return next;
    });
  };

  const handleSlugInput = (e) => {
    const raw = e.target.value;
    const value = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    setFormData(prev => ({
      ...prev,
      slug: value,
      slugManuallyEdited: raw.trim().length > 0,
    }));
  };

  const handleCategoryChange = (e) => {
    const selectedCat = allCategories.find(cat => cat.slug === e.target.value);
    setFormData(prev => ({
      ...prev,
      category: e.target.value,
      categoryMl: selectedCat?.labelMl || selectedCat?.label || ""
    }));
  };

  const handleMultiCategoryToggle = (slug) => {
    setFormData(prev => {
      const cats = prev.categories.includes(slug)
        ? prev.categories.filter(c => c !== slug)
        : [...prev.categories, slug];
      const primaryCat = cats.length > 0 ? cats[0] : prev.category;
      const primaryCatData = allCategories.find(c => c.slug === primaryCat);
      return {
        ...prev,
        categories: cats,
        category: primaryCat,
        categoryMl: primaryCatData?.labelMl || primaryCatData?.label || ""
      };
    });
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: result.url }));
      setImagePreview(result.url);
    } catch (err) {
      alert("Image upload failed: " + err.message);
    }
    e.target.value = "";
  };

  const handleCarouselImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadImage(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, result.url] }));
    } catch (err) {
      alert("Image upload failed: " + err.message);
    }
    e.target.value = "";
  };

  const handleCarouselImageUrlAdd = () => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, url.trim()] }));
    }
  };

  const removeCarouselImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const moveCarouselImage = (from, to) => {
    if (to < 0 || to >= formData.images.length) return;
    setFormData(prev => {
      const arr = [...prev.images];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...prev, images: arr };
    });
  };

  const addRelatedVideo = () => {
    if (!newVideoUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      relatedVideos: [...prev.relatedVideos, { title: newVideoTitle.trim(), videoUrl: newVideoUrl.trim(), thumbnail: "" }]
    }));
    setNewVideoTitle("");
    setNewVideoUrl("");
  };

  const removeRelatedVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      relatedVideos: prev.relatedVideos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const bodyText = formData.body.trim();
    const isHtmlContent = /<[a-z][\s\S]*>/i.test(bodyText);
    let bodyParagraphs;
    let derivedContent;
    
    if (isHtmlContent) {
      bodyParagraphs = bodyText ? [bodyText] : [];
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = bodyText;
      derivedContent = tempDiv.textContent || tempDiv.innerText || formData.excerpt;
    } else {
      bodyParagraphs = bodyText ? bodyText.split("\n\n").filter(para => para.trim()) : [];
      derivedContent = bodyParagraphs.length > 0 ? bodyParagraphs.join("\n\n") : formData.excerpt;
    }
    
    let finalSlug = formData.slug.trim();
    if (!finalSlug) {
      const englishTitle = formData.titleEn;
      const malayalamTitle = formData.title;
      const base = englishTitle ? frontendSlugify(englishTitle) : generateSlugFromTitle(malayalamTitle);
      if (base) finalSlug = base.split("-").slice(0, 5).join("-");
    }
    
    const newsData = {
      ...formData,
      slug: finalSlug,
      categories: formData.categories.length > 0 ? formData.categories : [formData.category].filter(Boolean),
      content: derivedContent,
      body: bodyParagraphs,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      likes: Number(formData.likes) || 0,
      views: Number(formData.views) || 0,
      comments: 0,
      backgroundColor: formData.backgroundColor || undefined,
      images: formData.images || [],
    };
    delete newsData.id;
    delete newsData.slugManuallyEdited;

    try {
      const submitData = {
        ...newsData,
        relatedVideos: formData.relatedVideos,
      };
      if (isEditing) {
        await updateArticle(newsId, submitData);
      } else {
        await createArticle(submitData);
      }
      alert(isEditing ? "News updated successfully!" : "News created successfully!");
      navigate("/admin/news");
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-news-form">
      <div className="admin-form-header">
        <h2>{isEditing ? "Edit News" : "Add New News"}</h2>
        <button className="admin-btn secondary" onClick={() => navigate("/admin/news")}>
          <X size={18} />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Title (Malayalam)</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter news title in Malayalam"
              />
            </div>

            <div className="form-group">
              <label>Excerpt</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Brief summary of the news"
              />
            </div>

            <div className="form-group">
              <label>English Title (optional — if empty, Malayalam title will be auto-transliterated to English URL)</label>
              <input
                type="text"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleChange}
                placeholder="e.g., Heavy Rain Expected in Kerala — leave empty to auto-convert Malayalam"
              />
            </div>

            <div className="form-group">
              <label>SEO Slug (auto-generated from English title — edit if needed)</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleSlugInput}
                placeholder="Auto-generated from English title (e.g., heavy-rain-kerala-coast)"
              />
              {formData.slug && (
                <small style={{ display: "block", marginTop: 4, color: "#666", fontSize: 13, wordBreak: "break-all" }}>
                  URL Preview: /news/{formData.slug}
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Primary Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="">Select Category</option>
                  {allCategories.map(cat => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label} ({cat.labelMl})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Author</label>
                <select
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Author</option>
                  {authorsList.map((a, i) => (
                    <option key={a.id || a._id || i} value={a.name || a}>
                      {a.name || a}
                    </option>
                  ))}
                </select>
                {authorsList.length === 0 && (
                  <small style={{ display: "block", marginTop: 4, color: "#999", fontSize: 13 }}>
                    No authors found. Add authors from the Authors section.
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Additional Categories (optional)</label>
              <div className="category-checkboxes">
                {allCategories.map(cat => (
                  <label key={cat.slug} className={`category-checkbox ${formData.categories.includes(cat.slug) ? "selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat.slug)}
                      onChange={() => handleMultiCategoryToggle(cat.slug)}
                    />
                    <span>{cat.label} ({cat.labelMl})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  placeholder="e.g., June 27, 2026"
                />
              </div>

              <div className="form-group">
                <label>Read Time</label>
                <input
                  type="text"
                  name="readTime"
                  value={formData.readTime}
                  onChange={handleChange}
                  placeholder="e.g., 4 min read"
                />
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <h3>Media & Display</h3>
            
            <div className="form-group">
              <label>Image URL or Upload</label>
              <input
                type="text"
                value={formData.image}
                onChange={handleImageUrlChange}
                placeholder="https://... or /uploads/..."
              />
              <label className="admin-upload-btn" style={{ marginTop: 8, display: "inline-flex" }}>
                <Upload size={16} /> Upload Photo
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
              {imagePreview && (
                <div className="image-preview" style={{ marginTop: 8 }}>
                  <img src={resolveImageUrl(imagePreview) || imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 4 }} onError={(e) => { e.target.style.display = "none" }} />
                  <button type="button" className="remove-image" onClick={() => { setImagePreview(""); setFormData(prev => ({ ...prev, image: "" })); }}><X size={16} /></button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Carousel Images (optional — multiple images shown as a slider on the article page)</label>
              <div className="carousel-images-list">
                {formData.images.map((img, index) => (
                  <div key={index} className="carousel-image-item">
                    <img src={resolveImageUrl(img) || img} alt={`Slide ${index + 1}`} className="carousel-image-thumb" />
                    <div className="carousel-image-actions">
                      <button type="button" className="btn-icon" onClick={() => moveCarouselImage(index, index - 1)} disabled={index === 0} title="Move left">&#9664;</button>
                      <button type="button" className="btn-icon" onClick={() => moveCarouselImage(index, index + 1)} disabled={index === formData.images.length - 1} title="Move right">&#9654;</button>
                      <button type="button" className="btn-remove" onClick={() => removeCarouselImage(index)} title="Remove"><X size={14} /></button>
                    </div>
                    <span className="carousel-image-label">{index + 1}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <label className="admin-upload-btn" style={{ display: "inline-flex" }}>
                  <Upload size={16} /> Upload Image
                  <input type="file" accept="image/*" onChange={handleCarouselImageUpload} hidden />
                </label>
                <button type="button" className="admin-btn secondary" onClick={handleCarouselImageUrlAdd} style={{ fontSize: 13, padding: "6px 12px" }}>
                  + Add URL
                </button>
              </div>
              {formData.images.length > 0 && (
                <small style={{ display: "block", marginTop: 6, color: "#666", fontSize: 12 }}>
                  {formData.images.length} image(s) will be shown as a carousel on the article page.
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Media Type</label>
                <select
                  name="media"
                  value={formData.media}
                  onChange={handleChange}
                >
                  <option value="standard">Standard</option>
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Video URL (YouTube, Vimeo, Dailymotion, Facebook, etc.)</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="Paste any video link: YouTube, Vimeo, Dailymotion, Facebook, Instagram, TikTok..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Related Videos (shown on detail page) — supports YouTube, Vimeo, Dailymotion, Facebook, Instagram, TikTok, and any embed link</label>
              <div className="related-videos-list">
                {formData.relatedVideos.map((video, index) => (
                  <div key={index} className="related-video-item">
                    <span className="related-video-title">{video.title || "Untitled"}</span>
                    <span className="related-video-url">{video.videoUrl}</span>
                    <button type="button" className="btn-remove" onClick={() => removeRelatedVideo(index)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-related-video">
                <input
                  type="text"
                  placeholder="Video title (optional)"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Paste any video link: YouTube, Vimeo, Dailymotion, Facebook, Instagram, TikTok..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
                <button type="button" className="btn-add" onClick={addRelatedVideo}>+ Add</button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                  />
                  Featured News
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 0 }}>
                <label>Title Background Color</label>
                <input
                  type="color"
                  name="backgroundColor"
                  value={formData.backgroundColor || "#c91f26"}
                  onChange={handleChange}
                  style={{ width: 48, height: 36, padding: 0, border: "1px solid #dfe6db", borderRadius: 4, cursor: "pointer" }}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                  />
                  Featured News
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="breaking"
                    checked={formData.breaking}
                    onChange={handleChange}
                  />
                  Breaking News (shows in ticker)
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="mainNews"
                    checked={formData.mainNews}
                    onChange={handleChange}
                  />
                  Main News
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="popular"
                    checked={formData.popular}
                    onChange={handleChange}
                  />
                  Popular
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Likes Count</label>
                <input
                  type="number"
                  name="likes"
                  value={formData.likes}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Views Count</label>
                <input
                  type="number"
                  name="views"
                  value={formData.views}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-form-section full-width">
          <h3>Content</h3>
          
          <div className="form-group">
              <label>Body Content</label>
              <div className="quill-editor-wrapper">
                <ReactQuill
                  theme="snow"
                  value={formData.body}
                  onChange={(value) => setFormData(prev => ({ ...prev, body: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Write the full news content here..."
                />
              </div>
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., kerala, rain, alert"
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn primary">
            <Save size={18} />
            {isEditing ? "Update News" : "Publish News"}
          </button>
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => navigate("/admin/news")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
