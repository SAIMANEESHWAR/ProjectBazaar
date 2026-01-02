"use client";

import React from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "./ui/hover-footer";
import { useNavigation } from '../App';

const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();

  // Footer link data
  const footerLinks = [
    {
      title: "Company",
      links: [
        { label: "About Us", onClick: () => {} },
        { label: "Our Team", onClick: () => {} },
        { label: "Careers", onClick: () => {} },
        { label: "Press Kit", onClick: () => {} },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "FAQs", onClick: () => {
          const element = document.getElementById('faqs');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }},
        { label: "Support", onClick: () => {} },
        {
          label: "Live Chat",
          onClick: () => {},
          pulse: true,
        },
      ],
    },
  ];

  // Contact info data
  const contactInfo = [
    {
      icon: <Mail size={18} className="text-orange-500" />,
      text: "support@projectbazaar.com",
      href: "mailto:support@projectbazaar.com",
    },
    {
      icon: <Phone size={18} className="text-orange-500" />,
      text: "+1 (555) 123-4567",
      href: "tel:+15551234567",
    },
    {
      icon: <MapPin size={18} className="text-orange-500" />,
      text: "San Francisco, CA",
    },
  ];

  // Social media icons
  const socialLinks = [
    { icon: <Facebook size={20} />, label: "Facebook", href: "#" },
    { icon: <Instagram size={20} />, label: "Instagram", href: "#" },
    { icon: <Twitter size={20} />, label: "Twitter", href: "#" },
    { icon: <Linkedin size={20} />, label: "LinkedIn", href: "#" },
    { icon: <Github size={20} />, label: "GitHub", href: "#" },
  ];

  return (
    <footer className="bg-black relative h-fit overflow-hidden w-full">
      <div className="max-w-7xl mx-auto p-8 md:p-14 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#footer-logo-gradient)" />
                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="footer-logo-gradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f97316"/>
                    <stop offset="1" stopColor="#ea580c"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-white text-2xl font-bold">ProjectBazaar</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The ultimate marketplace for projects, ideas, and collaborations. Turn your academic and personal projects into real revenue.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-lg font-semibold mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <button
                      onClick={link.onClick}
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      {link.label}
                    </button>
                    {link.pulse && (
                      <span className="absolute top-1/2 -translate-y-1/2 ml-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-gray-700/50 my-8" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0">
          {/* Social icons */}
          <div className="flex space-x-6 text-gray-400">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-orange-500 transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-gray-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} ProjectBazaar. All rights reserved.
          </p>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-[30rem] -mt-52 -mb-36 px-8">
        <TextHoverEffect text="ProjectBazaar" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
};

export default Footer;
