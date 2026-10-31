import { useState, useEffect } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";
import { useLang } from "../context/LangContext.jsx";

export default function SubscribeNotification() {
  const { lang, dir } = useLang();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem("mm_sub_done") === "true") {
        return;
      }
    } catch (_) {}

    // Show notification shortly after site opens
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  function handleSubscribe() {
    // Request native browser permission if supported
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      } catch (_) {}
    }

    setSubscribed(true);
    try {
      localStorage.setItem("mm_subscribed", "true");
      sessionStorage.setItem("mm_sub_done", "true");
    } catch (_) {}

    // "Gone message": show success confirmation, then smoothly animate out
    setTimeout(() => {
      setClosing(true);
      setTimeout(() => {
        setVisible(false);
      }, 400);
    }, 2000);
  }

  function handleDismiss() {
    setClosing(true);
    try {
      sessionStorage.setItem("mm_sub_done", "true");
    } catch (_) {}
    setTimeout(() => {
      setVisible(false);
    }, 400);
  }

  if (!visible) return null;

  const content = {
    ml: {
      title: "വാർത്താ അപ്‌ഡേറ്റുകൾ സബ്‌സ്‌ക്രൈബ് ചെയ്യൂ",
      desc: "ഏറ്റവും പുതിയ ബ്രേക്കിംഗ് വാർത്തകളും അറിയിപ്പുകളും തത്സമയം അറിയാം.",
      btnSubscribe: "സബ്‌സ്‌ക്രൈബ് ചെയ്യുക",
      btnLater: "പിന്നീട്",
      successTitle: "സബ്‌സ്‌ക്രൈബ് ചെയ്തു!",
      successDesc: "നന്ദി! ഏറ്റവും പുതിയ വാർത്തകൾ ഇനി നിങ്ങൾക്ക് ലഭിക്കും.",
    },
    en: {
      title: "Subscribe to News Alerts",
      desc: "Get breaking news and real-time updates directly on your device.",
      btnSubscribe: "Subscribe",
      btnLater: "Not Now",
      successTitle: "Subscribed Successfully!",
      successDesc: "Thank you! You will now receive the latest news alerts.",
    },
    ar: {
      title: "اشترك للحصول على آخر الأخبار",
      desc: "احصل على آخر الأخبار العاجلة والتحديثات المباشرة فور حدوثها.",
      btnSubscribe: "اشتراك",
      btnLater: "لاحقاً",
      successTitle: "تم الاشتراك بنجاح!",
      successDesc: "شكراً لك! ستتلقى أهم الأخبار العاجلة فوراً.",
    },
  };

  const t = content[lang] || content.ml;

  return (
    <div
      className={`subscribe-notify-card ${closing ? "sub-closing" : ""} ${dir === "rtl" ? "sub-rtl" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <button
        type="button"
        className="sub-close-btn"
        onClick={handleDismiss}
        aria-label="Close"
      >
        <X size={16} />
      </button>

      {subscribed ? (
        <div className="sub-success-content">
          <div className="sub-success-icon-wrap">
            <CheckCircle2 size={32} className="sub-success-icon" />
          </div>
          <div className="sub-text-wrap">
            <h4 className="sub-title">{t.successTitle}</h4>
            <p className="sub-desc">{t.successDesc}</p>
          </div>
        </div>
      ) : (
        <div className="sub-prompt-content">
          <div className="sub-header-row">
            <div className="sub-bell-wrap">
              <Bell size={20} className="sub-bell-icon" />
            </div>
            <div className="sub-text-wrap">
              <h4 className="sub-title">{t.title}</h4>
              <p className="sub-desc">{t.desc}</p>
            </div>
          </div>
          <div className="sub-actions-row">
            <button
              type="button"
              className="sub-btn-primary"
              onClick={handleSubscribe}
            >
              {t.btnSubscribe}
            </button>
            <button
              type="button"
              className="sub-btn-secondary"
              onClick={handleDismiss}
            >
              {t.btnLater}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

