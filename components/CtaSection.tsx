import React from 'react';
import { useNavigation } from '../App';

const CtaSection: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-orange-100 mb-8">Join thousands of developers building amazing projects</p>
        <button
          onClick={() => navigateTo('browseProjects')}
          className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
        >
          Get Started Now
        </button>
      </div>
    </section>
  );
};

export default CtaSection;
