import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, Youtube } from "lucide-react";
import { useMemo } from "react";
import { useSettings, useMenuGroups } from "../context/DataContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

function XIcon({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer({ navigate }) {
  const settings = useSettings();
  const menuGroups = useMenuGroups();
  const logo = resolveImageUrl(settings.footer_logo) || "/images/footer%20logo.png";
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
            <img src={logo} alt="Malayalamithram Logo" />
          </button>
          <p>മലയാളം വായനക്കാർക്കായി ഏറ്റവും പുതിയ വാർത്തകൾ, വിശകലനങ്ങൾ, തത്സമയ വിവരങ്ങൾ, ഫോട്ടോകൾ, വീഡിയോകൾ എന്നിവ വേഗതയിലും കൃത്യതയിലും ലഭ്യമാക്കുന്നു.</p>
          <div className="footer-socials">
            <a href={social.facebook && social.facebook !== "#" ? social.facebook : "#"} target={social.facebook && social.facebook !== "#" ? "_blank" : undefined} rel={social.facebook && social.facebook !== "#" ? "noopener noreferrer" : undefined} aria-label="Facebook"><Facebook size={18} /></a>
            <a href={social.twitter && social.twitter !== "#" ? social.twitter : "#"} target={social.twitter && social.twitter !== "#" ? "_blank" : undefined} rel={social.twitter && social.twitter !== "#" ? "noopener noreferrer" : undefined} aria-label="X"><XIcon size={18} /></a>
            <a href={social.youtube && social.youtube !== "#" ? social.youtube : "#"} target={social.youtube && social.youtube !== "#" ? "_blank" : undefined} rel={social.youtube && social.youtube !== "#" ? "noopener noreferrer" : undefined} aria-label="Youtube"><Youtube size={18} /></a>
            <a href={social.instagram && social.instagram !== "#" ? social.instagram : "#"} target={social.instagram && social.instagram !== "#" ? "_blank" : undefined} rel={social.instagram && social.instagram !== "#" ? "noopener noreferrer" : undefined} aria-label="Instagram"><Instagram size={18} /></a>
            <a href={social.whatsapp && social.whatsapp !== "#" ? social.whatsapp : "#"} target={social.whatsapp && social.whatsapp !== "#" ? "_blank" : undefined} rel={social.whatsapp && social.whatsapp !== "#" ? "noopener noreferrer" : undefined} aria-label="WhatsApp"><MessageCircle size={18} /></a>
            <a href={social.telegram && social.telegram !== "#" ? social.telegram : "#"} target={social.telegram && social.telegram !== "#" ? "_blank" : undefined} rel={social.telegram && social.telegram !== "#" ? "noopener noreferrer" : undefined} aria-label="Telegram"><Send size={18} /></a>
            <a href={social.linkedin && social.linkedin !== "#" ? social.linkedin : "#"} target={social.linkedin && social.linkedin !== "#" ? "_blank" : undefined} rel={social.linkedin && social.linkedin !== "#" ? "noopener noreferrer" : undefined} aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href={social.threads && social.threads !== "#" ? social.threads : "#"} target={social.threads && social.threads !== "#" ? "_blank" : undefined} rel={social.threads && social.threads !== "#" ? "noopener noreferrer" : undefined} aria-label="Threads"><AtSign size={18} /></a>
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
          <span>© 2026 Malayalamithram. All Rights Reserved.</span>
          <span>നിർമ്മാണം: മലയാളമിത്രം ഡിജിറ്റൽ ടീം</span>
        </div>
      </div>
    </footer>
  );
}
