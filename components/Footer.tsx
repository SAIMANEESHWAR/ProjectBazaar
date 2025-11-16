import React from 'react';

const LogoIcon: React.FC = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.293 3.293L12 1.00001L3.29297 9.70704C3.10547 9.89454 3.00006 10.149 3.00006 10.414V20C3.00006 20.552 3.44806 21 4.00006 21H12V13H14V21H20C20.552 21 21 20.552 21 20V10.414C21 10.149 20.8946 9.89452 20.7071 9.70702L14.293 3.293Z" fill="url(#paint0_linear_footer)"/>
      <defs>
        <linearGradient id="paint0_linear_footer" x1="3" y1="1" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6"/>
          <stop offset="1" stopColor="#9333EA"/>
        </linearGradient>
      </defs>
    </svg>
);

const MapPinIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PhoneIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const EnvelopeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const FacebookIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>;
const InstagramIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zm-1.163 1.943c-2.43 0-2.758.01-3.728.058-1.002.048-1.62.21-2.096.385a3.007 3.007 0 00-1.15 1.15c-.174.476-.337 1.094-.385 2.096-.048.97-.058 1.299-.058 3.728s.01 2.758.058 3.728c.048 1.002.21 1.62.385 2.096a3.007 3.007 0 001.15 1.15c.476.174 1.094.337 2.096.385.97.048 1.299.058 3.728.058s2.758-.01 3.728-.058c1.002-.048 1.62-.21 2.096-.385a3.007 3.007 0 001.15-1.15c.174-.476.337-1.094.385-2.096.048-.97.058-1.299.058-3.728s-.01-2.758-.058-3.728c-.048-1.002-.21-1.62-.385-2.096a3.007 3.007 0 00-1.15-1.15c-.476-.174-1.094-.337-2.096-.385C15.073 3.953 14.744 3.943 12.315 3.943h-1.163zM12 6.845a5.155 5.155 0 100 10.31 5.155 5.155 0 000-10.31zM12 15a3 3 0 110-6 3 3 0 010 6zm4.85-8.085a1.163 1.163 0 10-2.326 0 1.163 1.163 0 002.326 0z" clipRule="evenodd" /></svg>;
const TwitterIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>;

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
                <LogoIcon />
                <span className="text-2xl font-bold tracking-wider text-gray-900 dark:text-white">PROJECT BAZAAR</span>
            </div>
            <p className="text-sm mb-6 text-gray-600 dark:text-gray-400">
              The marketplace for innovation and project commerce.
            </p>
            <button className="flex items-center justify-center gap-2 text-sm font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-5 rounded-full shadow-sm hover:shadow-lg transition-shadow duration-300">
              Enquiry Now
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h5 className="font-bold text-gray-900 dark:text-white mb-4">Quick Links</h5>
            <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Services</a></li>
                <li><a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Projects</a></li>
                <li><a href="#" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          {/* Column 3: Contact Us */}
          <div>
            <h5 className="font-bold text-gray-900 dark:text-white mb-4">Contact Us</h5>
            <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                    <MapPinIcon />
                    <span>123 Innovation Drive, Tech City, 500004</span>
                </li>
                <li className="flex items-start gap-3">
                    <PhoneIcon />
                    <span>+91-12345 67890</span>
                </li>
                 <li className="flex items-start gap-3">
                    <EnvelopeIcon />
                    <span>info@projectbazaar.in</span>
                </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} Project Bazaar. All rights reserved.</p>
            <div className="flex space-x-4">
                <a href="#" className="text-gray-500 hover:text-blue-600 dark:hover:text-white transition-colors"><FacebookIcon /></a>
                <a href="#" className="text-gray-500 hover:text-pink-500 dark:hover:text-white transition-colors"><InstagramIcon /></a>
                <a href="#" className="text-gray-500 hover:text-sky-500 dark:hover:text-white transition-colors"><TwitterIcon /></a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
