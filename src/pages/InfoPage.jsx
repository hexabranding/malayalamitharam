import AdSlot from "../components/AdSlot.jsx";
import PageLayout from "../components/PageLayout.jsx";

export default function InfoPage({ title, navigate }) {
  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>പേജ്</span>
        <h1>{title}</h1>
      </div>
      <AdSlot slot="page" label="Page Ad" />
      <section className="article-detail" data-aos="fade-up">
        <p className="lead">ഈ വിഭാഗം മലയാളമിത്രത്തിന്റെ React പേജ് ഘടനയിൽ തയ്യാറാക്കിയതാണ്.</p>
        <p>പഴയ HTML ടെംപ്ലേറ്റിലെ ഓരോ വിഭാഗവും ഇപ്പോൾ React page/component രീതിയിൽ വേർതിരിച്ചിരിക്കുന്നു. പിന്നീട് MERN API ഡാറ്റ ചേർത്താൽ ഈ പേജ് നേരിട്ട് ഡൈനാമിക് ആയി പ്രവർത്തിക്കും.</p>
      </section>
    </PageLayout>
  );
}
