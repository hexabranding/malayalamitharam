import { ChevronDown, Facebook, Instagram, Linkedin, Menu, MessageCircle, Search, Send, Twitter, X, Youtube } from "lucide-react";
import { useState, useEffect } from "react";
import { menuGroups, fetchSettings } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";

export default function Header({ navigate, activeSlug }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
    function refresh() {
      fetchSettings().then(setSettings).catch(() => {});
    }
    window.addEventListener("mm-data-updated", refresh);
    return () => window.removeEventListener("mm-data-updated", refresh);
  }, []);

  const openPath = (item) => item.path || (item.slug === "home" ? "/" : "/category/" + item.slug);
  const banner = resolveImageUrl(settings.site_banner) || "/images/malayala-mitra-banner.jpeg";
  const logo = resolveImageUrl(settings.site_logo) || "/images/malayalamithram-logo.png";
  const tagline = settings.site_tagline || "മലയാളികളുടെ വാർത്താ കൂട്ടുകാരൻ";
  const siteName = settings.site_name || "Malayalamithram";
  const social = {
    facebook: settings.facebook_url,
    youtube: settings.youtube_url,
    twitter: settings.twitter_url,
    instagram: settings.instagram_url,
    whatsapp: settings.whatsapp_url,
    telegram: settings.telegram_url,
    linkedin: settings.linkedin_url,
  };

  return (
    <header className="site-header">
      <div className="banner-wrap"><img src={banner} alt="മലയാളമിത്രം" /></div>
      <div className="top-strip"><div className="container strip-inner"><span>{new Date().toLocaleDateString("ml-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><span>{tagline}</span><button onClick={() => navigate("/login")} style={{ background: "#bd1d25", color: "#fff", padding: "2px 12px", borderRadius: 4, fontWeight: 700, fontSize: 12, marginLeft: "auto" }}>Admin</button></div></div>
      <div className="container masthead">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="മെനു തുറക്കുക"><Menu size={22} /></button>
        <button className="brand" onClick={() => navigate("/")}>
          <img src={logo} alt="മലയാളമിത്രം" className="brand-logo-img" />
        </button>
        <form className="search-form" onSubmit={(event) => { event.preventDefault(); const query = new FormData(event.currentTarget).get("q"); navigate("/search?q=" + encodeURIComponent(String(query || "").trim())); }}>
          <button type="submit" className="search-submit" aria-label="Search"><Search size={18} /></button><input name="q" placeholder="വാർത്തകൾ തിരയുക" />
        </form>
        <div className="social-links" aria-label="Social links">
          {social.facebook && social.facebook !== "#" && <a href={social.facebook} target="_blank" rel="noopener noreferrer"><Facebook size={18} /></a>}
          {social.youtube && social.youtube !== "#" && <a href={social.youtube} target="_blank" rel="noopener noreferrer"><Youtube size={19} /></a>}
          {social.twitter && social.twitter !== "#" && <a href={social.twitter} target="_blank" rel="noopener noreferrer"><Twitter size={18} /></a>}
          {social.instagram && social.instagram !== "#" && <a href={social.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={18} /></a>}
          {social.whatsapp && social.whatsapp !== "#" && <a href={social.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /></a>}
          {social.telegram && social.telegram !== "#" && <a href={social.telegram} target="_blank" rel="noopener noreferrer"><Send size={18} /></a>}
          {social.linkedin && social.linkedin !== "#" && <a href={social.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={18} /></a>}
          {!social.facebook && !social.youtube && !social.twitter && !social.instagram && !social.whatsapp && !social.telegram && !social.linkedin && (
            <><Facebook size={18} /><Youtube size={19} /><Twitter size={18} /><Instagram size={18} /></>
          )}
        </div>
      </div>
      <nav className="main-nav"><div className="container nav-scroll">
        {menuGroups.map((group) => (
          <div 
            className="nav-group" 
            key={group.slug}
            onMouseEnter={() => group.children && setActiveDropdown(group.slug)}
            onMouseLeave={() => group.children && setActiveDropdown(null)}
          >
            <button 
              className={activeSlug === group.slug || group.children?.some((child) => child.slug === activeSlug) ? "active" : ""} 
              onClick={() => {
                if (group.children) {
                  setActiveDropdown(activeDropdown === group.slug ? null : group.slug);
                } else {
                  navigate(openPath(group));
                }
              }}
            >
              {group.label}{group.children && <ChevronDown size={14} />}
            </button>
            {group.children && activeDropdown === group.slug && (
              <div className="dropdown-menu-custom">
                {group.children.map((child) => (
                  <button key={child.slug} onClick={() => { setActiveDropdown(null); navigate(openPath(child)); }}>
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div></nav>
      {menuOpen && <div className="drawer"><div className="drawer-panel">
        <button className="icon-button close" onClick={() => setMenuOpen(false)} aria-label="മെനു അടയ്ക്കുക"><X size={22} /></button>
        {menuGroups.map((group) => <div className="drawer-group" key={group.slug}><button onClick={() => { if (!group.children) { setMenuOpen(false); navigate(openPath(group)); } }}>{group.label}</button>{group.children?.map((child) => <button className="drawer-child" key={child.slug} onClick={() => { setMenuOpen(false); navigate(openPath(child)); }}>{child.label}</button>)}</div>)}
      </div></div>}
    </header>
  );
}
