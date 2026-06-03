declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const LOG_PREFIX = '[Razorpay]';

let scriptPromise: Promise<void> | null = null;

export type RazorpayScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

let scriptStatus: RazorpayScriptStatus = 'idle';
let scriptError: string | null = null;

export function getRazorpayScriptStatus(): { status: RazorpayScriptStatus; error: string | null } {
  return { status: scriptStatus, error: scriptError };
}

export function logRazorpayError(phase: string, detail: unknown): void {
  // eslint-disable-next-line no-console -- intentional payment diagnostics
  console.error(LOG_PREFIX, phase, detail);
}

/** Razorpay modal must run on the top-level page, not inside an iframe. */
export function assertNotInIframe(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.self !== window.top) {
      throw new Error(
        'Payment cannot open inside a frame. Open this page directly in your browser tab.'
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('frame')) throw e;
    throw new Error(
      'Payment cannot open in this embedded context. Open the site in a full browser tab.'
    );
  }
}

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay is only available in the browser'));
  }
  if (window.Razorpay) {
    scriptStatus = 'ready';
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptStatus = 'loading';
  scriptError = null;

  scriptPromise = new Promise((resolve, reject) => {
    const finishReady = () => {
      if (window.Razorpay) {
        scriptStatus = 'ready';
        resolve();
        return true;
      }
      return false;
    };

    const fail = (message: string) => {
      scriptStatus = 'error';
      scriptError = message;
      scriptPromise = null;
      logRazorpayError('script_load_failed', message);
      reject(new Error(message));
    };

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => {
        if (!finishReady()) fail('Razorpay checkout script loaded but Razorpay is undefined');
      });
      existing.addEventListener('error', () =>
        fail('Failed to load Razorpay checkout (blocked by network, CSP, or ad blocker)')
      );
      if (finishReady()) return;
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!finishReady()) fail('Razorpay checkout script loaded but Razorpay is undefined');
    };
    script.onerror = () =>
      fail(
        'Failed to load Razorpay checkout. Disable ad blockers for this site or try another browser.'
      );
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function waitForRazorpay(): Promise<void> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!window.Razorpay) {
    const msg =
      'Razorpay checkout is not available. Refresh the page, allow checkout.razorpay.com, and disable ad blockers.';
    logRazorpayError('sdk_unavailable', msg);
    throw new Error(msg);
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
  assertNotInIframe();

  if (!params.key?.trim()) {
    logRazorpayError('init_missing_key', params);
    throw new Error('Razorpay key is missing. Check server configuration (RAZORPAY_KEY_ID).');
  }
  if (!params.orderId?.trim()) {
    logRazorpayError('init_missing_order_id', params);
    throw new Error('Payment order ID is missing. Try again.');
  }
  if (!params.amount || params.amount < 100) {
    logRazorpayError('init_invalid_amount', { amount: params.amount });
    throw new Error('Invalid payment amount from server.');
  }

  if (params.key === 'rzp_test_demo') {
    throw new Error('Razorpay is not configured on the server. Use test mode or add API keys.');
  }

  if (!window.isSecureContext) {
    const host = window.location.hostname;
    const isLocalDev = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalDev) {
      logRazorpayError('insecure_context', location.href);
      throw new Error('Payments require HTTPS. Open this site over a secure connection.');
    }
  }

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
      escape: true,
      backdropclose: false,
    },
    retry: { enabled: true, max_count: 4 },
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (response: unknown) => {
      const failed = response as { error?: { description?: string; reason?: string } };
      const message =
        failed.error?.description || failed.error?.reason || 'Payment failed. Please try again.';
      logRazorpayError('payment_failed', response);
      params.onFailed?.(message);
    });
    razorpay.open();
  } catch (err) {
    logRazorpayError('open_failed', err);
    throw err instanceof Error ? err : new Error('Could not open Razorpay checkout.');
  }
}
