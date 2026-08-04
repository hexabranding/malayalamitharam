import { useState, useEffect } from "react";
import { Save, Upload, Trash2 } from "lucide-react";
import { AD_SLOTS, fetchAdsAll, saveAd, deleteAdById, uploadImage } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";

export default function AdminAdsPage() {
  const [ads, setAds] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(AD_SLOTS[0].slot);
  const [form, setForm] = useState({ title: "", image: "", link: "", active: true, label: "" });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setForm({ title: "", image: "", link: "", active: true, label: AD_SLOTS.find((s) => s.slot === selectedSlot)?.title || "" });
  }, [selectedSlot]);

  async function load() {
    const data = await fetchAdsAll();
    setAds(Array.isArray(data) ? data : []);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setForm((prev) => ({ ...prev, image: result.url }));
      setMsg("Image uploaded!");
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSave(e) {
    e.preventDefault();
    const result = await saveAd({ slot: selectedSlot, ...form });
    if (result?._storageOk === false) {
      setMsg("Ad saved for this session, but storage is full — use smaller images to persist on reload.");
    } else {
      setMsg("Ad saved! Visible on user site.");
    }
    setTimeout(() => setMsg(""), 4000);
    setForm({ title: "", image: "", link: "", active: true, label: AD_SLOTS.find((s) => s.slot === selectedSlot)?.title || "" });
    await load();
    window.dispatchEvent(new Event("mm-data-updated"));
  }

  function handleClearForm() {
    setForm({ title: "", image: "", link: "", active: true, label: AD_SLOTS.find((s) => s.slot === selectedSlot)?.title || "" });
  }

  async function handleDelete(id) {
    if (!confirm("Remove this ad?")) return;
    await deleteAdById(id);
    setMsg("Ad removed.");
    setTimeout(() => setMsg(""), 2500);
    await load();
    window.dispatchEvent(new Event("mm-data-updated"));
  }

  const slotAds = ads.filter((a) => a.slot === selectedSlot);
  const slotInfo = AD_SLOTS.find((s) => s.slot === selectedSlot);
  const previewUrl = resolveImageUrl(form.image);

  return (
    <div className="admin-ads-page">
      {msg && <div className="admin-notification">{msg}</div>}

      <p className="admin-ads-intro">
        Add ad images here. They will show on all pages on the user site. For Top Leaderboard and Sidebar slots, add multiple ads to enable auto-sliding carousel.
      </p>

      <div className="admin-ads-layout">
        <aside className="admin-ads-slots">
          <h3>Ad Slots</h3>
          {AD_SLOTS.map((slot) => {
            const hasAd = ads.some((a) => a.slot === slot.slot && a.image);
            return (
              <button
                key={slot.slot}
                type="button"
                className={`admin-ads-slot-btn ${selectedSlot === slot.slot ? "active" : ""}`}
                onClick={() => setSelectedSlot(slot.slot)}
              >
                <span>{slot.title}</span>
                <small>{slot.label}</small>
                {hasAd && <em className="ad-active-dot">●</em>}
              </button>
            );
          })}
        </aside>

        <form className="admin-ads-form" onSubmit={handleSave}>
          <h3>{slotInfo?.title}</h3>
          <p className="admin-ads-slot-desc">{slotInfo?.label}</p>

          {slotAds.length > 0 && (
            <div className="admin-existing-ads">
              <h4>Existing Ads ({slotAds.length})</h4>
              {slotAds.map((ad) => (
                <div key={ad._id} className="admin-existing-ad">
                  <img src={resolveImageUrl(ad.image)} alt={ad.title} />
                  <span>{ad.title || "No title"}</span>
                  <button type="button" className="admin-btn danger" onClick={() => handleDelete(ad._id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>Ad Title (optional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ad Title"
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://... or /uploads/..."
            />
          </div>

          <div className="form-group">
            <label>Upload Photo</label>
            <label className="admin-upload-btn">
              <Upload size={16} />
              {uploading ? "Uploading..." : "Choose Image"}
              <input type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
            </label>
          </div>

          {previewUrl && (
            <div className="admin-ad-preview">
              <img src={previewUrl} alt="Ad preview" />
            </div>
          )}

          <div className="form-group">
            <label>Click Link (optional)</label>
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://advertiser.com"
            />
          </div>

          <label className="checkbox-group">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active (show on user site)
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary">
              <Save size={18} /> Add Ad
            </button>
            <button type="button" className="admin-btn secondary" onClick={handleClearForm}>
              Clear Form
            </button>
          </div>
        </form>

        <div className="admin-ads-user-preview">
          <h3>User Site Preview</h3>
          <div className="admin-preview-note">Read-only — same as public site</div>
          {previewUrl ? (
            <div className="ad-slot has-image compact-ad">
              <img src={previewUrl} alt={form.title || "Ad"} className="ad-slot-image" />
            </div>
          ) : (
            <div className="ad-slot compact-ad">
              <span>{slotInfo?.label}</span>
              <strong>Ad Space</strong>
              <small>300 x 250</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
