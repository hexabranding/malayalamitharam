import Sidebar from "./Sidebar.jsx";

export default function PageLayout({ children, navigate, sidebar = true, className = "" }) {
  const classes = ["page-main", "container", sidebar ? "content-grid" : "page-single", className].filter(Boolean).join(" ");

  return (
    <main className={classes}>
      <div className="feed">{children}</div>
      {sidebar ? <Sidebar navigate={navigate} /> : null}
    </main>
  );
}
