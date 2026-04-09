import { useState, useRef, useEffect } from "react";

export default function TermsPrivacyModal({ open, onClose, onAccept }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Defer all state resets to avoid synchronous setState inside effect
    const timer = setTimeout(() => {
      setScrolledToBottom(false);
      setChecked(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 0);

    return () => clearTimeout(timer);
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 30)
      setScrolledToBottom(true);
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                />
                <rect
                  x="13"
                  y="8"
                  width="6"
                  height="16"
                  rx="1.5"
                  fill="white"
                />
                <rect
                  x="8"
                  y="13"
                  width="16"
                  height="6"
                  rx="1.5"
                  fill="white"
                />
              </svg>
            </div>
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
                Terms, Privacy &amp; Consent
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
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
            &#x2715;
          </button>
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
            {scrolledToBottom
              ? "All sections reviewed. You may now accept."
              : "Please scroll through and read all sections before accepting."}
          </p>
        </div>

        {/* ── Scrollable Content ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            fontSize: "12.5px",
            lineHeight: 1.7,
            color: "#374151",
          }}
        >
          <Section title="📋 Terms & Conditions">
            <p>
              By registering and using E-Kalusugan, you agree to these Terms.
              The system is operated by the{" "}
              <strong>Bago City Health Center</strong> to facilitate appointment
              scheduling and queue management for residents.
            </p>
            <p>
              You must provide accurate information, keep your credentials
              confidential, and use the system only for legitimate healthcare
              appointments. You must not submit false or duplicate appointments,
              access other users' data, or interfere with system operations.
            </p>
            <p>
              E-Kalusugan is a scheduling tool only — it does not provide
              medical advice or emergency services. The Health Center may update
              or suspend the system at any time. Violations may result in
              account deactivation.
            </p>
          </Section>

          <Section title="🔒 Privacy Policy">
            <p>
              E-Kalusugan collects your <strong>personal information</strong>{" "}
              (name, date of birth, gender, contact details, email, and health
              service records) to facilitate appointments and queue management,
              in compliance with the{" "}
              <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
            </p>
            <p>
              Your data is shared only with authorized health center personnel,
              system administrators, and government health authorities when
              required by law. We will <strong>never</strong> sell or share your
              data with commercial third parties.
            </p>
            <p>
              Health records are retained for a minimum of{" "}
              <strong>10 years</strong> per Philippine regulations. Passwords
              are encrypted (bcrypt), data is transmitted via HTTPS, and access
              is restricted on a need-to-know basis. In the event of a data
              breach, affected individuals and the NPC will be notified within{" "}
              <strong>72 hours</strong>.
            </p>
          </Section>

          <Section title="🇵🇭 Data Privacy Consent">
            <p>
              Your consent under <strong>RA 10173</strong> is freely given,
              specific, informed, and unambiguous. By accepting, you authorize
              the Bago City Health Center to collect and process your personal
              and health-related data for appointment scheduling, queue
              management, anonymized health analytics, service communications,
              and records archival.
            </p>
            <p>
              Under Section 16 of RA 10173, you have the right to be informed,
              access, rectify, erase, object to, and port your data, as well as
              to lodge a complaint with the{" "}
              <strong>National Privacy Commission (NPC)</strong>. You may
              withdraw consent at any time in writing, subject to legal
              retention requirements.
            </p>
            <p style={{ margin: 0 }}>
              For inquiries, contact the{" "}
              <strong>Bago City Health Center Data Privacy Officer</strong> or
              the NPC at{" "}
              <span style={{ color: "#1e4db7" }}>
                complaints@privacy.gov.ph
              </span>
              .
            </p>
          </Section>

          {!scrolledToBottom && (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              Scroll to the bottom to continue
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
            <div
              style={{ position: "relative", marginTop: "1px", flexShrink: 0 }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!scrolledToBottom}
                onChange={(e) => setChecked(e.target.checked)}
                style={{
                  opacity: 0,
                  position: "absolute",
                  width: "18px",
                  height: "18px",
                  margin: 0,
                  cursor: scrolledToBottom ? "pointer" : "not-allowed",
                }}
              />
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "5px",
                  border: `2px solid ${checked ? "#1e4db7" : "#d1d5db"}`,
                  background: checked ? "#1e4db7" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  pointerEvents: "none",
                }}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span
              style={{ fontSize: "12.5px", color: "#374151", lineHeight: 1.55 }}
            >
              I have read and fully understood the Terms and Conditions, Privacy
              Policy, and Data Privacy Consent. I voluntarily give my consent to
              the collection and processing of my personal data by the Bago City
              Health Center in accordance with{" "}
              <strong>Republic Act No. 10173</strong> (Data Privacy Act of
              2012).
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
              Cancel
            </button>
            <button
              type="button"
              disabled={!checked}
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
              {checked
                ? "Accept & Create Account"
                : "Read all sections to continue"}
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
