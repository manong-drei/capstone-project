import { Link } from "react-router-dom";
import { Bell, Check, ShieldCheck, Ticket, ArrowUpRight } from "lucide-react";
import "./auth-page.css";

const AuthPageLayout = ({ children, logoTo = "/" }) => (
  <main className="auth-page">
    <div className="auth-shell">
      <aside className="auth-story" aria-label="About E-Kalusugan">
        <Link to={logoTo} className="auth-brand">
          <img
            src="/assets/ekalusugan-logo-small.webp"
            alt=""
            width="44"
            height="44"
          />
          <span>
            E-KALUSUGAN<small>BAGO CITY PRIMARY CARE FACILITY</small>
          </span>
        </Link>
        <div className="auth-story-copy">
          <p className="auth-eyebrow">
            <span /> YOUR HEALTH, WITHIN REACH
          </p>
          <h2>
            A better visit.
            <br /> A healthier <em>smile.</em>
          </h2>
          <p>
            Your dental queue, right on your phone. Less waiting.
            <br className="hidden xl:block" /> More time for what matters.
          </p>
        </div>
        <div
          className="auth-illustration"
          role="img"
          aria-label="Illustration of the E-Kalusugan patient dashboard with sample dental queue ticket AQ07. This is not live queue information."
        >
          <div className="auth-orbit auth-orbit-one" />
          <div className="auth-orbit auth-orbit-two" />
          <div className="auth-phone" aria-hidden="true">
            <div className="auth-phone-camera" />
            <div className="auth-phone-top">
              <span>9:41</span>
              <span>••• ▰</span>
            </div>
            <div className="auth-phone-content">
              <div className="auth-phone-greeting">
                <span>
                  Hello, Maria <span className="auth-wave">✦</span>
                  <small>Let’s take care of your smile.</small>
                </span>
                <Bell size={18} />
              </div>
              <div className="auth-ticket">
                <div className="auth-ticket-heading">
                  <Ticket size={17} /> YOUR DENTAL TICKET <span>Sample</span>
                </div>
                <small>YOUR QUEUE NUMBER</small>
                <strong>AQ07</strong>
                <div className="auth-ticket-status">
                  <span /> You’re in the queue
                </div>
                <div className="auth-ticket-bottom">
                  <span>
                    Now serving<b>AQ05</b>
                  </span>
                  <span>
                    People ahead<b>02</b>
                  </span>
                </div>
              </div>
              <div className="auth-phone-service">
                <span className="auth-service-icon">
                  <Check size={17} />
                </span>
                <span>
                  Dental consultation<small>Bago City Health Center</small>
                </span>
                <ArrowUpRight size={16} />
              </div>
              <div className="auth-phone-note">
                <Bell size={16} />
                <span>
                  A little heads-up.
                  <small>Follow your turn wherever you are.</small>
                </span>
              </div>
            </div>
            <div className="auth-phone-home" />
          </div>
          <div className="auth-float auth-float-ticket" aria-hidden="true">
            <span className="auth-float-icon">
              <Ticket size={20} />
            </span>
            <span>
              Your place, reserved.<small>One less thing to worry about.</small>
            </span>
          </div>
          <div className="auth-float auth-float-check" aria-hidden="true">
            <span className="auth-check-icon">
              <Check size={18} />
            </span>
            <span>
              Care starts here.<small>Connected to your community.</small>
            </span>
          </div>
        </div>
        <div className="auth-story-footer">
          <ShieldCheck size={17} />
          <span>Built around you and your community.</span>
          <span className="auth-footer-line" />
        </div>
      </aside>
      <section className="auth-form-side" aria-label="Your account">
        <div className="auth-form-panel">
          <div className="auth-form-logos">
            <img
              src="/assets/bago-city-pcf-small.webp"
              alt="Bago City Primary Care Facility"
              width="72"
              height="72"
            />
            <span aria-hidden="true" />
            <img
              src="/assets/ekalusugan-logo-small.webp"
              alt="E-Kalusugan"
              width="72"
              height="72"
            />
          </div>
          {children}
        </div>
        <p className="auth-form-footer">
          E-Kalusugan <span>·</span> Bago City Health Center
        </p>
      </section>
    </div>
  </main>
);

export default AuthPageLayout;
