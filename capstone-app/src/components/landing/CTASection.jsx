import React from "react";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate(); // ✅ moved inside the component

  return (
    <section
      className="w-full py-10 sm:py-14 px-4 sm:px-6 flex flex-col items-center justify-center text-center"
      style={{
        background:
          "linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)",
      }}
    >
      <h2
        className="text-white font-extrabold mb-3 max-w-sm sm:max-w-md"
        style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", lineHeight: 1.3 }}
      >
        Ready to Transform Your Healthcare Experience?
      </h2>

      <p className="text-rose-100 text-xs sm:text-sm max-w-xs sm:max-w-sm mb-7 sm:mb-8 leading-relaxed">
        Join thousands of patients who have already experienced hassle-free
        healthcare scheduling.
      </p>

      <button
        onClick={() => navigate("/login")}
        className="bg-white font-semibold text-xs sm:text-sm px-6 sm:px-10 py-2.5 sm:py-3 rounded-md transition-all hover:bg-rose-50 active:scale-95 w-full max-w-xs sm:max-w-none sm:w-auto"
        style={{ color: "#e11d48" }}
      >
        Schedule Your Visit Today
      </button>
    </section>
  );
};

export default CTASection;
