import React, { useEffect } from 'react';
import { useNavigation } from '../App';
import { SITE_ORIGIN } from '@/lib/apiConfig';

const SITE_NAME = 'CodeXCareer';
const SITE_URL = SITE_ORIGIN;
const SUPPORT_EMAIL = 'support@projectbazaar.com';
const GRIEVANCE_EMAIL = 'grievance@projectbazaar.com';
const EFFECTIVE_DATE = 'March 5, 2026';

const PrivacyPolicyPage: React.FC = () => {
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
            onClick={() => navigateTo('terms')}
            className="text-sm text-[#ff7a00] hover:underline"
          >
            Terms &amp; Conditions
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Effective Date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Welcome to {SITE_NAME} (<strong>"{SITE_NAME}"</strong>, "we", "us", or "our"). We operate the website at{' '}
              <a href={SITE_URL} className="text-[#ff7a00] hover:underline">{SITE_URL}</a> (the "Service").
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit
              our website and use our services. Please read this Privacy Policy carefully. By using the Service, you
              agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Personal Information You Provide</h3>
            <p>When you register for an account, use our services, or interact with our platform, we may collect:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Account Information:</strong> Full name, email address, phone number, and password</li>
              <li><strong>Profile Information:</strong> Profile picture, LinkedIn URL, GitHub URL, location, skills, hourly rate, and biographical details</li>
              <li><strong>Project Information:</strong> Project titles, descriptions, files, source code, documentation, and pricing details that you upload or list on the marketplace</li>
              <li><strong>Financial Information:</strong> Payment details processed through Razorpay (we do not store full card numbers on our servers)</li>
              <li><strong>Communication Data:</strong> Messages exchanged between users, freelancer interactions, bid proposals, and reviews</li>
              <li><strong>Resume and Portfolio Data:</strong> Education history, work experience, certifications, skills, and other resume content you provide to our resume builder and portfolio generator</li>
              <li><strong>Assessment Data:</strong> Mock assessment responses, coding challenge submissions, test scores, and progress tracking</li>
              <li><strong>Career Data:</strong> Career guidance progress, roadmap completions, and certificate information</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <p>When you access our Service, we automatically collect certain information:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns, and navigation paths</li>
              <li><strong>Error and Performance Data:</strong> Application errors, performance metrics, and crash reports collected via Sentry</li>
              <li><strong>Connection Data:</strong> IP address, referring URL, and access timestamps</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.3 Third-Party API Keys</h3>
            <p>
              If you choose to provide your own API keys for AI-powered features (such as OpenAI or Google Gemini keys),
              these are stored in encrypted form in our database and are used solely to provide the requested AI services
              on your behalf. You may delete your API keys at any time through your account settings.
            </p>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Service Delivery:</strong> To create and manage your account, facilitate marketplace transactions, process bids, and enable communication between buyers, sellers, and freelancers</li>
              <li><strong>Feature Provision:</strong> To provide mock assessments, coding challenges, resume building, portfolio generation, career guidance, and other platform features</li>
              <li><strong>Payment Processing:</strong> To process purchases, manage subscriptions, and handle refunds through our payment partner Razorpay</li>
              <li><strong>Real-Time Communication:</strong> To deliver instant messages, notifications, and invitations via our WebSocket-based messaging system</li>
              <li><strong>Platform Improvement:</strong> To analyze usage patterns, fix bugs, improve performance, and develop new features</li>
              <li><strong>Error Monitoring:</strong> To track and resolve application errors using Sentry to ensure service reliability</li>
              <li><strong>Security:</strong> To detect, prevent, and respond to fraud, abuse, and security incidents</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
            </ul>
          </section>

          {/* 4. Data Storage and Handling */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage and Handling</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">4.1 Where We Store Data</h3>
            <p>
              Your data is stored on Amazon Web Services (AWS) infrastructure, primarily in the <strong>ap-south-2 (Hyderabad)</strong> region.
              We use the following AWS services:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Amazon DynamoDB:</strong> For storing user accounts, projects, bids, messages, assessments, and all application data</li>
              <li><strong>Amazon S3:</strong> For storing uploaded files, profile images, and project assets</li>
              <li><strong>AWS Lambda:</strong> For serverless API processing (data is processed but not persistently stored at this layer)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">4.2 Data Retention</h3>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Account data is retained for as long as your account is active</li>
              <li>If you delete your account, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., completed transaction records)</li>
              <li>Assessment results and certificates are retained for verification purposes even after account deletion, but are anonymized</li>
              <li>Chat messages are retained for 12 months after the last interaction between parties</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">4.3 Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your data, including encrypted connections (HTTPS/TLS),
              secure storage practices, access controls, and regular security reviews. However, no method of electronic
              transmission or storage is 100% secure. While we strive to use commercially acceptable means to protect
              your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 5. Cookies and Local Storage */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies and Local Storage</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">5.1 What We Use</h3>
            <p>Our Service uses the following browser storage technologies:</p>

            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Technology</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">localStorage (authSession)</td>
                    <td className="border border-gray-200 px-4 py-2">Maintains your login session</td>
                    <td className="border border-gray-200 px-4 py-2">Strictly Necessary</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">localStorage (userData)</td>
                    <td className="border border-gray-200 px-4 py-2">Stores user profile data for the session</td>
                    <td className="border border-gray-200 px-4 py-2">Strictly Necessary</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">localStorage (landingTheme)</td>
                    <td className="border border-gray-200 px-4 py-2">Remembers your dark/light mode preference</td>
                    <td className="border border-gray-200 px-4 py-2">Functional</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">localStorage (isPremium, premiumCredits)</td>
                    <td className="border border-gray-200 px-4 py-2">Tracks premium subscription status</td>
                    <td className="border border-gray-200 px-4 py-2">Strictly Necessary</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Sentry cookies</td>
                    <td className="border border-gray-200 px-4 py-2">Error monitoring and performance tracking</td>
                    <td className="border border-gray-200 px-4 py-2">Analytics</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Socket.IO cookies</td>
                    <td className="border border-gray-200 px-4 py-2">Real-time messaging session management</td>
                    <td className="border border-gray-200 px-4 py-2">Functional</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Razorpay cookies</td>
                    <td className="border border-gray-200 px-4 py-2">Payment processing and fraud prevention</td>
                    <td className="border border-gray-200 px-4 py-2">Strictly Necessary</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mt-4 mb-2">5.2 Managing Cookies</h3>
            <p>
              You can control and manage cookies through your browser settings. Please note that disabling
              strictly necessary cookies may affect the functionality of the Service. You can also use the cookie
              preferences banner that appears when you first visit our site to manage your consent.
            </p>
          </section>

          {/* 6. Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Third-Party Services</h2>
            <p>We share data with the following third-party service providers, each governed by their own privacy policies:</p>

            <div className="overflow-x-auto mt-3">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Service</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold">Data Shared</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Amazon Web Services (AWS)</td>
                    <td className="border border-gray-200 px-4 py-2">Cloud infrastructure and data storage</td>
                    <td className="border border-gray-200 px-4 py-2">All platform data</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Sentry</td>
                    <td className="border border-gray-200 px-4 py-2">Error monitoring and performance tracking</td>
                    <td className="border border-gray-200 px-4 py-2">Error logs, device info, user actions leading to errors</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Razorpay</td>
                    <td className="border border-gray-200 px-4 py-2">Payment processing</td>
                    <td className="border border-gray-200 px-4 py-2">Payment details, transaction amounts, user identity for payments</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Judge0</td>
                    <td className="border border-gray-200 px-4 py-2">Code execution for assessments</td>
                    <td className="border border-gray-200 px-4 py-2">Source code submissions</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">OpenAI / Google Gemini</td>
                    <td className="border border-gray-200 px-4 py-2">AI-powered features (resume, portfolio, guidance)</td>
                    <td className="border border-gray-200 px-4 py-2">Content provided by user for AI processing</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">Vercel</td>
                    <td className="border border-gray-200 px-4 py-2">Frontend hosting and CDN</td>
                    <td className="border border-gray-200 px-4 py-2">Access logs, IP addresses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Data Sharing and Disclosure */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal data. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>With Other Users:</strong> Your public profile, project listings, freelancer profile, and reviews are visible to other platform users</li>
              <li><strong>For Transactions:</strong> When you engage in marketplace transactions, relevant information is shared between buyer, seller, or freelancer parties as needed</li>
              <li><strong>Service Providers:</strong> With third-party providers who assist us in operating the platform (listed in Section 6)</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or enforceable governmental request</li>
              <li><strong>Safety and Rights:</strong> To protect the rights, property, or safety of {SITE_NAME}, our users, or the public</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your data may be transferred as part of the transaction</li>
            </ul>
          </section>

          {/* 8. Your Rights Under DPDPA (India) */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Your Rights as a Data Principal (DPDPA, India)</h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023 (DPDPA), {SITE_NAME} acts as a <strong>Data Fiduciary</strong> and
              you, the user, are a <strong>Data Principal</strong>. As a Data Principal, you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Right to Access:</strong> You may request a summary of your personal data being processed and the processing activities undertaken</li>
              <li><strong>Right to Correction and Erasure:</strong> You may request correction of inaccurate or misleading data, completion of incomplete data, updating of outdated data, and erasure of data no longer necessary for the purpose it was collected</li>
              <li><strong>Right to Data Deletion:</strong> You may request complete deletion of your account and all associated personal data. Upon such request, we will delete your data within 30 days, except where retention is required by law. To delete your account, email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff7a00] hover:underline">{SUPPORT_EMAIL}</a> with the subject "Account Deletion Request"</li>
              <li><strong>Right to Withdraw Consent:</strong> You may withdraw your consent for data processing at any time. To withdraw consent, email{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff7a00] hover:underline">{SUPPORT_EMAIL}</a> or adjust your cookie preferences via the banner at the bottom of our site. Withdrawal of consent does not affect the lawfulness of processing done prior to withdrawal</li>
              <li><strong>Right to Nominate:</strong> You may nominate another individual to exercise your rights on your behalf in the event of your death or incapacity</li>
              <li><strong>Right to Grievance Redressal:</strong> You may lodge a complaint with our Grievance Officer (details in Section 14 below) or with the Data Protection Board of India</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff7a00] hover:underline">{SUPPORT_EMAIL}</a>.
              We will acknowledge your request within 48 hours and fulfill it within 30 days.
            </p>
          </section>

          {/* 9. Consent */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Consent and Lawful Basis</h2>
            <p>We process your personal data based on the following lawful grounds under DPDPA:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Consent:</strong> You provide explicit consent when creating an account, uploading content, making purchases, or enabling optional features like analytics cookies</li>
              <li><strong>Legitimate Uses:</strong> Certain processing is necessary for the performance of the Service (e.g., processing payments, delivering purchased projects, facilitating communications between users)</li>
              <li><strong>Legal Obligation:</strong> We may process data to comply with applicable Indian laws and regulations</li>
            </ul>
            <p className="mt-3">
              You may withdraw consent at any time by contacting us or using the cookie preferences. Note that withdrawing
              consent for essential processing may result in inability to use certain features of the Service.
            </p>
          </section>

          {/* 10. Data Breach Notification */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Data Breach Notification</h2>
            <p>
              In the event of a personal data breach that is likely to cause harm to Data Principals,
              {SITE_NAME} will:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Notify the <strong>Data Protection Board of India</strong> within <strong>72 hours</strong> of becoming aware of the breach</li>
              <li>Notify affected <strong>Data Principals (users)</strong> without unreasonable delay via email and prominent notice on the Service</li>
              <li>Provide details of the nature of the breach, data affected, and remedial measures taken</li>
              <li>Take immediate steps to contain the breach and mitigate harm</li>
            </ul>
          </section>

          {/* 11. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold mb-3">11. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect
              personal information from children. Under DPDPA, processing of a child's personal data requires
              verifiable consent from a parent or lawful guardian. If you are a parent or guardian and believe your child
              has provided us with personal data, please contact us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff7a00] hover:underline">{SUPPORT_EMAIL}</a>,
              and we will take steps to delete such information within 72 hours.
            </p>
          </section>

          {/* 12. International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold mb-3">12. International Data Transfers</h2>
            <p>
              Your data is primarily stored in India (AWS ap-south-2, Hyderabad). Some data may be transferred to and
              processed in other countries through our third-party service providers (e.g., Sentry in the US, Vercel CDN globally).
              We ensure that appropriate safeguards are in place in accordance with DPDPA and do not transfer data to
              countries restricted by the Central Government of India.
            </p>
          </section>

          {/* 13. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold mb-3">13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
              the new Privacy Policy on this page, updating the "Effective Date" at the top, and sending an email
              notification to registered users. We encourage you to review this Privacy Policy periodically.
              Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 14. Grievance Officer */}
          <section>
            <h2 className="text-xl font-semibold mb-3">14. Grievance Officer</h2>
            <p>
              In accordance with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000,
              the following Grievance Officer has been appointed to address your concerns regarding data processing:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900">Grievance Officer</p>
              <p className="text-gray-700 mt-1">{SITE_NAME}</p>
              <p className="text-gray-700">
                Email:{' '}
                <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-[#ff7a00] hover:underline">{GRIEVANCE_EMAIL}</a>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Response time: We will acknowledge your grievance within <strong>48 hours</strong> and resolve it
                within <strong>30 days</strong> from the date of receipt.
              </p>
            </div>
            <p className="mt-3">
              If you are not satisfied with our response, you may escalate your complaint to the
              <strong> Data Protection Board of India</strong> as constituted under the DPDPA, 2023.
            </p>
          </section>

          {/* 15. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold mb-3">15. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none pl-0 mt-3 space-y-1">
              <li><strong>General Inquiries:</strong>{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#ff7a00] hover:underline">{SUPPORT_EMAIL}</a>
              </li>
              <li><strong>Privacy &amp; Grievances:</strong>{' '}
                <a href={`mailto:${GRIEVANCE_EMAIL}`} className="text-[#ff7a00] hover:underline">{GRIEVANCE_EMAIL}</a>
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
            <button onClick={() => navigateTo('terms')} className="hover:text-[#ff7a00] transition-colors">
              Terms &amp; Conditions
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

export default PrivacyPolicyPage;
