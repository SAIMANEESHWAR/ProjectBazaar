/**
 * Content-Security-Policy fragment for Razorpay Standard Checkout.
 * Keep in sync with `vercel.json` production headers.
 */
export const RAZORPAY_CSP_DIRECTIVES = {
  scriptSrc: 'https://checkout.razorpay.com',
  connectSrc: [
    'https://checkout.razorpay.com',
    'https://api.razorpay.com',
    'https://lumberjack.razorpay.com',
  ],
  frameSrc: ["'self'", 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
  childSrc: ["'self'", 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
  formAction: ["'self'", 'https://api.razorpay.com'],
  styleSrc: 'https://checkout.razorpay.com',
} as const;
