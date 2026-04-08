import React from "react";

const Footer = () => {
  return (
    <footer
      className="w-full px-4 sm:px-8 pt-8 sm:pt-10 pb-5"
      style={{ background: "#0f172a" }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Top Grid – 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-6 mb-8">
          {/* Column 1 – Brand (full width on mobile) */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-bold text-sm mb-2 tracking-wide">
              E-KALUSUGAN
            </h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Making healthcare accessible for everyone.
            </p>
          </div>

          {/* Column 2 – Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-1.5">
              {["Home", "Doctors", "Help"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 text-xs hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 – Support */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">
              Support
            </h4>
            <ul className="space-y-1.5">
              {["Contact Us", "Privacy Policy", "Terms"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 text-xs hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 – About */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">
              About
            </h4>
            <ul className="space-y-1.5">
              {["About Us", "Blog", "Careers"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-gray-400 text-xs hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-gray-500 text-xs text-center">
            © 2024 E-KALUSUGAN. All rights reserved. | Bago City Health Center
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
