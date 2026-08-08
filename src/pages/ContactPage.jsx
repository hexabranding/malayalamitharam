import { Mail, Phone, MapPin, Globe } from "lucide-react";
import PageLayout from "../components/PageLayout.jsx";

export default function ContactPage({ navigate }) {
  return (
    <PageLayout navigate={navigate} sidebar={false}>
      <div className="page-title" data-aos="fade-up">
        <span>ബന്ധപ്പെടുക</span>
        <h1>മലയാളമിത്രം ന്യൂസ് റൂം (Contact Us)</h1>
      </div>

      <div className="contact-layout">
        <div className="contact-form-container" data-aos="fade-up" data-aos-delay="100">
          <h2>സന്ദേശം അയക്കൂ</h2>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="പേര്" required />
            <input type="email" placeholder="ഇമെയിൽ വിലാസം" required />
            <input type="text" placeholder="വിഷയം" required />
            <textarea placeholder="നിങ്ങളുടെ സന്ദേശം ഇവിടെ എഴുതുക..." rows="6" required></textarea>
            <button type="submit" data-aos="zoom-in" data-aos-delay="300">സന്ദേശം അയയ്ക്കുക</button>
          </form>
        </div>

        <div className="contact-details-container" data-aos="fade-up" data-aos-delay="200">
          <h2>ഞങ്ങളുടെ ഓഫിസ്</h2>
          <p>മലയാളമിത്രം വാർത്താ കവാടത്തെക്കുറിച്ചുള്ള നിങ്ങളുടെ അഭിപ്രായങ്ങളും വിവരങ്ങളും ഞങ്ങളുമായി പങ്കുവെക്കാം.</p>

          <div className="details-list">
            <div className="details-item">
              <MapPin size={20} className="icon" />
              <div>
                <strong>ഓഫീസ് വിലാസം:</strong>
                <p>Reg.No.MSME UDYAM-KL-02-0015921 14/291 K, Suite 15P, Edathala PO, Edappally Pukkattupady road, Cochin-683561, Kerala, India </p>
              </div>
            </div>

            <div className="details-item">
              <Phone size={20} className="icon" />
              <div>
                <strong>ഫോൺ നമ്പർ:</strong>
                <p>+91 8139800525</p>
              </div>
            </div>

            <div className="details-item">
              <Mail size={20} className="icon" />
              <div>
                <strong>ഇമെയിൽ വിലാസം:</strong>
                <p>news@malayalamitra.com, editor@malayalamitra.com</p>
              </div>
            </div>

            <div className="details-item">
              <Globe size={20} className="icon" />
              <div>
                <strong>വെബ്‌സൈറ്റ്:</strong>
                <p>www.malayalamitra.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
