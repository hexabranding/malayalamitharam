import Sidebar from "./Sidebar.jsx";

export default function PageLayout({ children, navigate, sidebar = true, className = "", fullWidthHeader = null }) {
  const classes = ["page-main", "container", sidebar ? "content-grid" : "page-single", className].filter(Boolean).join(" ");

  return (
    <main className={classes}>
      {fullWidthHeader ? <div className="page-wide-header">{fullWidthHeader}</div> : null}
      <div className="feed">{children}</div>
      {sidebar ? <Sidebar navigate={navigate} /> : null}
    </main>
  );
}
