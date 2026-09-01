import { useState, useEffect, useRef } from "react";
import { Save, X, Upload, ChevronDown } from "lucide-react";
import { fetchNews, createArticle, updateArticle, loadMenuGroups, uploadImage, translateText, fetchAuthors, createAuthor } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";
import { articles as fallback } from "../data/news.js";
import { slugify as frontendSlugify } from "../utils/slugify.js";
import { isSafeVideoUrl, detectPlatform, getEmbedUrl } from "../utils/videoEmbed.js";

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
  const [translating, setTranslating] = useState(false);
  const translateTimeoutRef = useRef(null);
  const [authorsList, setAuthorsList] = useState([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [creatingAuthor, setCreatingAuthor] = useState(false);
  const authorRef = useRef(null);

  useEffect(() => {
    loadMenuGroups().then(setMenuGroupsData).catch(() => {});
    fetchAuthors().then(data => {
      if (Array.isArray(data)) setAuthorsList(data);
      else if (Array.isArray(data?.authors)) setAuthorsList(data.authors);
      else if (Array.isArray(data?.data)) setAuthorsList(data.data);
      else setAuthorsList([]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (authorRef.current && !authorRef.current.contains(e.target)) setShowAuthorDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showAuthorDropdown) {
      fetchAuthors().then(data => {
        if (Array.isArray(data)) setAuthorsList(data);
        else if (Array.isArray(data?.authors)) setAuthorsList(data.authors);
        else if (Array.isArray(data?.data)) setAuthorsList(data.data);
      }).catch(() => {});
    }
  }, [showAuthorDropdown]);

  // Auto-translate Malayalam title to English and generate slug
  useEffect(() => {
    if (isEditing || !formData.title) return;
    if (formData.titleEn || formData.slugManuallyEdited) return;
    
    // Check if title contains Malayalam characters
    const hasMalayalam = /[\u0D00-\u0D7F]/.test(formData.title);
    if (!hasMalayalam) return;

    // Clear previous timeout
    if (translateTimeoutRef.current) {
      clearTimeout(translateTimeoutRef.current);
    }

    // Debounce translation
    translateTimeoutRef.current = setTimeout(async () => {
      setTranslating(true);
      try {
        const result = await translateText(formData.title);
        if (result.translatedText) {
          const slug = frontendSlugify(result.translatedText);
          setFormData(prev => ({
            ...prev,
            titleEn: result.translatedText,
            slug: slug || prev.slug,
          }));
        }
      } catch (err) {
        console.error("Translation failed:", err);
      }
      setTranslating(false);
    }, 800);

    return () => {
      if (translateTimeoutRef.current) {
        clearTimeout(translateTimeoutRef.current);
      }
    };
  }, [formData.title, isEditing]);

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
              categories: found.categories || (found.category ? [found.category] : []),
              categoryMl: found.categoryMl || "",
              author: found.author || "",
              date: found.date || "",
              readTime: found.readTime || "",
              image: found.image || "",
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
              body: found.body?.join("\n\n") || "",
              tags: found.tags?.join(", ") || "",
              backgroundColor: found.backgroundColor || "",
              likes: found.likes || 0,
              views: found.views || 0,
            });
            setImagePreview(found.image || "");
            setAuthorSearch(found.author || "");
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
    setFormData(prev => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "titleEn" && !prev.slugManuallyEdited) {
        let base = frontendSlugify(value);
        base = base.replace(/^new-\d{8,}-?/, "");
        if (base) next.slug = base;
      }
      return next;
    });
  };

  const handleEngSlugChange = (e) => {
    let value = frontendSlugify(e.target.value);
    value = value.replace(/^new-\d{8,}-?/, "");
    if (!value) value = e.target.value.replace(/^new-\d{8,}-?/, "");
    setFormData(prev => ({
      ...prev,
      slug: value,
      slugManuallyEdited: true,
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

  const handleAuthorSelect = (author) => {
    setFormData(prev => ({ ...prev, author: author.name }));
    setAuthorSearch(author.name);
    setShowAuthorDropdown(false);
  };

  const handleAuthorInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, author: value }));
    setAuthorSearch(value);
    setShowAuthorDropdown(true);
  };

  const handleCreateAuthor = async () => {
    const name = authorSearch.trim();
    if (!name) return;
    setCreatingAuthor(true);
    try {
      const newAuthor = await createAuthor({ name });
      setAuthorsList(prev => [...prev, newAuthor]);
      setFormData(prev => ({ ...prev, author: name }));
      setShowAuthorDropdown(false);
    } catch {}
    setCreatingAuthor(false);
  };

  const filteredAuthors = authorSearch.trim()
    ? authorsList.filter(a => a.name && a.name.toLowerCase().includes(authorSearch.toLowerCase()))
    : authorsList;

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

  const addRelatedVideo = () => {
    const url = newVideoUrl.trim();
    if (!url) { alert("Please enter a video URL"); return; }
    if (!isSafeVideoUrl(url)) { alert("Invalid or unsafe URL. Only https URLs are allowed (no javascript/data)."); return; }
    const platform = detectPlatform(url);
    if (platform === "unknown") { alert("Unsupported video URL. Supports YouTube, Vimeo, Dailymotion, Facebook, Instagram, TikTok, and https embed links."); return; }
    const embedCheck = getEmbedUrl(url);
    if (!embedCheck) { alert("This URL cannot be embedded. Please use a direct video link (e.g., youtube.com/watch?v=...)"); return; }
    setFormData(prev => ({
      ...prev,
      relatedVideos: [...prev.relatedVideos, { title: newVideoTitle.trim(), videoUrl: url, thumbnail: "", platform }]
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
    const bodyParagraphs = bodyText ? bodyText.split("\n\n").filter(para => para.trim()) : [];
    const derivedContent = bodyParagraphs.length > 0 ? bodyParagraphs.join("\n\n") : formData.excerpt;
    const newsData = {
      ...formData,
      categories: formData.categories.length > 0 ? formData.categories : [formData.category].filter(Boolean),
      content: derivedContent,
      body: bodyParagraphs,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      likes: Number(formData.likes) || 0,
      views: Number(formData.views) || 0,
      comments: 0,
      backgroundColor: formData.backgroundColor || undefined,
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
              <label>English Title (optional — the server translates the Malayalam title when omitted)</label>
              <input
                type="text"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleChange}
                placeholder="e.g., Rahul Gandhi Calls Kharge"
              />
            </div>

            <div className="form-group">
              <label>SEO Slug (auto-generated from English title — edit if needed)</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleEngSlugChange}
                placeholder={translating ? "Translating..." : "Auto-generated from English title (e.g., heavy-rain-kerala-coast)"}
              />
              {translating && (
                <small style={{ display: "block", marginTop: 4, color: "#1a56db", fontSize: 13 }}>
                  Translating Malayalam title to English...
                </small>
              )}
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

              <div className="form-group" ref={authorRef} style={{ position: "relative" }}>
                <label>Author <span style={{ color: "#999", fontWeight: 400, fontSize: 12 }}>— select from existing or create new</span></label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleAuthorInputChange}
                    onFocus={() => setShowAuthorDropdown(true)}
                    required
                    placeholder="Select or type author..."
                    autoComplete="off"
                    style={{ flex: 1, paddingRight: 36 }}
                  />
                  <button type="button" onClick={() => setShowAuthorDropdown(v => !v)} style={{ position: "absolute", right: 6, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 4, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Toggle authors">
                    <ChevronDown size={16} style={{ transform: showAuthorDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>
                </div>
                {showAuthorDropdown && (
                  <div className="author-dropdown" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ddd", borderRadius: 6, maxHeight: 220, overflow: "auto", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginTop: 4 }}>
                    {authorsList.length === 0 ? (
                      <div style={{ padding: "12px", color: "#999", fontSize: 13, textAlign: "center" }}>No authors created yet. Type a name and create.</div>
                    ) : filteredAuthors.length > 0 ? filteredAuthors.map(a => (
                      <div
                        key={a._id}
                        onClick={() => handleAuthorSelect(a)}
                        style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      >
                        <span><strong>{a.name}</strong>{a.nameMl && <span style={{ marginLeft: 8, color: "#666" }}>{a.nameMl}</span>}</span>
                        {a.role && <span style={{ color: "#999", fontSize: 12 }}>{a.role}</span>}
                      </div>
                    )) : null}
                    {authorSearch.trim() && filteredAuthors.length === 0 && !creatingAuthor && (
                      <div onClick={handleCreateAuthor} style={{ padding: "9px 12px", cursor: "pointer", color: "#1a56db", fontSize: 14, fontWeight: 600, background: "#f0f6ff" }}>
                        + Create "{authorSearch.trim()}" as new author
                      </div>
                    )}
                    {authorSearch.trim() && filteredAuthors.length === 0 && creatingAuthor && (
                      <div style={{ padding: "9px 12px", color: "#666", fontSize: 14 }}>Creating...</div>
                    )}
                    {authorsList.length > 0 && <div style={{ padding: "6px 12px", fontSize: 11, color: "#999", borderTop: "1px solid #eee", background: "#fafafa" }}>{filteredAuthors.length} author{filteredAuthors.length !== 1 ? "s" : ""} {authorSearch.trim() ? "matched" : "available"} — click to select</div>}
                  </div>
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
                <label>Video URL (supports YouTube, YouTube Shorts, Vimeo, Dailymotion, Facebook, Instagram, TikTok, and any embed link)</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="Paste any video link: YouTube, Shorts, Vimeo, Dailymotion, Facebook, Instagram, TikTok..."
                />
                {formData.videoUrl && !isSafeVideoUrl(formData.videoUrl) && <small style={{ color: "#c91f26", fontSize: 11 }}>Unsafe URL — only https links allowed.</small>}
                {formData.videoUrl && isSafeVideoUrl(formData.videoUrl) && !getEmbedUrl(formData.videoUrl) && <small style={{ color: "#b7791f", fontSize: 11 }}>This URL may not be embeddable.</small>}
                {formData.videoUrl && isSafeVideoUrl(formData.videoUrl) && getEmbedUrl(formData.videoUrl) && <small style={{ color: "#15803d", fontSize: 11 }}>✓ {detectPlatform(formData.videoUrl)} → {getEmbedUrl(formData.videoUrl)}</small>}
              </div>
            </div>

            <div className="form-group">
              <label>Related Videos (shown on detail page) — supports YouTube, YouTube Shorts, Vimeo, Dailymotion, Facebook, Instagram, TikTok, and any embed link</label>
              {formData.relatedVideos.length > 0 ? (
                <div className="related-videos-list" style={{ display: "grid", gap: 8, marginBottom: 10, maxWidth: "100%", overflow: "hidden" }}>
                  {formData.relatedVideos.map((video, index) => (
                    <div key={index} className="related-video-item" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f8faf7", border: "1px solid #dfe6db", borderRadius: 6, maxWidth: "100%", overflow: "hidden", minWidth: 0 }}>
                      <span style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                        <strong style={{ display: "block", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{video.title || "Untitled"}</strong>
                        <span style={{ display: "block", fontSize: 11, color: "#666", wordBreak: "break-all", overflowWrap: "anywhere", lineBreak: "anywhere", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={video.videoUrl}>{video.videoUrl.length > 80 ? video.videoUrl.slice(0, 80) + "…" : video.videoUrl}</span>
                        <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, padding: "2px 6px", borderRadius: 10, background: "#e6f0ff", color: "#1a56db" }}>{video.platform || detectPlatform(video.videoUrl)}</span>
                      </span>
                      <button type="button" className="btn-remove" onClick={() => removeRelatedVideo(index)} style={{ flexShrink: 0, padding: 6, borderRadius: 4, border: "1px solid #f0c0c0", background: "#fff", color: "#c91f26", cursor: "pointer" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <small style={{ display: "block", marginBottom: 8, color: "#888", fontSize: 12 }}>No related videos yet. Add one below — all will appear on the news detail page.</small>
              )}
              <div className="add-related-video" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Video title (optional)"
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  style={{ flex: "1 1 140px" }}
                />
                <input
                  type="text"
                  placeholder="Paste any video link: YouTube, Shorts, Vimeo, Dailymotion, Facebook, Instagram, TikTok..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  style={{ flex: "2 1 260px" }}
                />
                <button type="button" className="btn-add" onClick={addRelatedVideo} style={{ padding: "8px 14px", background: "#1a56db", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ Add</button>
              </div>
              {newVideoUrl && !isSafeVideoUrl(newVideoUrl) && <small style={{ color: "#c91f26", fontSize: 11 }}>Unsafe URL — only https links allowed.</small>}
              {newVideoUrl && isSafeVideoUrl(newVideoUrl) && !getEmbedUrl(newVideoUrl) && <small style={{ color: "#b7791f", fontSize: 11 }}>This URL may not be embeddable. Use a direct video page URL.</small>}
              {newVideoUrl && isSafeVideoUrl(newVideoUrl) && getEmbedUrl(newVideoUrl) && <small style={{ color: "#15803d", fontSize: 11 }}>✓ Will embed as: {detectPlatform(newVideoUrl)} → {getEmbedUrl(newVideoUrl)}</small>}
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
              <label>Body Content (separate paragraphs with blank lines)</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={10}
                placeholder="Write the full news content here (leave empty to use excerpt as content)"
              />
              <small style={{ display: "block", marginTop: 6, color: "#666", fontSize: 13, lineHeight: 1.5 }}>
                Add clickable links: <code>[link text](https://example.com)</code> — Example: "കൂടുതൽ വായിക്കൂ <code>[ഇവിടെ](https://example.com)</code>" will show as a clickable link.
              </small>
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
