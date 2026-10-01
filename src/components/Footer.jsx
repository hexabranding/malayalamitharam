import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, Youtube } from "lucide-react";
import { useMemo } from "react";
import { useSettings, useMenuGroups } from "../context/DataContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";
import { useT } from "../context/LangContext.jsx";

function XLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer({ navigate }) {
  const settings = useSettings();
  const menuGroups = useMenuGroups();
  const t = useT();
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

  const quickLinks = [
    { label: t("footer.home"), path: "/" },
    { label: t("footer.searchNews"), path: "/search" },
    { label: t("footer.topTags"), path: "/tags/കേരളം" },
    { label: t("footer.writers"), path: "/author" },
    { label: t("footer.contactUs"), path: "/contact" },
  ];

  return (
    <footer className="site-footer" data-aos="fade-up">
      <div className="container footer-grid">

        {/* About & Branding Column */}
        <div className="footer-col about">
          <button className="footer-brand-logo" type="button" onClick={() => navigate("/")}>
            <img src={logo} alt={t("footer.logoAlt")} />
          </button>
          <p>{t("footer.tagline")}</p>
          <div className="footer-socials">
            <a href={social.facebook && social.facebook !== "#" ? social.facebook : "#"} target={social.facebook && social.facebook !== "#" ? "_blank" : undefined} rel={social.facebook && social.facebook !== "#" ? "noopener noreferrer" : undefined} aria-label="Facebook"><Facebook size={18} /></a>
            <a href={social.twitter && social.twitter !== "#" ? social.twitter : "#"} target={social.twitter && social.twitter !== "#" ? "_blank" : undefined} rel={social.twitter && social.twitter !== "#" ? "noopener noreferrer" : undefined} aria-label="X"><XLogo size={18} /></a>
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
          <h2>{t("footer.newsletterTitle")}</h2>
          <p>{t("footer.newsletterDesc")}</p>
          <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder={t("footer.emailPlaceholder")} required />
            <button type="submit" aria-label={t("footer.send")}>
              <Send size={16} />
            </button>
          </form>
          <div className="footer-qr">
            <img src="/images/mmwebsite-qr.png" alt="QR Code" />
          </div>
        </div>

        {/* Categories Column */}
        <div className="footer-col links">
          <h2>{t("footer.newsHeading")}</h2>
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
          <h2>{t("footer.linksHeading")}</h2>
          <div className="links-list">
            {quickLinks.map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)}>{item.label}</button>
            ))}
          </div>
        </div>

      </div>
      <div className="copyright">
        <div className="container copyright-inner">
          <span>{t("footer.rights")}</span>
          <span>{t("footer.credit")}</span>
        </div>
      </div>
    </footer>
  );
}
