import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav
      className="w-full px-4 sm:px-6 py-3 flex items-center justify-between"
      style={{ background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/assets/Logo.jpg"
          alt="E-KALUSUGAN Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
        />
        <span className="text-white font-extrabold text-sm sm:text-base md:text-lg tracking-widest uppercase select-none">
          E-KALUSUGAN
        </span>
      </div>

      {/* Nav Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Login — outline style, fills orange on hover, text flips to white */}
        <button
          onClick={() => navigate("/login")}
          className="
            relative px-3 sm:px-5 py-1 sm:py-1.5 rounded-full
            font-semibold text-xs sm:text-sm
            overflow-hidden
            transition-all duration-300 ease-in-out
            hover:scale-105 hover:shadow-[0_4px_18px_rgba(249,115,22,0.55)]
            active:scale-95
            group
          "
          style={{
            border: "2px solid #f97316",
            color: "#f97316",
            background: "transparent",
          }}
        >
          {/* fill layer slides up on hover */}
          <span className="absolute inset-0 bg-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out rounded-full" />
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
            Login
          </span>
        </button>

        {/* Register — solid orange, darkens + glows on hover */}
        <button
          onClick={() => navigate("/register")}
          className="
            relative px-3 sm:px-5 py-1 sm:py-1.5 rounded-full
            font-semibold text-xs sm:text-sm text-white
            overflow-hidden
            transition-all duration-300 ease-in-out
            hover:scale-105 hover:shadow-[0_4px_18px_rgba(249,115,22,0.65)]
            active:scale-95
            group
          "
          style={{ background: "#f97316", border: "2px solid #f97316" }}
        >
          {/* shimmer sweep on hover */}
          <span
            className="
              absolute inset-0 -skew-x-12
              bg-linear-to-r from-transparent via-white/25 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-transform duration-500 ease-in-out
            "
          />
          <span className="relative z-10">Register</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
