import { useState } from "react";
import { login } from "../services/api.js";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useT } from "../context/LangContext.jsx";

export default function LoginPage({ onLoginSuccess }) {
  const t = useT();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError(t("login.errorRequired"));
      return;
    }
    setLoading(true);
    try {
      const data = await login(username, password);
      sessionStorage.setItem("mm_admin", JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed") || err.message.includes("NetworkError")) {
        setError(t("login.errorNetwork"));
      } else {
        setError(err.message || t("login.errorFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img
            src="/images/malayalamithram-logo.png"
            alt={t("login.logoAlt")}
            className="admin-login-logo-img"
          />
        </div>

        <h1 className="admin-login-title">{t("login.title")}</h1>
        <p className="admin-login-subtitle">{t("login.subtitle")}</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-login-field">
            <label>{t("login.usernameLabel")}</label>
            <div className="admin-login-input-wrap">
              <Mail size={18} className="admin-login-icon" />
              <input
                type="text"
                placeholder={t("login.usernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label>{t("login.passwordLabel")}</label>
            <div className="admin-login-input-wrap">
              <Lock size={18} className="admin-login-icon" />
              <input
                type={showPw ? "text" : "password"}
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="admin-login-eye"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="admin-login-btn" type="submit" disabled={loading}>
            {loading ? <div className="admin-login-spinner" /> : <LogIn size={20} />}
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <div className="admin-login-hint">
          <a href="/" style={{ color: "#0d4228", fontWeight: 600, textDecoration: "none" }}>
            &larr; {t("login.back")}
          </a>
        </div>
      </div>
    </div>
  );
}
