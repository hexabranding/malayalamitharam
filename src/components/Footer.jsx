import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, Twitter, Youtube } from "lucide-react";
import { useMemo } from "react";
import { useSettings, useMenuGroups } from "../context/DataContext.jsx";

export default function Footer({ navigate }) {
  const settings = useSettings();
  const menuGroups = useMenuGroups();
  const categories = useMemo(() => {
    return menuGroups.flatMap((group) => group.children || []).slice(0, 8);
  }, [menuGroups]);

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
    <footer className="site-footer" data-aos="fade-up">
      <div className="container footer-grid">
        
        {/* About & Branding Column */}
        <div className="footer-col about">
          <button className="footer-brand-logo" type="button" onClick={() => navigate("/")}>
            <img src="/images/malayalamithram-logo.png" alt="Malayalamithram Logo" />
          </button>
          <p>മലയാളം വായനക്കാർക്കായി ഏറ്റവും പുതിയ വാർത്തകൾ, വിശകലനങ്ങൾ, തത്സമയ വിവരങ്ങൾ, ഫോട്ടോകൾ, വീഡിയോകൾ എന്നിവ വേഗതയിലും കൃത്യതയിലും ലഭ്യമാക്കുന്നു.</p>
          <div className="footer-socials">
            {social.facebook && social.facebook !== "#" && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={18} /></a>}
            {social.twitter && social.twitter !== "#" && <a href={social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter size={18} /></a>}
            {social.youtube && social.youtube !== "#" && <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="Youtube"><Youtube size={18} /></a>}
            {social.instagram && social.instagram !== "#" && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
            {social.whatsapp && social.whatsapp !== "#" && <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>}
            {social.telegram && social.telegram !== "#" && <a href={social.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram"><Send size={18} /></a>}
            {social.linkedin && social.linkedin !== "#" && <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>}
            {social.threads && social.threads !== "#" && <a href={social.threads} target="_blank" rel="noopener noreferrer" aria-label="Threads"><AtSign size={18} /></a>}
          </div>
        </div>

        {/* Newsletter Signup Column */}
        <div className="footer-col newsletter-col">
          <h2>വാർത്താ പത്രിക</h2>
          <p>പ്രധാന വാർത്തകൾ തത്സമയം നിങ്ങളുടെ ഇമെയിലിൽ ലഭിക്കുന്നതിനായി സബ്‌സ്‌ക്രൈബ് ചെയ്യുക.</p>
          <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="ഇമെയിൽ വിലാസം" required />
            <button type="submit" aria-label="അയക്കുക">
              <Send size={16} />
            </button>
          </form>
          <div className="footer-qr">
            <img src="/images/mmwebsite-qr.png" alt="QR Code" />
          </div>
        </div>

        {/* Categories Column */}
        <div className="footer-col links">
          <h2>വാർത്തകൾ</h2>
          <div className="links-list">
            {categories.map((item) => (
              <button key={item.slug} onClick={() => navigate(item.path || "/category/" + item.slug)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col links">
          <h2>ലിങ്കുകൾ</h2>
          <div className="links-list">
            <button onClick={() => navigate("/")}>ഹോം പേജ്</button>
            <button onClick={() => navigate("/search")}>വാർത്തകൾ തിരയുക</button>
            <button onClick={() => navigate("/tags/കേരളം")}>പ്രധാന ടാഗുകൾ</button>
            <button onClick={() => navigate("/author")}>ലേഖകർ</button>
            <button onClick={() => navigate("/contact")}>ഞങ്ങളെ ബന്ധപ്പെടുക</button>
          </div>
        </div>

      </div>
      <div className="copyright">
        <div className="container copyright-inner">
          <span>© 2026 Malayala Mitra. All Rights Reserved.</span>
          <span>നിർമ്മാണം: മലയാളമിത്രം ഡിജിറ്റൽ ടീം</span>
        </div>
      </div>
    </footer>
  );
}
