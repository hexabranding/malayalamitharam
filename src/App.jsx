import { useMemo, useState, useEffect, Suspense, lazy } from "react";
import AOS from "aos";
import Layout from "./components/Layout.jsx";
import { articles, flatMenuItems as defaultFlatMenuItems } from "./data/news.js";
import { loadFlatMenuItems } from "./services/api.js";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const ArticlePage = lazy(() => import("./pages/ArticlePage.jsx"));
const SearchPage = lazy(() => import("./pages/SearchPage.jsx"));
const TagsPage = lazy(() => import("./pages/TagsPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const AuthorPage = lazy(() => import("./pages/AuthorPage.jsx"));
const MediaPage = lazy(() => import("./pages/MediaPage.jsx"));
const InfoPage = lazy(() => import("./pages/InfoPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const AdminLayout = lazy(() => import("./components/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AdminNewsPage = lazy(() => import("./pages/AdminNewsPage.jsx"));
const AdminNewsForm = lazy(() => import("./pages/AdminNewsForm.jsx"));
const AdminCategoriesPage = lazy(() => import("./pages/AdminCategoriesPage.jsx"));
const AdminTagsPage = lazy(() => import("./pages/AdminTagsPage.jsx"));
const AdminAuthorsPage = lazy(() => import("./pages/AdminAuthorsPage.jsx"));
const AdminPagesPage = lazy(() => import("./pages/AdminPagesPage.jsx"));
const AdminSettings = lazy(() => import("./pages/AdminSettings.jsx"));
const AdminAdsPage = lazy(() => import("./pages/AdminAdsPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage.jsx"));

const legacyRoutes = {
  "/home_v1.html": "/",
  "/home_v2.html": "/",
  "/home_v3.html": "/",
  "/home_v4.html": "/",
  "/category_v1.html": "/category/kerala",
  "/category_v2.html": "/category/india",
  "/category_v3.html": "/category/world",
  "/category_v4.html": "/category/business",
  "/photo_category.html": "/category/photos",
  "/video_category.html": "/category/videos",
  "/photo_signle_post.html": "/category/photos",
  "/video_signle_post.html": "/category/videos",
  "/single_post_standard_v1.html": "/post/rain-alert-kerala-coast",
  "/single_post_standard_v2.html": "/post/delhi-policy-meeting",
  "/single_post_video_v1.html": "/post/football-final-training",
  "/single_post_video_v2.html": "/post/football-final-training",
  "/single_post_audio_v1.html": "/category/audio",
  "/single_post_audio_v2.html": "/category/audio",
  "/single_post_slideshow_v1.html": "/category/photos",
  "/single_post_slideshow_v2.html": "/category/photos",
  "/search_page.html": "/search",
  "/tags_page.html": "/tags/കേരളം",
  "/author_page.html": "/author",
  "/contact.html": "/contact",
  "/page_404.html": "/404",
};

function normalizePath(path) {
  return legacyRoutes[path] || path || "/";
}

function getInitialPath() {
  const hash = window.location.hash.replace("#", "");
  if (hash) return normalizePath(hash);
  const p = window.location.pathname.replace(/\/$/, "") || "/";
  return normalizePath(p);
}

function useRoute() {
  const [path, setPath] = useState(getInitialPath());
  const navigate = (nextPath) => {
    const normalized = normalizePath(nextPath);
    window.location.hash = normalized;
    setPath(normalized);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return { path, navigate };
}

export default function App() {
  const { path, navigate } = useRoute();
  const activeSlug = path.startsWith("/category/") ? path.replace("/category/", "") : "home";
  const isAdmin = path.startsWith("/admin");

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out",
      once: true,
      offset: 60,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [path]);

  // Auth state — check sessionStorage on mount
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("mm_admin");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Dynamic menu items from API
  const [dynamicFlatItems, setDynamicFlatItems] = useState(defaultFlatMenuItems);
  useEffect(() => {
    loadFlatMenuItems().then(setDynamicFlatItems).catch(() => {});
    function refresh() {
      loadFlatMenuItems().then(setDynamicFlatItems).catch(() => {});
    }
    window.addEventListener("mm-data-updated", refresh);
    return () => window.removeEventListener("mm-data-updated", refresh);
  }, []);

  function handleLogin(user) {
    setAdminUser(user);
    navigate("/admin");
  }

  function handleLogout() {
    sessionStorage.removeItem("mm_admin");
    setAdminUser(null);
    navigate("/admin");
  }

  const page = useMemo(() => {
    // Admin routes — show login if not authenticated
    if (path.startsWith("/admin")) {
      if (!adminUser) {
        return <AdminLoginPage onLogin={handleLogin} />;
      }

      const adminLayoutProps = {
        navigate,
        user: adminUser,
        onLogout: handleLogout,
      };

      if (path === "/admin") return (
        <AdminLayout currentPage="dashboard" {...adminLayoutProps}>
          <AdminDashboard navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/news") return (
        <AdminLayout currentPage="news" {...adminLayoutProps}>
          <AdminNewsPage navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/news/new") return (
        <AdminLayout currentPage="news" {...adminLayoutProps}>
          <AdminNewsForm navigate={navigate} />
        </AdminLayout>
      );
      if (path.startsWith("/admin/news/edit/")) {
        const newsId = path.replace("/admin/news/edit/", "");
        return (
          <AdminLayout currentPage="news" {...adminLayoutProps}>
            <AdminNewsForm navigate={navigate} newsId={newsId} />
          </AdminLayout>
        );
      }
      if (path === "/admin/categories") return (
        <AdminLayout currentPage="categories" {...adminLayoutProps}>
          <AdminCategoriesPage navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/tags") return (
        <AdminLayout currentPage="tags" {...adminLayoutProps}>
          <AdminTagsPage navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/authors") return (
        <AdminLayout currentPage="authors" {...adminLayoutProps}>
          <AdminAuthorsPage navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/pages") return (
        <AdminLayout currentPage="pages" {...adminLayoutProps}>
          <AdminPagesPage navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/settings") return (
        <AdminLayout currentPage="settings" {...adminLayoutProps}>
          <AdminSettings navigate={navigate} />
        </AdminLayout>
      );
      if (path === "/admin/ads") return (
        <AdminLayout currentPage="ads" {...adminLayoutProps}>
          <AdminAdsPage navigate={navigate} />
        </AdminLayout>
      );

      return <AdminLoginPage onLogin={handleLogin} />;
    }

    // Public routes
    if (path === "/" || path === "") return <HomePage navigate={navigate} />;
    if (path === "/login") return <AdminLoginPage onLogin={handleLogin} />;
    if (path.startsWith("/category/")) {
      const slug = path.replace("/category/", "");
      const item = dynamicFlatItems.find((entry) => entry.slug === slug) || { label: slug, slug, titleMl: slug };
      if (item.mediaType) return <MediaPage type={item.mediaType} title={item.titleMl} navigate={navigate} />;
      return <CategoryPage categoryItem={item} navigate={navigate} />;
    }
    if (path.startsWith("/post/")) return <ArticlePage slug={path.replace("/post/", "")} navigate={navigate} />;
    if (path.startsWith("/search")) return <SearchPage path={path} navigate={navigate} />;
    if (path.startsWith("/tags/")) return <TagsPage tag={decodeURIComponent(path.replace("/tags/", ""))} navigate={navigate} />;
    if (path === "/contact") return <ContactPage navigate={navigate} />;
    if (path === "/author") return <AuthorPage navigate={navigate} />;
    if (path === "/404") return <NotFoundPage navigate={navigate} />;
    if (path.startsWith("/page/")) return <InfoPage title={decodeURIComponent(path.replace("/page/", ""))} navigate={navigate} />;
    return <NotFoundPage navigate={navigate} />;
  }, [path, adminUser, dynamicFlatItems]);

  if (isAdmin) {
    return <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><div>Loading...</div></div>}>{page}</Suspense>;
  }

  return <Layout navigate={navigate} activeSlug={activeSlug}><Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}><div>Loading...</div></div>}>{page}</Suspense></Layout>;
}
