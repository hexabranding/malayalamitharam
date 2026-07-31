import { useState } from "react";
import { Eye, EyeOff, Lock, User, LogIn } from "lucide-react";
import { login } from "../services/api.js";

export default function AdminLoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(username, password);
      sessionStorage.setItem(
        "mm_admin",
        JSON.stringify({ ...data.user, token: data.token, loginAt: Date.now() })
      );
      onLogin(data.user);
    } catch (err) {
      if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed") || err.message.includes("NetworkError")) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError(err.message || "Invalid username or password");
      }
    }
    setLoading(false);
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Logo */}
        <div className="admin-login-logo">
          <img
            src="/images/malayalamithram-logo.png"
            alt="Malayalamithram Logo"
            className="admin-login-logo-img"
          />
        </div>

        <h1 className="admin-login-title">Admin Panel</h1>
        <p className="admin-login-subtitle">Malayalamithram Admin Portal</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="admin-login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="admin-login-field">
            <label htmlFor="username">Username</label>
            <div className="admin-login-input-wrap">
              <User size={18} className="admin-login-icon" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="password">Password</label>
            <div className="admin-login-input-wrap">
              <Lock size={18} className="admin-login-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-login-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="admin-login-spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="admin-login-hint">
          <Lock size={12} />
          &nbsp;Secured access — Malayalamithram staff only
        </div>
      </div>
    </div>
  );
}
