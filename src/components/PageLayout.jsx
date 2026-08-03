import Sidebar from "./Sidebar.jsx";

export default function PageLayout({ children, navigate, sidebar = true, className = "", fullWidthHeader = null, sidebarArticles = [] }) {
  const classes = ["page-main", "container", sidebar ? "content-grid" : "page-single", className].filter(Boolean).join(" ");

  return (
    <main className={classes}>
      {fullWidthHeader ? <div className="page-wide-header">{fullWidthHeader}</div> : null}
      <div className="feed">{children}</div>
      {sidebar ? <Sidebar navigate={navigate} articles={sidebarArticles} /> : null}
    </main>
  );
}
