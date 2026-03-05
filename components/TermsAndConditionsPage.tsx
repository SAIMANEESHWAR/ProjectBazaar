import React, { useEffect } from 'react';
import { useNavigation } from '../App';

const SITE_NAME = 'Project Bazaar';
const SITE_URL = 'https://projectbazaar.in';
const SUPPORT_EMAIL = 'support@projectbazaar.com';
const EFFECTIVE_DATE = 'March 5, 2026';

const TermsAndConditionsPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-gray-900 hover:text-[#ff7a00] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold">Back to {SITE_NAME}</span>
          </button>
          <button
            onClick={() => navigateTo('privacy')}
            className="text-sm text-[#ff7a00] hover:underline"
          >
            Privacy Policy
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms and Conditions</h1>
        <p className="text-gray-500 mb-10">Effective Date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {SITE_NAME} (<a href={SITE_URL} className="text-[#ff7a00] hover:underline">{SITE_URL}</a>),
              you agree to be bound by these Terms and Conditions ("Terms"), our{' '}
              <button onClick={() => navigateTo('privacy')} className="text-[#ff7a00] hover:underline">Privacy Policy</button>,
              and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
              from using or accessing the Service. These Terms apply to all visitors, users, and others who access the Service.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p>
              {SITE_NAME} is a digital marketplace platform that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Buy and sell projects, source code, and digital assets</li>
              <li>Connect with freelancers and post project requirements</li>
              <li>Submit bids on freelance projects</li>
              <li>Take mock assessments and coding challenges</li>
              <li>Build AI-powered resumes and portfolios</li>
              <li>Access career guidance, roadmaps, and placement preparation resources</li>
              <li>Discover and participate in hackathons</li>
              <li>Purchase and access educational courses</li>
            </ul>
          </section>

          {/* 3. Account Registration */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You may not transfer your account to another person</li>
              <li>One person may not maintain multiple accounts</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          {/* 4. User Roles and Responsibilities */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Roles and Responsibilities</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">4.1 Buyers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Must use purchased projects in compliance with the licensing terms specified by the seller</li>
              <li>May not resell purchased projects on {SITE_NAME} or competing platforms without explicit permission</li>
              <li>Must provide honest reviews and ratings</li>
              <li>Are responsible for verifying project suitability before purchase</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">4.2 Sellers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Must have the legal right to sell all listed projects and assets</li>
              <li>Must provide accurate descriptions, screenshots, and documentation</li>
              <li>Must not list plagiarized, stolen, or infringing content</li>
              <li>Are responsible for providing reasonable support to buyers after purchase</li>
              <li>Must comply with all applicable intellectual property laws</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">4.3 Freelancers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Must accurately represent skills, experience, and capabilities</li>
              <li>Must deliver work as described in accepted bid proposals</li>
              <li>Must communicate professionally and respond within reasonable timeframes</li>
              <li>Are responsible for meeting agreed-upon deadlines and quality standards</li>
            </ul>
          </section>

          {/* 5. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">5.1 Platform Content</h3>
            <p>
              The {SITE_NAME} platform, including its design, logos, text, graphics, and software, is the property of
              {SITE_NAME} and is protected by intellectual property laws. You may not reproduce, distribute, modify,
              or create derivative works without our prior written consent.
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">5.2 User Content</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>You retain ownership of all content you upload to the platform</li>
              <li>By uploading content, you grant {SITE_NAME} a non-exclusive, worldwide license to display, distribute, and promote your listings on the platform</li>
              <li>Upon a completed sale, intellectual property transfers according to the license type selected by the seller</li>
              <li>You are solely responsible for ensuring your uploaded content does not infringe upon any third-party rights</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">5.3 AI-Generated Content</h3>
            <p>
              Content generated using our AI-powered features (resume builder, portfolio generator, career guidance) is provided
              as-is. You own the output generated from your inputs, but {SITE_NAME} makes no warranty regarding the
              accuracy, completeness, or fitness for purpose of AI-generated content.
            </p>
          </section>

          {/* 6. Payments and Transactions */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Payments and Transactions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>All payments are processed through Razorpay, a secure third-party payment processor</li>
              <li>Prices are listed in Indian Rupees (INR) unless otherwise specified</li>
              <li>{SITE_NAME} may charge a platform fee on transactions, which will be clearly disclosed before purchase</li>
              <li>Refund requests are handled on a case-by-case basis and must be submitted within 7 days of purchase</li>
              <li>Sellers receive payouts after a hold period to allow for dispute resolution</li>
              <li>Fraudulent transactions will result in immediate account termination and may be reported to authorities</li>
            </ul>
          </section>

          {/* 7. Premium Subscriptions */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Premium Subscriptions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Premium features require an active subscription or sufficient credits</li>
              <li>Credits are non-transferable and non-refundable</li>
              <li>We reserve the right to modify premium features, pricing, and credit values with reasonable notice</li>
              <li>Unused credits do not expire as long as your account remains active</li>
            </ul>
          </section>

          {/* 8. Prohibited Activities */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Upload malicious code, viruses, or harmful software</li>
              <li>Attempt to reverse engineer, decompile, or hack the platform</li>
              <li>Use bots, scrapers, or automated tools to access the Service without authorization</li>
              <li>Engage in market manipulation, fake reviews, or bid rigging</li>
              <li>Impersonate other users or misrepresent your identity</li>
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Circumvent or manipulate the platform's fee structure</li>
              <li>Share account credentials or allow unauthorized access to your account</li>
              <li>Use the coding challenge or assessment features to cheat or gain unfair advantages in external evaluations</li>
            </ul>
          </section>

          {/* 9. Content Moderation and Reporting */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Content Moderation and Reporting</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>All project listings are subject to review and approval by our admin team</li>
              <li>We reserve the right to remove content that violates these Terms without notice</li>
              <li>Users may report inappropriate content or behavior through the platform's reporting system</li>
              <li>Reports are reviewed within 48 hours, and appropriate action is taken</li>
              <li>Repeated violations will result in account suspension or permanent ban</li>
            </ul>
          </section>

          {/* 10. Mock Assessments and Coding Challenges */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Mock Assessments and Coding Challenges</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Assessment content is provided for educational and practice purposes only</li>
              <li>Results and leaderboard positions are not guaranteed to reflect real-world performance</li>
              <li>Certificates earned through assessments are issued by {SITE_NAME} and may not be recognized by external organizations</li>
              <li>You may not share, reproduce, or distribute assessment questions or answers</li>
              <li>Code execution is handled by third-party services (Judge0), and we are not responsible for execution environment limitations</li>
            </ul>
          </section>

          {/* 11. Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. {SITE_NAME.toUpperCase()} EXPRESSLY
              DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED
              TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-2">
              We do not warrant that the Service will be uninterrupted, error-free, secure, or free of harmful components.
              We do not guarantee the accuracy, reliability, or completeness of any content on the platform, including
              user-generated content, AI-generated content, and third-party materials.
            </p>
          </section>

          {/* 12. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold mb-3">12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {SITE_NAME.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
              AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your access to, use of, or inability to use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              <li>Any transaction between users on the platform</li>
              <li>Errors or inaccuracies in AI-generated content</li>
            </ul>
            <p className="mt-2">
              Our total liability to you for all claims arising from the use of the Service shall not exceed the amount
              you have paid to {SITE_NAME} in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* 13. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {SITE_NAME}, its affiliates, and their respective officers,
              directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses
              (including reasonable legal fees) arising out of or in any way connected with your access to or use of the Service,
              your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          {/* 14. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-semibold mb-3">14. Dispute Resolution</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Between Users:</strong> Disputes between buyers and sellers or clients and freelancers should first be resolved through the platform's messaging system. If no resolution is reached, either party may submit a dispute report for mediation by our admin team</li>
              <li><strong>With the Platform:</strong> Any dispute arising from these Terms shall be resolved through binding arbitration in accordance with the laws of India, with the arbitration to be held in Hyderabad, Telangana</li>
              <li><strong>Class Action Waiver:</strong> You agree that any dispute resolution proceedings will be conducted on an individual basis and not as part of a class, consolidated, or representative action</li>
            </ul>
          </section>

          {/* 15. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold mb-3">15. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to
              its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located
              in Hyderabad, Telangana, India.
            </p>
          </section>

          {/* 16. Termination */}
          <section>
            <h2 className="text-xl font-semibold mb-3">16. Termination</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You may terminate your account at any time by contacting us at {SUPPORT_EMAIL}</li>
              <li>We may suspend or terminate your account immediately for violations of these Terms</li>
              <li>Upon termination, your right to use the Service ceases immediately</li>
              <li>Provisions that by their nature should survive termination (including intellectual property, limitation of liability, and dispute resolution) shall survive</li>
              <li>Completed transactions remain binding after account termination</li>
            </ul>
          </section>

          {/* 17. Modifications to Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-3">17. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated through a
              prominent notice on the Service or via email. Your continued use of the Service after such modifications
              constitutes acceptance of the updated Terms. We recommend reviewing these Terms periodically.
            </p>
          </section>

          {/* 18. Severability */}
          <section>
            <h2 className="text-xl font-semibold mb-3">18. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited
              or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </p>
          </section>

          {/* 19. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold mb-3">19. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul className="list-none pl-0 mt-3 space-y-1">
              <li><strong>Email:</strong>{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff7a00] hover:underline">{SUPPORT_EMAIL}</a>
              </li>
              <li><strong>Website:</strong>{' '}
                <a href={SITE_URL} className="text-[#ff7a00] hover:underline">{SITE_URL}</a>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => navigateTo('privacy')} className="hover:text-[#ff7a00] transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => navigateTo('home')} className="hover:text-[#ff7a00] transition-colors">
              Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditionsPage;
