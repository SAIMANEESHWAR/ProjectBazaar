import React, { useState, ChangeEvent, FormEvent, ReactNode, useEffect } from 'react';
import { useNavigation, useAuth } from '../App';
import { decodeJwtPayload } from '@/lib/jwt';
import { getCognitoConfigError, isOtpAuthEnabled, requestOtpCode, verifyOtpCode } from '@/lib/cognitoOtpAuth';
import { setAuthSession } from '@/lib/authSession';
import { bootstrapCognitoUser } from '@/services/userBootstrap';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '@/components/ui/modern-animated-sign-in';

type FieldType = 'text' | 'email' | 'password';

const API_ENDPOINT =
  import.meta.env.VITE_LEGACY_AUTH_ENDPOINT ??
  'https://xlxus7dr78.execute-api.ap-south-2.amazonaws.com/User_login_signup';

type AuthMode = 'login' | 'signup';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    email: string;
    role: 'user' | 'admin';
    isPremium?: boolean;
    credits?: number;
    status?: string;
    profilePictureUrl?: string | null;
  };
  error?: {
    code: string;
    message: string;
    blockedUntil?: string;
    deletedUntil?: string;
  };
}

type OtpStage = 'request' | 'verify';

interface OrbitIcon {
  component: () => ReactNode;
  className: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
}

const iconsArray: OrbitIcon[] = [
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg'
        alt='HTML5'
      />
    ),
    className: 'size-[20px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg'
        alt='CSS3'
      />
    ),
    className: 'size-[20px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg'
        alt='TypeScript'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg'
        alt='JavaScript'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg'
        alt='TailwindCSS'
      />
    ),
    className: 'size-[20px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg'
        alt='Nextjs'
      />
    ),
    className: 'size-[20px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg'
        alt='React'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg'
        alt='Figma'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    delay: 60,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <img
        width={50}
        height={50}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg'
        alt='Git'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    radius: 320,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
];

// Password strength validation
interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'lowercase', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'One special character', test: (p) => /[@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,./]/.test(p) },
];


const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;

  // Only show requirements that are NOT met
  const unmetRequirements = passwordRequirements.filter((req) => !req.test(password));

  if (unmetRequirements.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {unmetRequirements.map((req) => (
        <p key={req.id} className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {req.label}
        </p>
      ))}
    </div>
  );
};

const AuthPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { login } = useAuth();
  const otpEnabled = isOtpAuthEnabled();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    otpCode: '',
  });
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStage, setOtpStage] = useState<OtpStage>('request');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const isLogin = authMode === 'login';

  // Clear error when switching between login and signup
  useEffect(() => {
    setError(null);
    setOtpMessage(null);
    setOtpStage('request');
  }, [authMode]);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup',
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        // Signup successful, now login the user
        await handleLoginAfterSignup();
      } else {
        setError(data.error?.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const userRole = data.data.role === 'admin' ? 'admin' : 'user';

        localStorage.setItem('userData', JSON.stringify(data.data));

        login(data.data.userId, data.data.email, userRole);
      } else {
        setError(data.error?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAfterSignup = async () => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const userRole = data.data.role === 'admin' ? 'admin' : 'user';

        localStorage.setItem('userData', JSON.stringify(data.data));

        login(data.data.userId, data.data.email, userRole);
      }
    } catch (err) {
      console.error('Auto-login after signup error:', err);
      setError('Account created but login failed. Please try logging in manually.');
    }
  };

  const getOtpChannel = (): 'email' | 'sms' => (authMode === 'login' ? 'email' : 'sms');
  const getOtpIdentifier = () => (authMode === 'login' ? formData.email : formData.phoneNumber);

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    setOtpMessage(null);
    try {
      const channel = getOtpChannel();
      const identifier = getOtpIdentifier().trim();
      const configError = getCognitoConfigError();
      if (configError) {
        setError(`${configError}. Configure OTP env vars and restart dev server.`);
        return;
      }
      if (!identifier) {
        setError(channel === 'email' ? 'Email is required.' : 'Phone number is required.');
        return;
      }
      await requestOtpCode(channel, identifier);
      setOtpStage('verify');
      setOtpMessage(channel === 'email' ? 'OTP sent to your email.' : 'OTP sent to your phone via SMS.');
    } catch (err) {
      console.error('OTP send error:', err);
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Unable to send OTP right now. Please retry in a few minutes.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    setOtpMessage(null);
    try {
      if (!formData.otpCode.trim()) {
        setError('Please enter OTP code.');
        return;
      }

      const out = await verifyOtpCode(formData.otpCode);
      if (!out.success) {
        setError('Additional challenge is required. Please request OTP again.');
        return;
      }

      const payload = out.idToken ? decodeJwtPayload(out.idToken) : null;
      const boot = await bootstrapCognitoUser();
      const userId = String(
        boot?.userId ||
          payload?.sub ||
          payload?.email ||
          payload?.phone_number ||
          getOtpIdentifier()
      );
      const email = String(
        boot?.email ||
          payload?.email ||
          formData.email ||
          `${userId}@projectbazaar.local`
      );
      const role =
        boot?.role ||
        (payload?.['custom:role'] === 'admin' ? 'admin' : 'user');
      const userData = {
        userId,
        email,
        role,
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      setAuthSession('cognito', {
        idToken: out.idToken,
        accessToken: out.accessToken,
      });
      login(userId, email, role, 'cognito');
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Invalid or expired OTP. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setOtpMessage(null);

    if (otpEnabled) {
      if (otpStage === 'request') {
        await handleSendOtp();
      } else {
        await handleVerifyOtp();
      }
      return;
    }

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Please fill in all required fields.');
        return;
      }
      await handleLogin();
    } else {
      if (!formData.email || !formData.phoneNumber || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      await handleSignup();
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof typeof formData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const toggleAuthMode = () => {
    setAuthMode(isLogin ? 'signup' : 'login');
    setError(null);
    setOtpMessage(null);
    setOtpStage('request');
    // Clear form fields when switching modes
    setFormData({
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      otpCode: '',
    });
  };

  const otpRequestFields: Array<{
    label: string;
    required: boolean;
    type: FieldType;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    helperComponent?: ReactNode;
  }> = [
      isLogin
        ? {
          label: 'Email',
          required: true,
          type: 'email',
          placeholder: 'Enter your email address',
          onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'email'),
        }
        : {
          label: 'PhoneNumber',
          required: true,
          type: 'text',
          placeholder: 'Enter phone number in E.164 (e.g., +919876543210)',
          onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'phoneNumber'),
        },
    ];

  const otpVerifyFields: Array<{
    label: string;
    required: boolean;
    type: FieldType;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    helperComponent?: ReactNode;
  }> = [
      {
        label: 'OTPCode',
        required: true,
        type: 'text',
        placeholder: 'Enter the 6-digit OTP',
        onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'otpCode'),
      },
    ];

  const loginFields: Array<{
    label: string;
    required: boolean;
    type: FieldType;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    helperComponent?: ReactNode;
  }> = [
      {
        label: 'Email',
        required: true,
        type: 'email',
        placeholder: 'Enter your email address',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password',
        placeholder: 'Enter your password',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ];

  const signupFields: Array<{
    label: string;
    required: boolean;
    type: FieldType;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    helperComponent?: ReactNode;
  }> = [
      {
        label: 'Email',
        required: true,
        type: 'email',
        placeholder: 'Enter your email address',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'PhoneNumber',
        required: true,
        type: 'text',
        placeholder: 'Enter your phone number',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'phoneNumber'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password',
        placeholder: 'Enter your password',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
        helperComponent: <PasswordStrengthIndicator password={formData.password} />,
      },
      {
        label: 'ConfirmPassword',
        required: true,
        type: 'password',
        placeholder: 'Confirm your password',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'confirmPassword'),
        helperComponent: <PasswordStrengthIndicator password={formData.confirmPassword} />,
      },
    ];

  const formFields = otpEnabled
    ? {
      header: isLogin ? 'Email OTP Sign in' : 'SMS OTP Sign in',
      subHeader:
        otpStage === 'request'
          ? isLogin
            ? 'Enter your email and we will send an OTP'
            : 'Enter your phone number and we will send an OTP via SMS'
          : 'Enter the OTP code to continue',
      fields: otpStage === 'request' ? otpRequestFields : otpVerifyFields,
      submitButton: otpStage === 'request' ? 'Send OTP' : 'Verify OTP',
    }
    : {
      header: isLogin ? 'Welcome back' : 'Create an account',
      subHeader: isLogin ? 'Sign in to your account' : 'Sign up to get started',
      fields: isLogin ? loginFields : signupFields,
      submitButton: isLogin ? 'Sign in' : 'Sign up',
    };

  return (
    <section className='flex max-lg:justify-center h-screen overflow-hidden relative bg-black'>
      {/* Left Side - Animation */}
      <span className='hidden lg:flex flex-col justify-center w-1/2 relative z-10 h-full'>
        {/* Container with both Ripple and Text centered at same point */}
        <div className='relative w-full h-full flex items-center justify-center'>
          {/* Background Ripple Animation - Centered behind text */}
          <div className='absolute w-full h-full flex items-center justify-center pointer-events-none z-0'>
            <div className='relative w-full max-w-2xl h-full flex items-center justify-center'>
              <Ripple
                mainCircleSize={100}
                mainCircleOpacity={0.24}
                numCircles={11}
                className='!max-w-full'
              />
            </div>
          </div>
          {/* Text and Icons - Above the animation, same center point */}
          <div className='relative z-10 w-full h-full flex items-center justify-center'>
            <TechOrbitDisplay iconsArray={iconsArray} text={isLogin ? 'Welcome Back' : 'Get Started'} />
          </div>
        </div>
      </span>

      {/* Right Side - Form */}
      <span className={`w-full lg:w-1/2 h-full flex flex-col justify-center items-center max-lg:px-4 sm:px-6 md:px-8 py-2 sm:py-4 relative z-10 overflow-hidden`}>
        <button
          onClick={() => navigateTo('home')}
          className='absolute top-3 sm:top-4 left-3 sm:left-4 text-sm text-gray-400 hover:text-blue-400 flex items-center gap-1 z-20'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
          Back to Home
        </button>

        <div className='w-full max-w-md flex flex-col items-center px-2 sm:px-0 max-h-full overflow-hidden'>
          {otpEnabled && (
            <div className='w-full mb-3 grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => {
                  setAuthMode('login');
                  setOtpStage('request');
                  setError(null);
                  setOtpMessage(null);
                  setFormData((prev) => ({ ...prev, otpCode: '' }));
                }}
                className={`h-10 rounded-md border text-sm transition-colors ${
                  authMode === 'login'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-black/40 border-gray-700 text-gray-300 hover:bg-black/60'
                }`}
              >
                Email OTP
              </button>
              <button
                type='button'
                onClick={() => {
                  setAuthMode('signup');
                  setOtpStage('request');
                  setError(null);
                  setOtpMessage(null);
                  setFormData((prev) => ({ ...prev, otpCode: '' }));
                }}
                className={`h-10 rounded-md border text-sm transition-colors ${
                  authMode === 'signup'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-black/40 border-gray-700 text-gray-300 hover:bg-black/60'
                }`}
              >
                SMS OTP
              </button>
            </div>
          )}
          <div className='w-full flex-shrink-0' key={authMode}>
            <AuthTabs
              formFields={formFields}
              goTo={() => { }}
              handleSubmit={handleSubmit}
              accountToggleText={
                otpEnabled
                  ? undefined
                  : isLogin
                    ? "Don't have an account yet? Sign up"
                    : "Already have an account? Log in"
              }
              onAccountToggle={otpEnabled ? undefined : toggleAuthMode}
            />
          </div>

          {error && (
            <div className='mt-2 sm:mt-3 p-2 sm:p-3 bg-red-900/30 border border-red-500/50 rounded-lg max-w-md w-full flex-shrink-0'>
              <p className='text-xs sm:text-sm text-red-300 break-words'>{error}</p>
            </div>
          )}
          {otpMessage && (
            <div className='mt-2 sm:mt-3 p-2 sm:p-3 bg-green-900/30 border border-green-500/50 rounded-lg max-w-md w-full flex-shrink-0'>
              <p className='text-xs sm:text-sm text-green-200 break-words'>{otpMessage}</p>
            </div>
          )}
        </div>
      </span>
    </section>
  );
};

export default AuthPage;
