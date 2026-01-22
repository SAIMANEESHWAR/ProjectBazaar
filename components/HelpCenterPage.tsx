import React, { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const HelpCenterPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQ[] = [
    {
      category: 'Getting Started',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button in the top right corner, fill in your email and password, and you\'re all set! You can start browsing and purchasing projects immediately.',
    },
    {
      category: 'Getting Started',
      question: 'What is the difference between a buyer and seller account?',
      answer: 'A buyer account allows you to purchase projects from the marketplace. A seller account lets you upload and sell your own projects. You can switch between modes in your dashboard.',
    },
    {
      category: 'Purchases',
      question: 'How do I purchase a project?',
      answer: 'Browse the marketplace, click on a project you like, review the details, and click "Add to Cart" or "Buy Now". Complete the checkout process to get instant access to your purchase.',
    },
    {
      category: 'Purchases',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely through our encrypted payment gateway.',
    },
    {
      category: 'Selling',
      question: 'How do I upload a project?',
      answer: 'Switch to seller mode in your dashboard, click "My Projects", then "Upload New Project". Fill in the project details, upload files, and submit for review. Once approved, your project will be live on the marketplace.',
    },
    {
      category: 'Selling',
      question: 'How long does project approval take?',
      answer: 'Project approval typically takes 24-48 hours. Our admin team reviews each project to ensure quality and compliance with our guidelines.',
    },
    {
      category: 'Selling',
      question: 'How do I get paid for my projects?',
      answer: 'Once a buyer purchases your project, the funds are added to your earnings. You can request a payout from the "Payouts" section in your seller dashboard. Minimum payout is ₹50.',
    },
    {
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Go to Settings in your dashboard, click on "Security", and then "Change Password". Enter your current password and your new password.',
    },
    {
      category: 'Account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from the Settings page. Please note that this action is irreversible and all your data will be permanently removed.',
    },
    {
      category: 'Technical',
      question: 'I can\'t download my purchased project. What should I do?',
      answer: 'Check your internet connection first. If the issue persists, go to your Purchases page and try downloading again. If problems continue, contact our support team.',
    },
    {
      category: 'Technical',
      question: 'The project I purchased doesn\'t work. Can I get a refund?',
      answer: 'We offer a 7-day refund policy. If a project doesn\'t work as described, contact support within 7 days of purchase for a full refund.',
    },
  ];

  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600">Find answers to common questions and get support</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">No results found. Try a different search term or category.</p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {faq.category}
                  </span>
                  <span className="text-left font-semibold text-gray-900">{faq.question}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
        <p className="mb-4 opacity-90">Our support team is here to assist you 24/7</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Support
          </button>
          <button className="px-6 py-3 bg-orange-700 text-white rounded-lg font-semibold hover:bg-orange-800 transition-colors">
            Live Chat
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Documentation</h3>
          <p className="text-sm text-gray-600">Browse our comprehensive guides</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Community Forum</h3>
          <p className="text-sm text-gray-600">Connect with other users</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Video Tutorials</h3>
          <p className="text-sm text-gray-600">Watch step-by-step videos</p>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;

