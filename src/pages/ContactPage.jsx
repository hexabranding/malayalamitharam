import { Mail, Phone, MapPin, Globe } from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";
import { useT } from "../context/LangContext.jsx";

export default function ContactPage({ navigate }) {
  const t = useT();
  return (
    <PageLayout navigate={navigate} sidebar={false}>
      <div className="page-title" data-aos="fade-up">
        <span>{t("contact.title")}</span>
        <h1>{t("contact.heading")}</h1>
      </div>

      <div className="contact-layout">
        <div className="contact-form-container" data-aos="fade-up" data-aos-delay="100">
          <h2>{t("contact.formTitle")}</h2>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder={t("contact.namePlaceholder")} required />
            <input type="email" placeholder={t("contact.emailPlaceholder")} required />
            <input type="text" placeholder={t("contact.subjectPlaceholder")} required />
            <textarea placeholder={t("contact.messagePlaceholder")} rows="6" required></textarea>
            <button type="submit" data-aos="zoom-in" data-aos-delay="300">{t("contact.submit")}</button>
          </form>
        </div>

        <div className="contact-details-container" data-aos="fade-up" data-aos-delay="200">
          <h2>{t("contact.officeTitle")}</h2>
          <p>{t("contact.intro")}</p>

          <div className="details-list">
            <div className="details-item">
              <MapPin size={20} className="icon" />
              <div>
                <strong>{t("contact.addressLabel")}</strong>
                <p>Reg.No.MSME UDYAM-KL-02-0015921 14/291 K, Suite 15P, Edathala PO, Edappally Pukkattupady road, Cochin-683561, Kerala, India  </p>
              </div>
            </div>

            <div className="details-item">
              <Phone size={20} className="icon" />
              <div>
                <strong>{t("contact.phoneLabel")}</strong>
                <p>+91 8139800525</p>
              </div>
            </div>

            <div className="details-item">
              <Mail size={20} className="icon" />
              <div>
                <strong>{t("contact.emailLabel")}</strong>
                <p>news@malayalamitra.com, editor@malayalamitra.com</p>
              </div>
            </div>

            <div className="details-item">
              <Globe size={20} className="icon" />
              <div>
                <strong>{t("contact.websiteLabel")}</strong>
                <p>www.malayalamitram.in</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
