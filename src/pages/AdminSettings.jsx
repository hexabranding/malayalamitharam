import { useState, useEffect } from "react";
import { Save, Bell, Lock, Palette, Globe, Database, RefreshCw } from "lucide-react";
import { fetchSettingsAll, updateSetting, seedSettings } from "../services/api.js";
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

  const KNOWN = {
    carousel_category_width: { label: "Carousel Category Badge Width (px)", type: "number", value: 5 },
  };

  function getMeta(key) {
    const s = settings.find(s => s.key === key);
    if (s) return { key: s.key, label: s.label || s.key, type: s.type || "text", value: s.value };
    const k = KNOWN[key];
    return k ? { key, label: k.label, type: k.type, value: k.value } : null;
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

  const renderField = (s) => {
    const val = getValue(s.key, s.value);
    switch (s.type) {
      case "color":
        return <input type="color" value={val} onChange={e => handleChange(s.key, e.target.value)} />;
      case "number":
        return <input type="number" value={val} onChange={e => handleChange(s.key, Number(e.target.value))} />;
      case "boolean":
        return (
          <label className="checkbox-group">
            <input type="checkbox" checked={!!val} onChange={e => handleChange(s.key, e.target.checked)} />
            {s.label}
          </label>
        );
      case "textarea":
        return <textarea rows={3} value={val} onChange={e => handleChange(s.key, e.target.value)} />;
      case "image":
        return (
          <div>
            <input value={val} onChange={e => handleChange(s.key, e.target.value)} />
            {val && <img src={resolveImageUrl(val) || val} alt="" style={{ maxWidth: 120, maxHeight: 60, marginTop: 8, borderRadius: 4, objectFit: "contain" }} />}
          </div>
        );
      default:
        return <input value={val} onChange={e => handleChange(s.key, e.target.value)} />;
    }
  };

  const groups = [
    { icon: Globe, label: "Site Info", keys: ["site_name", "site_tagline"] },
    { icon: Palette, label: "Appearance", keys: ["site_logo", "site_banner", "primary_color", "secondary_color", "title_bg_color", "carousel_category_width"] },
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
          return (
            <div key={group.label} className="settings-section">
              <div className="settings-section-header">
                <group.icon size={24} />
                <h3>{group.label}</h3>
              </div>
              <div className="settings-form">
                {groupSettings.map(s => (
                  <div key={s.key} className="form-group">
                    <label>{s.label || s.key}</label>
                    {renderField(s)}
                  </div>
                ))}
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
