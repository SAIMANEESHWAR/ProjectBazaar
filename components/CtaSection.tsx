
import React from 'react';
import { useNavigation } from '../App';

const CtaSection: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-black/30"></div>
             <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Join the Bazaar?</h2>
                <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
                    Whether you're looking to monetize your skills or find the perfect project, your journey starts here.
                </p>
                <button onClick={() => navigateTo('auth')} className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105">
                    Join Now
                </button>
             </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
