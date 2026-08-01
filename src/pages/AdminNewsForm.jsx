import { useState, useEffect } from "react";
import { Save, X, Upload } from "lucide-react";
import { fetchNews, createArticle, updateArticle, loadMenuGroups, uploadImage } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";
import { articles as fallback } from "../data/news.js";

export default function AdminNewsForm({ navigate, newsId }) {
  const isEditing = !!newsId;

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    category: "",
    categoryMl: "",
    author: "",
    date: "",
    readTime: "",
    image: "",
    titleEn: "",
    featured: false,
    breaking: false,
    mainNews: false,
    popular: false,
    media: "standard",
    videoUrl: "",
    content: "",
    body: "",
    tags: "",
    backgroundColor: "",
  });

  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuGroupsData, setMenuGroupsData] = useState([]);

  useEffect(() => {
    loadMenuGroups().then(setMenuGroupsData).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      if (isEditing) {
        try {
          const article = await fetchNews({ limit: 200 });
          let found = (article.news || []).find(a => a.id === newsId);
          if (!found) found = fallback.find(a => a.id === newsId);
          if (found) {
            setFormData({
              id: found.id || "",
              title: found.title || "",
              excerpt: found.excerpt || "",
              category: found.category || "",
              categoryMl: found.categoryMl || "",
              author: found.author || "",
              date: found.date || "",
              readTime: found.readTime || "",
              image: found.image || "",
              titleEn: found.titleEn || "",
              featured: found.featured || false,
              breaking: found.breaking || false,
              mainNews: found.mainNews || false,
              popular: found.popular || false,
              media: found.media || "standard",
              videoUrl: found.videoUrl || "",
              content: found.content || "",
              body: found.body?.join("\n\n") || "",
              tags: found.tags?.join(", ") || "",
              backgroundColor: found.backgroundColor || "",
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
      label: child.label,
      labelMl: child.titleMl
    })) : []
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCategoryChange = (e) => {
    const selectedCat = allCategories.find(cat => cat.slug === e.target.value);
    setFormData(prev => ({
      ...prev,
      category: e.target.value,
      categoryMl: selectedCat?.labelMl || e.target.value
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const bodyText = formData.body.trim();
    const bodyParagraphs = bodyText ? bodyText.split("\n\n").filter(para => para.trim()) : [];
    const derivedContent = bodyParagraphs.length > 0 ? bodyParagraphs.join("\n\n") : formData.excerpt;
    const newsData = {
      ...formData,
      content: derivedContent,
      body: bodyParagraphs,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      comments: 0,
      backgroundColor: formData.backgroundColor || undefined,
    };
    delete newsData.id;

    try {
      if (isEditing) {
        await updateArticle(newsId, newsData);
      } else {
        await createArticle(newsData);
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

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
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
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  placeholder="Author name"
                />
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
                <label>Video URL (YouTube / embed link)</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
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
          </div>
        </div>

        <div className="admin-form-section full-width">
          <h3>Content</h3>
          
          <div className="form-group">
              <label>Body Content (separate paragraphs with blank lines)</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={10}
                placeholder="Write the full news content here (leave empty to use excerpt as content)"
              />
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
