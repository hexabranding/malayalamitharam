import { LayoutDashboard, Newspaper, FolderOpen, Tags, Users, Settings, LogOut, Home, Plus, Megaphone } from "lucide-react";

export default function AdminLayout({ children, currentPage, navigate, user, onLogout }) {
  const adminMenu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { id: "news", label: "News Management", icon: Newspaper, path: "/admin/news" },
    { id: "categories", label: "Categories", icon: FolderOpen, path: "/admin/categories" },
    { id: "tags", label: "Tags", icon: Tags, path: "/admin/tags" },
    { id: "authors", label: "Authors", icon: Users, path: "/admin/authors" },
    { id: "ads", label: "Advertisements", icon: Megaphone, path: "/admin/ads" },
    { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const currentItem = adminMenu.find(m => m.id === currentPage);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-brand">
          <img
            src="/images/malayalamithram-logo.png"
            alt="Malayalamithram"
            className="admin-brand-logo"
          />
          <div>
            <strong>Malayalamithram</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="admin-user-info">
            <div className="admin-user-avatar">{(user.name || user.username || "A")[0].toUpperCase()}</div>
            <div>
              <span className="admin-user-name">{user.name || user.username}</span>
              <span className="admin-user-role">Administrator</span>
            </div>
          </div>
        )}

        <nav className="admin-nav">
          {adminMenu.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={() => navigate("/")}>
            <Home size={20} />
            <span>View Site</span>
          </button>
          <button className="admin-nav-item logout" onClick={onLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <span className="admin-breadcrumb">Admin</span>
            <span className="admin-breadcrumb-sep">›</span>
            <h1>{currentItem?.label || "Admin"}</h1>
          </div>
          <div className="admin-header-actions">
            {currentPage === "news" && (
              <button className="admin-btn primary" onClick={() => navigate("/admin/news/new")}>
                <Plus size={18} />
                Add News
              </button>
            )}
            {currentPage === "ads" && (
              <span className="admin-header-hint">Ad images will show on all user site pages</span>
            )}
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
