import React, { ReactNode } from 'react';
import {
  CODEXCAREER_BRAND_NAME,
  CODEXCAREER_LOGO_SRC,
  CODEXCAREER_SUPPORT_EMAIL,
  CODEXCAREER_TAGLINE,
} from '../lib/brandAssets';

type EmailVerificationShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerNote?: string;
};

const EmailVerificationShell: React.FC<EmailVerificationShellProps> = ({
  title,
  subtitle,
  children,
  footerNote,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={CODEXCAREER_LOGO_SRC}
            alt={`${CODEXCAREER_BRAND_NAME} logo`}
            className="h-16 sm:h-20 w-auto object-contain"
          />
          <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-orange-600 uppercase">
            {CODEXCAREER_TAGLINE}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-[0_20px_60px_rgba(255,107,0,0.12)]">
          <div className="border-b border-orange-50 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-center text-white">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-orange-50">{subtitle}</p>
          </div>

          <div className="px-6 py-7 sm:px-8">{children}</div>

          <div className="border-t border-orange-50 bg-orange-50/60 px-6 py-4 text-center">
            <p className="text-xs text-gray-500">
              {footerNote || 'This is an automated message. Please do not reply.'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Need help?{' '}
              <a href={`mailto:${CODEXCAREER_SUPPORT_EMAIL}`} className="font-medium text-orange-600 hover:text-orange-700">
                {CODEXCAREER_SUPPORT_EMAIL}
              </a>
            </p>
            <p className="mt-3 text-[11px] font-medium tracking-wide text-gray-400">
              © {new Date().getFullYear()} {CODEXCAREER_BRAND_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationShell;
