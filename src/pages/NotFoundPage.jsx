import { AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";

export default function NotFoundPage({ navigate }) {
  return (
    <PageLayout navigate={navigate} sidebar={false} className="not-found-page">
      <div className="not-found">
        <AlertTriangle size={42} />
        <h1>പേജ് കണ്ടെത്താനായില്ല</h1>
        <p>താങ്കൾ അന്വേഷിച്ച വാർത്ത ലഭ്യമല്ല. പ്രധാന പേജിലേക്ക് മടങ്ങാം.</p>
        <button type="button" onClick={() => navigate("/")}>ഹോം പേജ്</button>
      </div>
    </PageLayout>
  );
}
