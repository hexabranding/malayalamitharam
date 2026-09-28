import { useState, useEffect, useRef, Fragment } from "react";
import { Save, Bell, Lock, Palette, Globe, Database, RefreshCw, Upload, Calendar } from "lucide-react";
import { fetchSettingsAll, updateSetting, seedSettings, uploadImage } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";
import { buildDateDisplayItems, toBool } from "../utils/dateDisplay.js";

export default function AdminSettings({ navigate }) {
  const [settings, setSettings] = useState([]);
  const [dirty, setDirty] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetchSettingsAll();
    setSettings(Array.isArray(data) ? data : []);
  }

  function handleChange(key, value) {
    setDirty(prev => ({ ...prev, [key]: value }));
  }

  function getValue(key, def = "") {
    if (key in dirty) return dirty[key];
    const s = settings.find(s => s.key === key);
    if (!s) return def;
    const isBoolean = s.type === "boolean" || (KNOWN[key] && KNOWN[key].type === "boolean");
    if (isBoolean && typeof s.value === "string") {
      const t = s.value.trim().toLowerCase();
      if (t === "true" || t === "1") return true;
      if (t === "false" || t === "0") return false;
    }
    return s.value;
  }

  const SELECT_LABELS = {
    "malayalam": "Malayalam (മലയാളം)",
    "english": "English",
    "short": "Short (DD/MM/YYYY)",
    "arabic": "Arabic (العربية)",
    "12h": "12 Hour (AM/PM)",
    "24h": "24 Hour",
    "kollavarsham-hijri": "Malayalam → Arabic (both sides)",
    "hijri-kollavarsham": "Arabic → Malayalam (both sides)",
    "kollavarsham-only": "Malayalam only",
    "hijri-only": "Arabic only",
  };

  const KNOWN = {
    carousel_category_width: { label: "Carousel Category Badge Width (px)", type: "number", value: 5 },
    show_banner_date: { label: "Show Current Date in Banner", type: "boolean", value: true },
    banner_date_format: { label: "Banner Date Format", type: "select", value: "malayalam", options: ["malayalam", "english"] },
    banner_time_format: { label: "Banner Time Format", type: "select", value: "24h", options: ["12h", "24h"] },
    show_calendar_strip: { label: "Show Date Strip", type: "boolean", value: true },
    date_display_order: { label: "Date Display Order", type: "select", value: "kollavarsham-hijri", options: ["kollavarsham-hijri", "hijri-kollavarsham", "kollavarsham-only", "hijri-only"] },
    show_kollavarsham: { label: "Show Malayalam Date", type: "boolean", value: true },
    ml_show_weekday: { label: "Show Weekday", type: "boolean", value: true },
    ml_show_day: { label: "Show Day (date)", type: "boolean", value: true },
    ml_show_month: { label: "Show Month", type: "boolean", value: true },
    ml_show_year: { label: "Show Year (Kollavarsham)", type: "boolean", value: true },
    ml_day_override: { label: "Set Day (1-31, 0 = automatic)", type: "number", value: 0 },
    ml_date_override: { label: "Edit Malayalam Date (blank = automatic)", type: "text", value: "" },
    show_hijri_date: { label: "Show Arabic Date", type: "boolean", value: true },
    hijri_show_weekday: { label: "Show Weekday", type: "boolean", value: true },
    hijri_show_day: { label: "Show Day (date)", type: "boolean", value: true },
    hijri_show_month: { label: "Show Month", type: "boolean", value: true },
    hijri_show_year: { label: "Show Year (Hijri)", type: "boolean", value: true },
    hijri_day_override: { label: "Set Day (1-31, 0 = automatic)", type: "number", value: 0 },
    hijri_date_override: { label: "Edit Arabic Date (blank = automatic)", type: "text", value: "" },
    hijri_month_lang: { label: "Month & Weekday Name Language", type: "select", value: "malayalam", options: ["malayalam", "arabic"] },
    article_date_format: { label: "Article Date Format (Meta area)", type: "select", value: "malayalam", options: ["malayalam", "english", "short"] },
  };

  function getMeta(key) {
    const s = settings.find(s => s.key === key);
    const k = KNOWN[key];
    if (s && k) {
      // Prefer KNOWN metadata when DB has wrong/empty type (e.g. live DB has text for boolean)
      const type = s.type && s.type !== "text" ? s.type : k.type;
      const options = k.options || (s.options && s.options.length ? s.options : undefined);
      return { key, label: k.label || (s.label && s.label.trim()) || key, type: type || k.type, value: s.value, options };
    }
    if (s) return { key: s.key, label: s.label || s.key, type: s.type || "text", value: s.value, options: s.options };
    return k ? { key, label: k.label, type: k.type, value: k.value, options: k.options } : null;
  }

  async function handleSave() {
    try {
      for (const key of Object.keys(dirty)) {
        await updateSetting(key, dirty[key]);
      }
    } catch (err) {
      alert("Save failed: " + (err && err.message ? err.message : err));
      return;
    }
    setDirty({});
    setMsg("Settings saved!");
    setTimeout(() => setMsg(""), 3000);
    await load();
    window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "settings" } }));
  }

  async function handleSeed() {
    try {
      await seedSettings();
    } catch (err) {
      alert("Seed failed: " + (err && err.message ? err.message : err));
      return;
    }
    await load();
    setMsg("Default settings created!");
    setTimeout(() => setMsg(""), 3000);
    window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "settings" } }));
  }

  const renderField = (s) => {
    const val = getValue(s.key, s.value);
    switch (s.type) {
      case "color":
        return <input type="color" value={val} onChange={e => handleChange(s.key, e.target.value)} />;
      case "number":
        return <input type="number" value={val} onChange={e => handleChange(s.key, Number(e.target.value))} />;
      case "boolean":
        return (
          <label className="checkbox-control">
            <input type="checkbox" checked={!!val} onChange={e => handleChange(s.key, e.target.checked)} />
            {s.label}
          </label>
        );
      case "select":
        return (
          <select value={val} onChange={e => handleChange(s.key, e.target.value)}>
            {(s.options || []).map(opt => (
              <option key={opt} value={opt}>{SELECT_LABELS[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        );
      case "textarea":
        return <textarea rows={3} value={val} onChange={e => handleChange(s.key, e.target.value)} />;
      case "image":
        return (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={val} onChange={e => handleChange(s.key, e.target.value)} style={{ flex: 1 }} />
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 12px", background: "#0d4228", color: "#fff", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
                <Upload size={14} /> Upload
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await uploadImage(file);
                    const url = result.url || result.path || result.imageUrl;
                    if (url) handleChange(s.key, url);
                  } catch (err) {
                    alert("Upload failed: " + err.message);
                  }
                }} />
              </label>
            </div>
            {val && <img src={resolveImageUrl(val) || val} alt="" style={{ maxWidth: 200, maxHeight: 80, marginTop: 8, borderRadius: 4, objectFit: "contain", border: "1px solid #e3e9df" }} />}
          </div>
        );
      default:
        return <input value={val} onChange={e => handleChange(s.key, e.target.value)} />;
    }
  };

  const groups = [
    { icon: Globe, label: "Site Info", keys: ["site_name", "site_tagline"] },
    { icon: Palette, label: "Appearance", keys: ["site_logo", "site_banner", "footer_logo", "primary_color", "secondary_color", "title_bg_color", "carousel_category_width"] },
    {
      icon: Calendar,
      label: "Date Display",
      sections: [
        { title: "Current Date & Time", keys: ["show_banner_date", "banner_date_format", "banner_time_format"] },
        { title: "Date Strip", keys: ["show_calendar_strip", "date_display_order"] },
        { title: "Malayalam Date (കൊല്ലവർഷം)", keys: ["show_kollavarsham", "ml_show_weekday", "ml_show_day", "ml_show_month", "ml_show_year", "ml_day_override", "ml_date_override"] },
        { title: "Arabic Date (ഹിജ്രി)", keys: ["show_hijri_date", "hijri_show_weekday", "hijri_show_day", "hijri_show_month", "hijri_show_year", "hijri_month_lang", "hijri_day_override", "hijri_date_override"] },
        { title: "Article Meta Date", keys: ["article_date_format"] },
      ],
    },
    { icon: Bell, label: "Social Links", keys: ["facebook_url", "youtube_url", "twitter_url", "instagram_url", "whatsapp_url", "telegram_url", "linkedin_url", "threads_url"] },
    { icon: Database, label: "Configuration", keys: ["articles_per_page"] },
  ];

  const renderFields = (items) => items.map(s => s.type === "boolean" ? (
    <div key={s.key} className="form-group checkbox-group">
      {renderField(s)}
    </div>
  ) : (
    <div key={s.key} className="form-group">
      <label>{s.label || s.key}</label>
      {renderField(s)}
    </div>
  ));

  const previewSettings = {};
  settings.forEach(s => { previewSettings[s.key] = s.value; });
  Object.assign(previewSettings, dirty);
  const previewItems = buildDateDisplayItems(previewSettings, new Date());

  return (
    <div className="admin-settings-page">
      {msg && <div className="admin-notification">{msg}</div>}

      <div className="settings-grid">
        {groups.map(group => {
          const sections = (group.sections || [{ keys: group.keys }]).map(sec => ({
            ...sec,
            items: (sec.keys || []).map(getMeta).filter(Boolean),
          })).filter(sec => sec.items.length);
          if (sections.length === 0) return null;
          return (
            <div key={group.label} className="settings-section">
              <div className="settings-section-header">
                <group.icon size={24} />
                <h3>{group.label}</h3>
              </div>
              <div className="settings-form">
                {sections.map((sec, i) => sec.title ? (
                  <div key={sec.title} className="settings-subsection">
                    <div className="settings-subhead">{sec.title}</div>
                    {renderFields(sec.items)}
                  </div>
                ) : (
                  <Fragment key={i}>{renderFields(sec.items)}</Fragment>
                ))}
                {group.label === "Date Display" && (
                  <div className="date-preview">
                    <div className="date-preview-title">Current Display Preview</div>
                    <div className="date-preview-strip date-display">
                      {previewItems.length ? previewItems.map((item, i) => (
                        <Fragment key={i}>
                          {i > 0 && <span className="date-sep">|</span>}
                          <span className={item.rtl ? "date-item date-arabic" : "date-item"}>{item.text}</span>
                        </Fragment>
                      )) : <span className="date-item date-preview-empty">Nothing to display</span>}
                    </div>
                    {!toBool(previewSettings.show_calendar_strip, true) && (
                      <div className="date-preview-note">Date strip is hidden on the site — enable "Show Date Strip".</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="settings-section">
          <div className="settings-section-header">
            <Lock size={24} />
            <h3>Security Settings</h3>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Admin Password</label>
              <input type="password" placeholder="Enter new password" />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Confirm new password" />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <Database size={24} />
            <h3>Data Management</h3>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label>Initialize Default Settings</label>
              <button className="admin-btn secondary" onClick={handleSeed}>
                <RefreshCw size={16} /> Seed Default Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="admin-btn primary" onClick={handleSave}>
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  );
}
