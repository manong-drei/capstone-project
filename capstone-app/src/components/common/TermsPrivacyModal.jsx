import { useState, useRef, useEffect } from "react";

const LANGUAGES = { en: "English", fil: "Pilipino", hil: "Hiligaynon" };
const TRANSLATIONS = {
  en: {
    title: "Terms, Privacy & Consent",
    close: "Close",
    cancel: "Cancel",
    notice: "Please scroll through and read all sections before accepting.",
    reviewed: "All sections reviewed. You may now accept.",
    scroll: "Scroll to the bottom to continue",
    accept: "Accept & Continue",
    read: "Read all sections to continue",
    consent:
      "I have read and fully understood the Terms and Conditions, Privacy Policy, and Data Privacy Consent. I voluntarily give my consent to the collection and processing of my personal data by the Bago City Primary Care Facility in accordance with Republic Act No. 10173 (Data Privacy Act of 2012).",
  },
  fil: {
    title: "Mga Tuntunin, Pagkapribado at Pahintulot",
    close: "Isara",
    cancel: "Kanselahin",
    notice:
      "Pakibasa ang lahat ng seksiyon at mag-scroll hanggang sa ibaba bago tanggapin.",
    reviewed:
      "Nabasa na ang lahat ng seksiyon. Maaari ka nang magbigay ng pahintulot.",
    scroll: "Mag-scroll hanggang sa ibaba upang magpatuloy",
    accept: "Tanggapin at Magpatuloy",
    read: "Basahin ang lahat ng seksiyon upang magpatuloy",
    consent:
      "Nabasa ko at lubos kong naunawaan ang Mga Tuntunin at Kondisyon, Patakaran sa Pagkapribado, at Pahintulot sa Pagproseso ng Datos. Kusang-loob akong pumapayag sa pangongolekta at pagproseso ng aking personal na datos ng Bago City Primary Care Facility alinsunod sa Republic Act No. 10173 (Data Privacy Act of 2012).",
    sections: [
      {
        title: "Mga Tuntunin at Kondisyon",
        paragraphs: [
          "Sa pagpaparehistro at paggamit ng E-Kalusugan, sumasang-ayon ka sa mga Tuntuning ito. Pinangangasiwaan ng Bago City Primary Care Facility ang sistema upang mapadali ang pag-iskedyul ng mga appointment at pamamahala ng pila para sa mga residente.",
          "Dapat kang magbigay ng tamang impormasyon, panatilihing lihim ang iyong mga detalye sa pag-login, at gamitin ang sistema para lamang sa lehitimong mga appointment sa serbisyong pangkalusugan. Hindi ka dapat magsumite ng huwad o dobleng appointment, mag-access ng datos ng ibang gumagamit, o manghimasok sa pagpapatakbo ng sistema.",
          "Ang E-Kalusugan ay kasangkapan lamang sa pag-iskedyul — hindi ito nagbibigay ng medikal na payo o serbisyong pang-emerhensiya. Maaaring baguhin o pansamantalang ihinto ng Health Center ang sistema anumang oras. Ang mga paglabag ay maaaring magresulta sa pag-deactivate ng account.",
        ],
      },
      {
        title: "Patakaran sa Pagkapribado",
        paragraphs: [
          "Kinokolekta ng E-Kalusugan ang iyong personal na impormasyon (pangalan, petsa ng kapanganakan, kasarian, mga detalye sa pakikipag-ugnayan, email, at mga tala ng serbisyong pangkalusugan) upang mapadali ang mga appointment at pamamahala ng pila, alinsunod sa Data Privacy Act of 2012 (RA 10173).",
          "Ibinabahagi lamang ang iyong datos sa awtorisadong kawani ng health center, mga tagapangasiwa ng sistema, at mga awtoridad sa kalusugan ng pamahalaan kapag hinihingi ng batas. Hindi namin kailanman ibebenta o ibabahagi ang iyong datos sa mga komersiyal na ikatlong partido.",
          "Pinananatili ang mga tala ng kalusugan nang hindi bababa sa 10 taon alinsunod sa mga regulasyon sa Pilipinas. Naka-encrypt ang mga password (bcrypt), ipinapadala ang datos sa pamamagitan ng HTTPS, at limitado ang pag-access sa mga may pangangailangang malaman ito. Kung magkaroon ng paglabag sa seguridad ng datos, aabisuhan ang mga apektadong indibidwal at ang NPC sa loob ng 72 oras.",
        ],
      },
      {
        title: "Pahintulot sa Pagproseso ng Datos",
        paragraphs: [
          "Ang iyong pahintulot sa ilalim ng RA 10173 ay kusang-loob, tiyak, may sapat na kaalaman, at malinaw. Sa pagtanggap, pinahihintulutan mo ang Bago City Primary Care Facility na kolektahin at iproseso ang iyong personal at pangkalusugang datos para sa pag-iskedyul ng mga appointment, pamamahala ng pila, pagsusuri ng datos sa kalusugan na hindi nagpapakilala sa iyo, mga komunikasyon tungkol sa serbisyo, at pag-archive ng mga tala.",
          "Sa ilalim ng Seksyon 16 ng RA 10173, may karapatan kang mabigyan ng impormasyon, ma-access, maitama, mabura, tumutol sa pagproseso, at mailipat ang iyong datos, gayundin ang magsampa ng reklamo sa National Privacy Commission (NPC). Maaari mong bawiin ang iyong pahintulot anumang oras sa pamamagitan ng pagsulat, alinsunod sa mga legal na kinakailangan sa pagpapanatili ng datos.",
          "Para sa mga katanungan, makipag-ugnayan sa Data Privacy Officer ng Bago City Primary Care Facility o sa NPC sa complaints@privacy.gov.ph.",
        ],
      },
    ],
  },
  hil: {
    title: "Mga Patakaran, Pagkapribado kag Pagtugot",
    close: "Siraduhon",
    cancel: "Kanselahon",
    notice:
      "Palihog basaha ang tanan nga seksiyon kag mag-scroll pakadto sa idalom antes magbaton.",
    reviewed:
      "Nabasa na ang tanan nga seksiyon. Mahimo ka na maghatag sang pagtugot.",
    scroll: "Mag-scroll pakadto sa idalom agod makapadayon",
    accept: "Batunon kag Magpadayon",
    read: "Basaha ang tanan nga seksiyon agod makapadayon",
    consent:
      "Nabasa ko kag bug-os nga naintiendihan ang Mga Patakaran kag Kondisyon, Patakaran sa Pagkapribado, kag Pagtugot sa Pagproseso sang Datos. Kinabubut-on ko nga ginahatag ang akon pagtugot sa pagkolekta kag pagproseso sang akon personal nga datos sang Bago City Primary Care Facility suno sa Republic Act No. 10173 (Data Privacy Act of 2012).",
    sections: [
      {
        title: "Mga Patakaran kag Kondisyon",
        paragraphs: [
          "Sa pagparehistro kag paggamit sang E-Kalusugan, nagaugyon ka sa sini nga mga Patakaran. Ginadumalahan sang Bago City Primary Care Facility ang sistema agod mapahapos ang pag-iskedyul sang mga appointment kag pagdumala sang pila para sa mga pumuluyo.",
          "Kinahanglan ka maghatag sang husto nga impormasyon, tipigan nga sekreto ang imo mga detalye sa pag-login, kag gamiton ang sistema para lamang sa lehitimo nga mga appointment sa serbisyo sa panglawas. Indi ka dapat magsumite sang peke ukon doble nga mga appointment, mag-access sang datos sang iban nga mga gumagamit, ukon magtublag sa operasyon sang sistema.",
          "Ang E-Kalusugan isa lamang ka kagamitan sa pag-iskedyul — wala ini nagahatag sang medikal nga laygay ukon mga serbisyo sa emerhensiya. Mahimo bag-uhon ukon temporaryo nga untaton sang Health Center ang sistema sa bisan ano nga tion. Ang mga paglapas mahimo magresulta sa pag-deactivate sang account.",
        ],
      },
      {
        title: "Patakaran sa Pagkapribado",
        paragraphs: [
          "Ginakolekta sang E-Kalusugan ang imo personal nga impormasyon (ngalan, petsa sang pagkatawo, kasarian, mga detalye sa pagkontak, email, kag mga rekord sang serbisyo sa panglawas) agod mapahapos ang mga appointment kag pagdumala sang pila, suno sa Data Privacy Act of 2012 (RA 10173).",
          "Ginapaambit lamang ang imo datos sa awtorisado nga mga kawani sang health center, mga administrador sang sistema, kag mga awtoridad sa panglawas sang gobyerno kon ginakinahanglan sang kasuguan. Indi gid namon ibaligya ukon ipaambit ang imo datos sa komersiyal nga mga ikatlo nga partido.",
          "Ginatipigan ang mga rekord sa panglawas sa indi magnubo sa 10 ka tuig suno sa mga regulasyon sa Pilipinas. Naka-encrypt ang mga password (bcrypt), ginapadala ang datos paagi sa HTTPS, kag limitado ang pag-access sa mga kinahanglan lamang makabalo sini. Kon may paglapas sa seguridad sang datos, pahibaloon ang mga apektado nga indibidwal kag ang NPC sa sulod sang 72 ka oras.",
        ],
      },
      {
        title: "Pagtugot sa Pagproseso sang Datos",
        paragraphs: [
          "Ang imo pagtugot sa idalom sang RA 10173 ginahatag sing kinabubut-on, espesipiko, may bastante nga ihibalo, kag maathag. Sa pagbaton, ginatugutan mo ang Bago City Primary Care Facility nga magkolekta kag magproseso sang imo personal kag may kaangtanan sa panglawas nga datos para sa pag-iskedyul sang mga appointment, pagdumala sang pila, pag-analisar sang datos sa panglawas nga indi makapakilala sa imo, mga komunikasyon parte sa serbisyo, kag pag-archive sang mga rekord.",
          "Sa idalom sang Seksyon 16 sang RA 10173, may kinamatarong ka nga mapahibalo, maka-access, makapatadlong, makapapanas, magpamatok sa pagproseso, kag makapasaylo sang imo datos, kag makapasaka sang reklamo sa National Privacy Commission (NPC). Mahimo mo bawion ang imo pagtugot sa bisan ano nga tion paagi sa sulat, suno sa legal nga mga kinahanglanon sa pagtipig sang datos.",
          "Para sa mga pamangkot, kontaka ang Data Privacy Officer sang Bago City Primary Care Facility ukon ang NPC sa complaints@privacy.gov.ph.",
        ],
      },
    ],
  },
};

export default function TermsPrivacyModal({ open, onClose, onAccept }) {
  const [language, setLanguage] = useState("en");
  const text = TRANSLATIONS[language];
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Defer all state resets to avoid synchronous setState inside effect
    const timer = setTimeout(() => {
      setScrolledToBottom(false);
      setChecked(false);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        scrollRef.current.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 30)
      setScrolledToBottom(true);
  };

  const changeLanguage = (nextLanguage) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setScrolledToBottom(false);
    setChecked(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={text.title}
        lang={language}
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: "1 1 260px",
              minWidth: 0,
            }}
          >
            <img
              src="/assets/bago-city-pcf-small.webp"
              alt="Bago City Primary Care Facility"
              className="size-9 shrink-0 rounded-full object-contain sm:size-11"
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  color: "#93c5fd",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                E-Kalusugan
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#ffffff",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {text.title}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <img
              src="/assets/ekalusugan-logo-small.webp"
              alt="E-Kalusugan"
              className="size-9 rounded-full object-contain sm:size-11"
            />
            <button
              type="button"
              aria-label={text.close}
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ffffff",
                fontSize: "16px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
              }
            >
              {text.close}
            </button>
          </div>
        </div>

        <div
          role="group"
          aria-label="Language / Wika / Lengguwahe"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            padding: "12px 20px",
            flexShrink: 0,
          }}
        >
          {Object.entries(LANGUAGES).map(([code, label]) => (
            <button
              key={code}
              type="button"
              lang={code}
              aria-pressed={language === code}
              onClick={() => changeLanguage(code)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #1e4db7",
                background: language === code ? "#1e4db7" : "white",
                color: language === code ? "white" : "#1e4db7",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Notice ── */}
        <div
          style={{
            padding: "10px 20px",
            background: "#fefce8",
            borderBottom: "1px solid #fde68a",
            flexShrink: 0,
          }}
        >
          <p style={{ margin: 0, fontSize: "11.5px", color: "#92400e" }}>
            {scrolledToBottom ? text.reviewed : text.notice}
          </p>
        </div>

        {/* ── Scrollable Content ── */}
        <div
          ref={scrollRef}
          role="region"
          aria-label={text.title}
          tabIndex={0}
          onScroll={handleScroll}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "20px 24px",
            fontSize: "12.5px",
            lineHeight: 1.7,
            color: "#374151",
          }}
        >
          {language === "en" ? (
            <>
              <Section title="Terms & Conditions">
                <p>
                  By registering and using E-Kalusugan, you agree to these
                  Terms. The system is operated by the{" "}
                  <strong>Bago City Primary Care Facility</strong> to facilitate
                  appointment scheduling and queue management for residents.
                </p>
                <p>
                  You must provide accurate information, keep your credentials
                  confidential, and use the system only for legitimate
                  healthcare appointments. You must not submit false or
                  duplicate appointments, access other users' data, or interfere
                  with system operations.
                </p>
                <p>
                  E-Kalusugan is a scheduling tool only — it does not provide
                  medical advice or emergency services. The Health Center may
                  update or suspend the system at any time. Violations may
                  result in account deactivation.
                </p>
              </Section>

              <Section title="Privacy Policy">
                <p>
                  E-Kalusugan collects your{" "}
                  <strong>personal information</strong> (name, date of birth,
                  gender, contact details, email, and health service records) to
                  facilitate appointments and queue management, in compliance
                  with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
                </p>
                <p>
                  Your data is shared only with authorized health center
                  personnel, system administrators, and government health
                  authorities when required by law. We will{" "}
                  <strong>never</strong> sell or share your data with commercial
                  third parties.
                </p>
                <p>
                  Health records are retained for a minimum of{" "}
                  <strong>10 years</strong> per Philippine regulations.
                  Passwords are encrypted (bcrypt), data is transmitted via
                  HTTPS, and access is restricted on a need-to-know basis. In
                  the event of a data breach, affected individuals and the NPC
                  will be notified within <strong>72 hours</strong>.
                </p>
              </Section>

              <Section title="Data Privacy Consent">
                <p>
                  Your consent under <strong>RA 10173</strong> is freely given,
                  specific, informed, and unambiguous. By accepting, you
                  authorize the Bago City Primary Care Facility to collect and
                  process your personal and health-related data for appointment
                  scheduling, queue management, anonymized health analytics,
                  service communications, and records archival.
                </p>
                <p>
                  Under Section 16 of RA 10173, you have the right to be
                  informed, access, rectify, erase, object to, and port your
                  data, as well as to lodge a complaint with the{" "}
                  <strong>National Privacy Commission (NPC)</strong>. You may
                  withdraw consent at any time in writing, subject to legal
                  retention requirements.
                </p>
                <p style={{ margin: 0 }}>
                  For inquiries, contact the{" "}
                  <strong>
                    Bago City Primary Care Facility Data Privacy Officer
                  </strong>{" "}
                  or the NPC at{" "}
                  <span style={{ color: "#1e4db7" }}>
                    complaints@privacy.gov.ph
                  </span>
                  .
                </p>
              </Section>
            </>
          ) : (
            text.sections.map((section) => (
              <Section key={section.title} title={section.title}>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </Section>
            ))
          )}

          {!scrolledToBottom && (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              {text.scroll}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
            flexShrink: 0,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: scrolledToBottom ? "pointer" : "not-allowed",
              marginBottom: "14px",
              opacity: scrolledToBottom ? 1 : 0.45,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={!scrolledToBottom}
              onChange={(e) => setChecked(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                marginTop: "2px",
                flexShrink: 0,
                accentColor: "#1e4db7",
              }}
            />
            <span
              style={{ fontSize: "12.5px", color: "#374151", lineHeight: 1.55 }}
            >
              {text.consent}
            </span>
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                background: "white",
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f3f4f6")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              {text.cancel}
            </button>
            <button
              type="button"
              disabled={!scrolledToBottom || !checked}
              onClick={onAccept}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: "12px",
                border: "none",
                background: checked
                  ? "linear-gradient(90deg, #1a3a8f 0%, #2563eb 100%)"
                  : "#e5e7eb",
                color: checked ? "#ffffff" : "#9ca3af",
                fontSize: "13px",
                fontWeight: 700,
                cursor: checked ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              {checked ? text.accept : text.read}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section helper ── */
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3
        style={{
          margin: "0 0 10px",
          fontSize: "13px",
          fontWeight: 700,
          color: "#1a3a8f",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          paddingBottom: "6px",
          borderBottom: "2px solid #dbeafe",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
