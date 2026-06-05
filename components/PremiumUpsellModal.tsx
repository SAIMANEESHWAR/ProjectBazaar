import React, { useEffect } from 'react';
import { Crown, Sparkles, X } from 'lucide-react';
import { useNavigation } from '../App';
import { PRICING_PLANS } from '../data/pricingPlans';
import { savePendingPlan } from '../lib/pendingPlanStorage';
import premiumHeroImage from './icons/vecteezy_png-3d-render-of-a-woman-working-on-a-laptop-against_67218466.png';

interface PremiumUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const yearlyPlan = PRICING_PLANS.find((plan) => plan.id === 'yearly');

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({ isOpen, onClose }) => {
  const { navigateTo } = useNavigation();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    savePendingPlan('yearly');
    onClose();
    navigateTo('subscriptionCheckout');
  };

  const priceLabel = yearlyPlan
    ? `₹${yearlyPlan.priceInr}${yearlyPlan.periodLabel}`
    : '₹699/year';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 sm:p-6 animate-dashboard-toast-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-upsell-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[920px] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-between px-7 py-8 sm:px-10 sm:py-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#FF6B00]">
                <Crown className="h-3.5 w-3.5" aria-hidden />
                Premium
              </div>

              <h2 id="premium-upsell-title" className="text-3xl font-bold leading-tight text-[#FF6B00] sm:text-4xl">
                Unlock Premium Access
              </h2>
              <p className="mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                on your career journey
              </p>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
                Get Job Hunt alerts, live AI mock interviews, ATS scoring, coding prep, resume builder,
                and the full interview stack — starting at {priceLabel}.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-gray-700">
                {['Live AI interviews', 'ATS resume scoring', 'Job Hunt + prep mode', 'Resume builder'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-[#FF6B00]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleUpgrade}
                className="w-full rounded-full bg-gradient-to-r from-[#ff7a1a] to-[#FF6B00] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_30px_rgba(255,107,0,0.28)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Upgrade &amp; Unlock
              </button>
              <p className="mt-4 text-xs leading-relaxed text-gray-400">
                Cancel anytime from Settings. Premium unlocks advanced career tools across your dashboard.
              </p>
            </div>
          </div>

          <div className="relative min-h-[240px] bg-gradient-to-br from-[#fff4eb] via-[#ffe8d6] to-[#ffd2ad] md:min-h-full">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close premium offer"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-colors hover:bg-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex h-full items-end justify-center p-6 pt-14 sm:p-8">
              <img
                src={premiumHeroImage}
                alt="Professional working on laptop"
                className="max-h-[320px] w-full max-w-[360px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpsellModal;
