import { AtSign, ChevronDown, Facebook, Instagram, Linkedin, Menu, MessageCircle, Search, Send, Twitter, X, Youtube } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSettings, useMenuGroups } from "../context/DataContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";
import { fetchNews } from "../services/api.js";
import { getKollavarsham, getHijriDate } from "../utils/calendars.js";
import { getTitleSlug, registerArticles } from "../utils/articleStore.js";

export default function Header({ navigate, activeSlug }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const settings = useSettings();
  const navGroups = useMenuGroups();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNews({ search: searchQuery.trim(), limit: 6 }).then(data => {
        const results = (data.news || []).slice(0, 6);
        setSuggestions(results);
        registerArticles(results);
      }).catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  function handleSuggestionClick(article) {
    setShowSuggestions(false);
    setSearchQuery("");
    navigate("/post/" + getTitleSlug(article));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate("/search?q=" + encodeURIComponent(q));
  }

  const ML_WEEKDAYS = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"];
  const ML_MONTHS = ["ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ", "മേയ്", "ജൂൺ", "ജൂലൈ", "ഓഗസ്റ്റ്", "സെപ്തംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"];
  function formatBannerDate(d) {
    return ML_WEEKDAYS[d.getDay()] + ", " + d.getDate() + " " + ML_MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

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
    threads: settings.threads_url,
  };

  return (
    <header className="site-header">
      <div className="banner-wrap">
        <div className="banner-inner">
          <span className="banner-date">{formatBannerDate(currentTime)}</span>
          <img src={banner} alt="മലയാളമിത്രം" />
          <span className="banner-time">{currentTime.toLocaleTimeString("ml-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </div>
      </div>
      <div className="top-strip"><div className="container strip-inner"><div className="date-display"><span className="date-item">{getKollavarsham().formatted} കൊല്ലവർഷം</span><span className="date-sep">|</span><span className="date-item">{getHijriDate().formatted}</span></div><span>{tagline}</span></div></div>
      <div className="container masthead">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="മെനു തുറക്കുക"><Menu size={22} /></button>
        <div className="search-wrapper masthead-search" ref={searchRef}>
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <button type="submit" className="search-submit" aria-label="Search"><Search size={18} /></button>
            <input
              name="q"
              placeholder="വാർത്തകൾ തിരയുക"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
          </form>
          {showSuggestions && (
            <div className="search-suggestions">
              {suggestions.length > 0 ? (
                <>
                  <div className="suggestion-header">ഏറ്റവും പുതിയ വാർത്തകൾ</div>
                  {suggestions.map((article) => (
                    <button key={article.id} className="suggestion-item" onClick={() => handleSuggestionClick(article)}>
                      {article.image && <img src={article.image} alt="" className="suggestion-thumb" />}
                      <div className="suggestion-text">
                        <span className="suggestion-title">{article.title}</span>
                        {article.categoryMl && <span className="suggestion-cat">{article.categoryMl}</span>}
                      </div>
                    </button>
                  ))}
                  <button className="suggestion-footer" onClick={handleSearchSubmit}>
                    <Search size={14} /> "{searchQuery}" എല്ലാം കാണുക
                  </button>
                </>
              ) : searchQuery.trim().length >= 1 ? (
                <div className="suggestion-empty">ഫലങ്ങൾ ഒന്നുമില്ല</div>
              ) : (
                <>
                  <div className="suggestion-header">ട്രെൻഡിംഗ് തിരയലുകൾ</div>
                  {["കേരളം", "ഇന്ത്യ", "ഗൾഫ്", "സിനിമ", "ഫുട്ബോൾ", "ടെക്"].map((tag) => (
                    <button key={tag} className="suggestion-item trending" onClick={() => { setSearchQuery(tag); setShowSuggestions(true); }}>
                      <Search size={14} /> {tag}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <button className="brand" onClick={() => navigate("/")}>
          <img src={logo} alt="മലയാളമിത്രം" className="brand-logo-img" />
        </button>
        <div className="social-links" aria-label="Social links">
          <a href={social.facebook && social.facebook !== "#" ? social.facebook : "#"} target={social.facebook && social.facebook !== "#" ? "_blank" : undefined} rel={social.facebook && social.facebook !== "#" ? "noopener noreferrer" : undefined}><Facebook size={18} /></a>
          <a href={social.youtube && social.youtube !== "#" ? social.youtube : "#"} target={social.youtube && social.youtube !== "#" ? "_blank" : undefined} rel={social.youtube && social.youtube !== "#" ? "noopener noreferrer" : undefined}><Youtube size={19} /></a>
          <a href={social.twitter && social.twitter !== "#" ? social.twitter : "#"} target={social.twitter && social.twitter !== "#" ? "_blank" : undefined} rel={social.twitter && social.twitter !== "#" ? "noopener noreferrer" : undefined}><Twitter size={18} /></a>
          <a href={social.instagram && social.instagram !== "#" ? social.instagram : "#"} target={social.instagram && social.instagram !== "#" ? "_blank" : undefined} rel={social.instagram && social.instagram !== "#" ? "noopener noreferrer" : undefined}><Instagram size={18} /></a>
          <a href={social.whatsapp && social.whatsapp !== "#" ? social.whatsapp : "#"} target={social.whatsapp && social.whatsapp !== "#" ? "_blank" : undefined} rel={social.whatsapp && social.whatsapp !== "#" ? "noopener noreferrer" : undefined}><MessageCircle size={18} /></a>
          <a href={social.telegram && social.telegram !== "#" ? social.telegram : "#"} target={social.telegram && social.telegram !== "#" ? "_blank" : undefined} rel={social.telegram && social.telegram !== "#" ? "noopener noreferrer" : undefined}><Send size={18} /></a>
          <a href={social.linkedin && social.linkedin !== "#" ? social.linkedin : "#"} target={social.linkedin && social.linkedin !== "#" ? "_blank" : undefined} rel={social.linkedin && social.linkedin !== "#" ? "noopener noreferrer" : undefined}><Linkedin size={18} /></a>
          <a href={social.threads && social.threads !== "#" ? social.threads : "#"} target={social.threads && social.threads !== "#" ? "_blank" : undefined} rel={social.threads && social.threads !== "#" ? "noopener noreferrer" : undefined}><AtSign size={18} /></a>
        </div>
      </div>
      <nav className="main-nav"><div className="container nav-scroll">
        {navGroups.map((group) => (
          <div 
            className="nav-group" 
            key={group.slug}
            onMouseEnter={() => group.children?.length > 1 && setActiveDropdown(group.slug)}
            onMouseLeave={() => group.children?.length > 1 && setActiveDropdown(null)}
          >
            <button 
              className={activeSlug === group.slug || group.children?.some((child) => child.slug === activeSlug) ? "active" : ""} 
              onClick={() => {
                if (group.children?.length > 1) {
                  setActiveDropdown(activeDropdown === group.slug ? null : group.slug);
                } else if (group.children?.length === 1) {
                  navigate(openPath(group.children[0]));
                } else {
                  navigate(openPath(group));
                }
              }}
            >
              {group.label}{group.children?.length > 1 && <ChevronDown size={14} />}
            </button>
            {group.children?.length > 1 && activeDropdown === group.slug && (
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
        {navGroups.map((group) => <div className="drawer-group" key={group.slug}><button onClick={() => { if (!group.children?.length) { setMenuOpen(false); navigate(openPath(group)); } else if (group.children.length === 1) { setMenuOpen(false); navigate(openPath(group.children[0])); } }}>{group.label}</button>{group.children?.length > 1 && group.children.map((child) => <button className="drawer-child" key={child.slug} onClick={() => { setMenuOpen(false); navigate(openPath(child)); }}>{child.label}</button>)}</div>)}
      </div></div>}
    </header>
  );
}
