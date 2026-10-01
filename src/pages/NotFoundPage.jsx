import { AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";
import { useT } from "../context/LangContext.jsx";

export default function NotFoundPage({ navigate }) {
  const t = useT();
  return (
    <PageLayout navigate={navigate} sidebar={false} className="not-found-page">
      <div className="not-found">
        <AlertTriangle size={42} />
        <h1>{t("notfound.title")}</h1>
        <p>{t("notfound.message")}</p>
        <button type="button" onClick={() => navigate("/")}>{t("notfound.home")}</button>
      </div>
    </PageLayout>
  );
}
