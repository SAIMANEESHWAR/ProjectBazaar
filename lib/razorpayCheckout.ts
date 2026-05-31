declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      if (window.Razorpay) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function waitForRazorpay(): Promise<void> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!window.Razorpay) {
    throw new Error('Razorpay checkout is not available. Please refresh and try again.');
  }
}

export interface OpenRazorpayCheckoutParams {
  key: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  orderId: string;
  prefill?: { email?: string; contact?: string; name?: string };
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  onDismiss?: () => void;
  onFailed?: (message: string) => void;
}

export async function openRazorpayCheckout(params: OpenRazorpayCheckoutParams): Promise<void> {
  await waitForRazorpay();

  const options = {
    key: params.key,
    amount: params.amount,
    currency: params.currency || 'INR',
    name: params.name || 'CodeXCareer',
    description: params.description,
    order_id: params.orderId,
    prefill: params.prefill,
    theme: { color: '#f97316' },
    handler: (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      void params.onSuccess(response);
    },
    modal: {
      ondismiss: () => params.onDismiss?.(),
    },
    retry: { enabled: true, max_count: 4 },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.on('payment.failed', (response: unknown) => {
    const failed = response as { error?: { description?: string } };
    params.onFailed?.(failed.error?.description || 'Payment failed. Please try again.');
  });
  razorpay.open();
}
