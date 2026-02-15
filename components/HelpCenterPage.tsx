import React, { useState } from 'react';
import BugReportModal from './BugReportModal';
import Lottie from 'lottie-react';
import helpCenterAnimation from '../lottiefiles/helpcenter.json';
import helpcenter from '../lottiefiles/helpcenter2.json';
import { Play, Clock, ChevronRight } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface HelpCenterPageProps {
  toggleSidebar?: () => void;
  userEmail?: string;
}

const tutorials = [
  { id: 1, title: "Getting Started", duration: "5:20" },
  { id: 2, title: "Advanced Techniques", duration: "12:45" },
  { id: 3, title: "Workflow Optimization", duration: "8:15" },
  { id: 4, title: "Project Management", duration: "10:30" },
  { id: 5, title: "Custom Integration", duration: "7:50" },
  { id: 6, title: "Security Best Practices", duration: "15:10" },
];

const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ toggleSidebar, userEmail }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBugReport, setShowBugReport] = useState(false);

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
    <div className="space-y-6 p-4 sm:p-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md rounded-xl p-6 space-y-6">

        {/* Top Section: Lottie + Heading */}
        <div className="flex items-center gap-6">

          {/* Lottie Left */}
          <div className="w-28 h-28 flex-shrink-0">
            <Lottie
              animationData={helpCenterAnimation}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Heading Right */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Help Center
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-1">
              Find answers to common questions and get support
            </p>
          </div>

        </div>

        {/* Search Bar Below */}
        <div className="relative">
          <input
            type="text"
            placeholder="How can we help you today?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <svg
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="flex gap-8 items-start">

        {/* LEFT SIDE – 70% */}
        <div className="w-[70%]">
          <div className="bg-white border border-orange-600 rounded-tl-3xl rounded-br-3xl overflow-hidden divide-y divide-orange-200">

            {filteredFaqs.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500">
                  Try a different search term or category.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <div key={index}>
                  <button
                    onClick={() =>
                      setOpenIndex(openIndex === index ? null : index)
                    }
                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        {faq.category}
                      </span>
                      <span className="text-left font-semibold text-gray-900">
                        {faq.question}
                      </span>
                    </div>

                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${openIndex === index ? 'rotate-180' : ''
                        }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {openIndex === index && (
                    <div className="px-6 py-4 bg-orange-50">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE – 30% */}
        <div className="w-[30%] flex justify-center items-start">
          <Lottie
            animationData={helpcenter}
            loop
            autoplay
            style={{ width: '100%', height: 'auto' }}
          />
        </div>

      </div>

{/* Video Tutorials */}
      <div className="min-h-screen p-2 md:p-2">
          <div className="bg-white border border-orange-600 rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Video Tutorials</h2>
                <p className="text-gray-500 mt-1">Master the platform with these step-by-step guides.</p>
              </div>
              <button className="hidden sm:flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors">
                View all tutorials <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.map((video) => (
                <div
                  key={video.id}
                  className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Video Placeholder */}
                  <div className="relative w-full h-48 bg-gray-900 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="text-white fill-white w-6 h-6 ml-1" />
                    </div>
                    <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {video.duration}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Module {video.id} • Essential Training</p>
                  </div>
                </div>
              ))}
            </div>
          </div>    
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
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
            <div className="w-48 h-48 flex-shrink-0 opacity-80">
              <Lottie
                animationData={helpCenterAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-600">Documentation</h3>
          <p className="text-sm text-gray-600">Browse our comprehensive guides</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600">Community Forum</h3>
          <p className="text-sm text-gray-600">Connect with other users</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-green-600">Video Tutorials</h3>
          <p className="text-sm text-gray-600">Watch step-by-step videos</p>
        </div>

        <button
          onClick={() => setShowBugReport(true)}
          className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-all hover:border-rose-300 group"
        >
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-200 transition-colors">
            <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors">Report a Bug</h3>
          <p className="text-sm text-gray-600">Found an issue? Let us know</p>
        </button>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
        userEmail={userEmail}
        onSubmit={async (data) => {
          // TODO: Implement actual bug report submission to backend
          console.log('Bug report submitted:', data);
          // For now, just simulate a successful submission
          await new Promise(resolve => setTimeout(resolve, 1000));
        }}
      />
    </div>
  );
};

export default HelpCenterPage;

