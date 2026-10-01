import AdSlot from "../components/AdSlot.jsx";
import PageLayout from "../components/PageLayout.jsx";
import { useT } from "../context/LangContext.jsx";

export default function InfoPage({ title, navigate }) {
  const t = useT();
  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>{t("info.page")}</span>
        <h1>{title}</h1>
      </div>
      <AdSlot slot="page" label={t("info.adLabel")} />
      <section className="article-detail" data-aos="fade-up">
        <p className="lead">{t("info.lead")}</p>
        <p>{t("info.body")}</p>
      </section>
    </PageLayout>
  );
}
