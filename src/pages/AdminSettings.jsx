import { useState, useEffect, useRef } from "react";
import { Save, Bell, Lock, Palette, Globe, Database, RefreshCw, Upload, Calendar, Eye } from "lucide-react";
import { fetchSettingsAll, updateSetting, seedSettings, uploadImage } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";

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
    return s ? s.value : def;
  }

  const SELECT_LABELS = {
    "malayalam": "Malayalam (മലയാളം)",
    "english": "English",
    "short": "Short (DD/MM/YYYY)",
    "12h": "12 Hour (AM/PM)",
    "24h": "24 Hour",
    "kollavarsham-hijri": "Kollavarsham → Hijri",
    "hijri-kollavarsham": "Hijri → Kollavarsham",
    "kollavarsham-only": "Kollavarsham Only",
    "hijri-only": "Hijri Only",
  };

  const KOLLAVARSHAM_MONTHS = ["മേടം", "ഇടവം", "മിഥുനം", "കര്‍ക്കടകം", "ചിങ്ങം", "കന്നി", "തുലാം", "വൃശ്ചികം", "ധനു", "മകരം", "കുംഭം", "മീനം"];
  const HIJRI_MONTHS = ["മുഹറം", "സഫർ", "റബീഉൽ അവ്വൽ", "റബീഉൽ ആഖിർ", "ജുമാദ ഉൽ ഉലാ", "ജുമാദ ഉൽ ആഖിറ", "റജബ്", "ശഅബാൻ", "റമദാൻ", "ശവ്വൽ", "ദുൽ ഖഅദ്", "ദുൽ ഹിജ്ജ"];

  const KNOWN = {
    carousel_category_width: { label: "Carousel Category Badge Width (px)", type: "number", value: 5 },
    show_banner_date: { label: "Show Banner Date", type: "boolean", value: true },
    banner_date_format: { label: "Banner Date Format", type: "select", value: "malayalam", options: ["malayalam", "english"] },
    banner_time_format: { label: "Banner Time Format", type: "select", value: "24h", options: ["12h", "24h"] },
    show_calendar_strip: { label: "Show Calendar Strip (Kollavarsham / Hijri bar)", type: "boolean", value: true },
    date_display_order: { label: "Date Display Order", type: "select", value: "kollavarsham-hijri", options: ["kollavarsham-hijri", "hijri-kollavarsham", "kollavarsham-only", "hijri-only"] },
    show_kollavarsham: { label: "Show Kollavarsham Date", type: "boolean", value: true },
    show_hijri_date: { label: "Show Hijri Date", type: "boolean", value: true },
    article_date_format: { label: "Article Date Format (Meta area)", type: "select", value: "malayalam", options: ["malayalam", "english", "short"] },
    kollavarsham_manual_enabled: { label: "Enable Manual Kollavarsham (override auto)", type: "boolean", value: false },
    kollavarsham_day: { label: "Kollavarsham Day — തീയതി (1-32)", type: "number", value: 1 },
    kollavarsham_month: { label: "Kollavarsham Month — മാസം", type: "select", value: "മേടം", options: KOLLAVARSHAM_MONTHS },
    kollavarsham_year: { label: "Kollavarsham Year — വർഷം (e.g. 1201)", type: "number", value: 1201 },
    hijri_manual_enabled: { label: "Enable Manual Hijri (override auto)", type: "boolean", value: false },
    hijri_day: { label: "Hijri Day — തീയതി (1-30)", type: "number", value: 1 },
    hijri_month: { label: "Hijri Month — മാസം", type: "select", value: "മുഹറം", options: HIJRI_MONTHS },
    hijri_year: { label: "Hijri Year — വർഷം (e.g. 1447)", type: "number", value: 1447 },
  };

  function getMeta(key) {
    const s = settings.find(s => s.key === key);
    if (s) return { key: s.key, label: s.label || s.key, type: s.type || "text", value: s.value, options: s.options };
    const k = KNOWN[key];
    return k ? { key, label: k.label, type: k.type, value: k.value, options: k.options } : null;
  }

  async function handleSave() {
    for (const key of Object.keys(dirty)) {
      await updateSetting(key, dirty[key]);
    }
    setDirty({});
    setMsg("Settings saved!");
    setTimeout(() => setMsg(""), 3000);
    await load();
    window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "settings" } }));
  }

  async function handleSeed() {
    await seedSettings();
    await load();
    setMsg("Default settings created!");
    setTimeout(() => setMsg(""), 3000);
  }

  // Preview helpers for manual dates
  const kManualEnabled = !!getValue("kollavarsham_manual_enabled", false);
  const hManualEnabled = !!getValue("hijri_manual_enabled", false);
  const kDay = getValue("kollavarsham_day", 1);
  const kMonth = getValue("kollavarsham_month", "മേടം");
  const kYear = getValue("kollavarsham_year", 1201);
  const hDay = getValue("hijri_day", 1);
  const hMonth = getValue("hijri_month", "മുഹറം");
  const hYear = getValue("hijri_year", 1447);
  const previewKollavarsham = `${kMonth} ${kDay}, ${kYear} കൊല്ലവർഷം`;
  const previewHijri = `${hDay} ${hMonth} ${hYear}`;
  const previewOrder = getValue("date_display_order", "kollavarsham-hijri");
  const previewShowK = !!getValue("show_kollavarsham", true);
  const previewShowH = !!getValue("show_hijri_date", true);
  const previewShowStrip = getValue("show_calendar_strip", true) !== false;

  function renderPreviewStrip() {
    if (!previewShowStrip) return <span style={{ color: "#666", fontStyle: "italic" }}>Hidden (Show Calendar Strip OFF)</span>;
    let kText = previewKollavarsham;
    let hText = previewHijri;
    if (kManualEnabled) kText += " • manual";
    else kText += " • auto";
    if (hManualEnabled) hText += " • manual";
    else hText += " • auto";
    if (previewOrder === "kollavarsham-only") return <span>{previewShowK ? kText : "(hidden)"}</span>;
    if (previewOrder === "hijri-only") return <span>{previewShowH ? hText : "(hidden)"}</span>;
    if (previewOrder === "hijri-kollavarsham") {
      return <span>{previewShowH ? hText : ""}{previewShowH && previewShowK ? " | " : ""}{previewShowK ? kText : ""}</span>;
    }
    return <span>{previewShowK ? kText : ""}{previewShowK && previewShowH ? " | " : ""}{previewShowH ? hText : ""}</span>;
  }

  const isManualKField = (key) => ["kollavarsham_day", "kollavarsham_month", "kollavarsham_year"].includes(key);
  const isManualHField = (key) => ["hijri_day", "hijri_month", "hijri_year"].includes(key);

  const renderField = (s) => {
    const val = getValue(s.key, s.value);
    const disabledK = isManualKField(s.key) && !kManualEnabled;
    const disabledH = isManualHField(s.key) && !hManualEnabled;
    const isDisabled = disabledK || disabledH;
    const disabledStyle = isDisabled ? { opacity: 0.45, pointerEvents: "none" } : {};

    switch (s.type) {
      case "color":
        return <input type="color" value={val} onChange={e => handleChange(s.key, e.target.value)} style={disabledStyle} disabled={isDisabled} />;
      case "number":
        return <input type="number" value={val} onChange={e => handleChange(s.key, Number(e.target.value))} style={disabledStyle} disabled={isDisabled} />;
      case "boolean":
        return (
          <label className="checkbox-group">
            <input type="checkbox" checked={!!val} onChange={e => handleChange(s.key, e.target.checked)} />
            {s.label}
          </label>
        );
      case "select":
        return (
          <select value={val} onChange={e => handleChange(s.key, e.target.value)} style={disabledStyle} disabled={isDisabled}>
            {(s.options || []).map(opt => (
              <option key={opt} value={opt}>{SELECT_LABELS[opt] || opt}</option>
            ))}
          </select>
        );
      case "textarea":
        return <textarea rows={3} value={val} onChange={e => handleChange(s.key, e.target.value)} style={disabledStyle} disabled={isDisabled} />;
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
        return <input value={val} onChange={e => handleChange(s.key, e.target.value)} style={disabledStyle} disabled={isDisabled} />;
    }
  };

  const groups = [
    { icon: Globe, label: "Site Info", keys: ["site_name", "site_tagline"] },
    { icon: Palette, label: "Appearance", keys: ["site_logo", "site_banner", "footer_logo", "primary_color", "secondary_color", "title_bg_color", "carousel_category_width"] },
    { icon: Calendar, label: "Date Display — General", keys: ["show_banner_date", "banner_date_format", "banner_time_format", "show_calendar_strip", "date_display_order", "show_kollavarsham", "show_hijri_date", "article_date_format"], description: "Controls banner date/time and calendar strip visibility / order. Kollavarsham & Hijri can be auto (from today) or manual below." },
    { icon: Calendar, label: "മലയാളം Kollavarsham — Manual Edit", keys: ["kollavarsham_manual_enabled", "kollavarsham_day", "kollavarsham_month", "kollavarsham_year"], description: "When enabled, the Kollavarsham shown in the header top-strip uses your year/month/day instead of auto-calculated date. Example: ചിങ്ങം 1, 1201 കൊല്ലവർഷം." },
    { icon: Calendar, label: "Arabic Hijri — Manual Edit", keys: ["hijri_manual_enabled", "hijri_day", "hijri_month", "hijri_year"], description: "When enabled, the Hijri date in the header uses your year/month/day instead of auto. Example: 1 മുഹറം 1447." },
    { icon: Bell, label: "Social Links", keys: ["facebook_url", "youtube_url", "twitter_url", "instagram_url", "whatsapp_url", "telegram_url", "linkedin_url", "threads_url"] },
    { icon: Database, label: "Configuration", keys: ["articles_per_page"] },
  ];

  return (
    <div className="admin-settings-page">
      {msg && <div className="admin-notification">{msg}</div>}

      <div className="settings-grid">
        {groups.map(group => {
          const groupSettings = group.keys.map(getMeta).filter(Boolean);
          if (groupSettings.length === 0) return null;
          const isDateGroup = group.label.includes("Date Display") || group.label.includes("Kollavarsham") || group.label.includes("Hijri");
          return (
            <div key={group.label} className="settings-section" style={isDateGroup ? { borderLeft: "4px solid #0d4228" } : {}}>
              <div className="settings-section-header">
                <group.icon size={24} />
                <h3>{group.label}</h3>
              </div>
              {group.description && <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px 0", lineHeight: 1.5 }}>{group.description}</p>}
              {/* Live preview for date groups */}
              {group.label === "Date Display — General" && (
                <div style={{ background: "#f6f8f3", border: "1px solid #dfe8d8", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "#0d4228", marginBottom: 4 }}><Eye size={14} /> Live Preview — Header Top Strip</div>
                  <div style={{ fontFamily: "monospace", background: "#fff", padding: "6px 8px", borderRadius: 6, border: "1px solid #e3e9df" }}>{renderPreviewStrip()}</div>
                  <div style={{ color: "#777", fontSize: 11, marginTop: 4 }}>{kManualEnabled ? "Kollavarsham: manual" : "Kollavarsham: auto"} • {hManualEnabled ? "Hijri: manual" : "Hijri: auto"} • Order: {previewOrder}</div>
                </div>
              )}
              {group.label.includes("Kollavarsham — Manual") && !kManualEnabled && (
                <div style={{ background: "#fff8e1", border: "1px solid #ffeaa7", borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontSize: 12, color: "#6d4c00" }}>Toggle ON to enable editing. Currently auto-calculated date is shown on site.</div>
              )}
              {group.label.includes("Hijri — Manual") && !hManualEnabled && (
                <div style={{ background: "#fff8e1", border: "1px solid #ffeaa7", borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontSize: 12, color: "#6d4c00" }}>Toggle ON to enable editing. Currently auto Hijri is shown.</div>
              )}
              <div className="settings-form">
                {groupSettings.map(s => {
                  const isDimmed = (isManualKField(s.key) && !kManualEnabled) || (isManualHField(s.key) && !hManualEnabled);
                  return (
                    <div key={s.key} className="form-group" style={isDimmed ? { opacity: 0.6 } : {}}>
                      <label>{s.label || s.key} {isDimmed && <span style={{ fontWeight: 400, color: "#999", fontSize: 11 }}>(enable toggle first)</span>}</label>
                      {renderField(s)}
                    </div>
                  );
                })}
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
