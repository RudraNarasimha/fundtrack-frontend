import React from "react";
import { FaFacebookF, FaInstagram, FaPhone, FaMapMarkerAlt, FaEnvelope, FaYoutube, FaTelegram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white rounded text-black-300 py-8 mt-6">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">

        {/* About */}
        <div>
          <h2 className="text-lg font-semibold text-black mb-3">Sri Bala Ganesh Youth</h2>
          <p className="text-sm leading-relaxed">
            A community-driven youth organisation working towards social service,
            cultural activities and helping local people grow together.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold text-black mb-3">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="https://sri-bala-ganesh-youth-six.vercel.app/about" className="hover:text-white duration-200">About Us</a></li>
            <li><a href="https://sri-bala-ganesh-youth-six.vercel.app/events" className="hover:text-white duration-200">Events</a></li>
            <li><a href="https://sri-bala-ganesh-youth-six.vercel.app/gallery" className="hover:text-white duration-200">Gallery</a></li>
            <li><a href="https://sri-bala-ganesh-youth-six.vercel.app/contact" className="hover:text-white duration-200">Contact</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-lg font-semibold text-black mb-3">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <FaPhone /> +91 91776 63929
            </li>
            <li className="flex items-center gap-2">
              <FaMapMarkerAlt /> Bhimavaram, Andhra Pradesh
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope /> info@sribalaganesh.org
            </li>
          </ul>

          {/* Social Icons */}
          <div className="flex gap-3 mt-4">
            <a href="https://www.instagram.com/team_sribalaganeshyouth/?utm_source=qr&igsh=MTZsMjdreHZpOWFldQ%3D%3D#" className="p-2 bg-white text-gray-400 rounded-full hover:bg-gray-200 transition">
              <FaFacebookF size={14} />
            </a>
            <a href="https://www.instagram.com/team_sribalaganeshyouth/?utm_source=qr&igsh=MTZsMjdreHZpOWFldQ%3D%3D#" className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-200 transition">
              <FaInstagram size={14} />
            </a>
            <a href="https://www.instagram.com/team_sribalaganeshyouth/?utm_source=qr&igsh=MTZsMjdreHZpOWFldQ%3D%3D#" className="p-2 bg-white text-gray-400 rounded-full hover:bg-gray-200 transition">
              <FaYoutube size={14} />
            </a>
            <a href="https://www.instagram.com/team_sribalaganeshyouth/?utm_source=qr&igsh=MTZsMjdreHZpOWFldQ%3D%3D#" className="p-2 bg-white text-gray-400 rounded-full hover:bg-gray-200 transition">
              <FaTelegram size={14} />
            </a>
          </div>
        </div>
      </div>

      <hr className="border-gray-700 mt-6" />

      <p className="text-center text-xs text-gray-400 mt-4">
        ™ {new Date().getFullYear()} Sri Bala Ganesh Youth. All Rights Reserved.
      </p>
    </footer>
  );
}
