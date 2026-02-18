import React from 'react';
import FaqItem from './FaqItem';

const Faqs: React.FC = () => {
  const faqs = [
    {
      question: 'What is Project Bazaar?',
      answer: 'Project Bazaar is a marketplace where you can buy and sell premium project templates and code.'
    },
    {
      question: 'How do I purchase a project?',
      answer: 'Simply browse our collection, add projects to your cart, and checkout. You will receive instant access to download.'
    },
    {
      question: 'Can I sell my own projects?',
      answer: 'Yes! Sign up as a seller and start uploading your projects. We handle the payment processing.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards and PayPal.'
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faqs;
