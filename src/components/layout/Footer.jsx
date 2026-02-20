import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t mt-10">
      {/* MAIN FOOTER */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* LOGO + ADDRESS */}
        <div className="flex flex-col items-start">
          <img src="logo.png" alt="Logo" className="w-60 mb-4" />
          <p className="text-gray-700 leading-relaxed text-sm">
            101 W McKnight Way, Suite B <br />
            #255 Grass Valley CA, 95949
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Quick Links</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>
              <a href="/faqs" className="hover:text-blue-700">
                FAQs
              </a>
            </li>
            <li>
              <a href="/navigator" className="hover:text-blue-700">
                AED Navigator
              </a>
            </li>
            <li>
              <a href="/navigator-portal" className="hover:text-blue-700">
                AED Navigator Portal
              </a>
            </li>
          </ul>
        </div>

        {/* CONTACT INFO */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Get In Touch</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>📞 (530) 477-6818</li>
            <li>
              <a href="mailto:info@example.com" className="hover:text-blue-700">
                Email Us
              </a>
            </li>
            <li>Monday - Friday</li>
            <li>Hours: 8am–5pm PST</li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT BAR */}
      <div
        className="w-full text-center py-3 text-white text-sm"
        style={{ backgroundColor: "#111686" }}
      >
        Copyright © 2025
      </div>
    </footer>
  );
};

export default Footer;
