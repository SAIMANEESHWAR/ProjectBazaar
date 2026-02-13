import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import type { BuyerProject } from './BuyerProjectCard';
import BuyerProjectCard from './BuyerProjectCard';
import noShoppingCartAnimation from '../lottiefiles/no_shopping_cart.json';
import { useCart } from './DashboardPage';
import { useAuth } from '../App';
import { createPaymentIntent } from '../services/buyerApi';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartPageProps {
  allProjects: BuyerProject[];
  onViewDetails?: (project: BuyerProject) => void;
}

const CartPage: React.FC<CartPageProps> = ({ allProjects, onViewDetails }) => {
  const { userId, userEmail } = useAuth();
  const { cart, removeFromCart, isLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  const cartProjects = allProjects.filter(project => cart.includes(project.id));
  const totalPrice = cartProjects.reduce((sum, project) => sum + project.price, 0);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-500 text-lg font-medium">Loading cart...</p>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!userId || cartProjects.length === 0) return;

    setIsProcessing(true);
    setCheckoutError(null);
    setCheckoutSuccess(false);

    try {
      // Step 1: Create payment intent via API
      const paymentIntentResponse = await createPaymentIntent({
        userId: userId,
        projectIds: cartProjects.map(p => p.id),
        totalAmount: totalPrice,
        currency: 'INR',
      });

      // Validate response - must have success, razorpayOrderId, amount, and key
      if (!paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.error || 'Failed to create payment order');
      }

      if (!paymentIntentResponse.razorpayOrderId) {
        throw new Error('Razorpay order ID not received from server');
      }

      if (!paymentIntentResponse.amount) {
        throw new Error('Payment amount not received from server');
      }

      if (!paymentIntentResponse.key) {
        throw new Error('Razorpay key not received from server');
      }

      // Step 2: Wait for Razorpay script to load
      if (!window.Razorpay) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!window.Razorpay) {
          throw new Error('Razorpay checkout is not available. Please refresh the page.');
        }
      }

      // Step 3: Initialize Razorpay checkout with correct razorpayOrderId
      const options = {
        key: paymentIntentResponse.key, // Razorpay key ID (required)
        amount: paymentIntentResponse.amount, // Amount in paise (required)
        currency: paymentIntentResponse.currency || 'INR', // Currency (required)
        name: paymentIntentResponse.name || 'Project Bazaar', // Business name
        description: paymentIntentResponse.description || `Purchase of ${cartProjects.length} project(s)`, // Order description
        order_id: paymentIntentResponse.razorpayOrderId, // IMPORTANT: Use razorpayOrderId, NOT orderId
        handler: function (response: any) {
          // Payment successful - webhook will handle DB updates
          console.log('Payment successful:', response);
          setCheckoutSuccess(true);
          setCheckoutError(null);
          setIsProcessing(false);
          
          // Reload after 2 seconds to refresh data (webhook should have updated by then)
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        prefill: {
          email: userEmail || paymentIntentResponse.prefill?.email || '',
          contact: paymentIntentResponse.prefill?.contact || '',
        },
        theme: {
          color: '#f97316', // Orange color matching your theme
        },
        modal: {
          ondismiss: function() {
            // User closed the payment modal
            setIsProcessing(false);
            setCheckoutError(null);
          },
        },
        retry: {
          enabled: true,
          max_count: 4,
        },
      };

      // Step 4: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        // Payment failed
        console.error('Payment failed:', response.error);
        setCheckoutError(response.error.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });

      razorpay.open();
      
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error instanceof Error ? error.message : 'An error occurred during checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (cartProjects.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
        <div className="mx-auto mb-4 w-full max-w-[380px] h-[280px] flex items-center justify-center">
          <Lottie
            animationData={noShoppingCartAnimation}
            loop
            className="w-full h-full"
          />
        </div>
        <p className="text-gray-500 text-lg font-medium">Your cart is empty</p>
        <p className="text-gray-400 text-sm mt-2">Start adding projects to your cart!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        {/* <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2> */}
        <span className="text-gray-600">{cartProjects.length} {cartProjects.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartProjects.map((project) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <BuyerProjectCard
                project={project}
                onViewDetails={onViewDetails}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => removeFromCart(project.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove from Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({cartProjects.length} items)</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing Fee</span>
                <span>₹0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-orange-600">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {checkoutSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium text-center">
                  ✓ Purchase successful! Redirecting...
                </p>
              </div>
            )}

            {checkoutError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium text-center">
                  {checkoutError}
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={isProcessing || cartProjects.length === 0}
              className={`w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                isProcessing || cartProjects.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:from-orange-600 hover:to-orange-700'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Proceed to Checkout'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure checkout with encrypted payment processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
