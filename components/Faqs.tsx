
import React, { useState } from 'react';
import FaqItem from './FaqItem';

const faqData = [
  {
    question: 'What is Project Bazaar?',
    answer: 'Project Bazaar is a digital marketplace where students, freelancers, and professionals can buy and sell academic, technical, and personal projects. It\'s a platform to monetize your work and find high-quality, ready-to-use projects.',
  },
  {
    question: 'How do I sell my project?',
    answer: 'To sell a project, you need to sign up as a Seller. From your Seller Dashboard, you can upload your project files, add a title, description, tags, and set a price. After a quick review by our team, your project will be listed on the marketplace.',
  },
  {
    question: 'What types of projects can I sell?',
    answer: 'You can sell a wide variety of projects, including source code for web and mobile apps, machine learning models, UI/UX design files, game development projects, academic papers, and more. All projects must be your original work.',
  },
  {
    question: 'How do payments work?',
    answer: 'We partner with secure payment gateways like Stripe and Razorpay. When a buyer purchases your project, the payment is processed, and after deducting a small platform fee, the earnings are transferred to your connected account.',
  },
  {
    question: 'Is it safe to buy projects here?',
    answer: 'Absolutely. Every project goes through a review process to ensure quality and authenticity. We also provide a secure payment system and support for any issues you might encounter with your purchase.',
  },
];

const Faqs: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-[#111111]">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faqs;
