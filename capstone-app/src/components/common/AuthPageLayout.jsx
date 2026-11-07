import { Link } from "react-router-dom";

const AuthPageLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-[linear-gradient(160deg,#dbeafe_0%,#bfdbfe_60%,#dbeafe_100%)]">
  <nav className="w-full px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7]">
    <Link to="/" className="flex items-center gap-2">
      <img
        src="/assets/ekalusugan-logo-small.webp"
        alt=""
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
      />
      <span className="text-white font-extrabold text-sm sm:text-base tracking-widest uppercase select-none">
        E-KALUSUGAN
      </span>
    </Link>
  </nav>

    <div className="flex-1 flex items-center justify-center px-4 py-8 bg-[url('/assets/BGHero.webp')] bg-cover bg-center bg-no-repeat">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg bg-white rounded-2xl px-8 py-9 sm:px-10 sm:py-11 lg:px-12 lg:py-12 shadow-[0_8px_40px_rgba(0,0,0,0.13)]">
        {children}
      </div>
    </div>
  </div>
);

export default AuthPageLayout;
