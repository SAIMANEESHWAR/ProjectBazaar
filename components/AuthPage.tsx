import React, { useState, ChangeEvent, FormEvent, ReactNode, useEffect } from 'react';
import { useNavigation, useAuth } from '../context/appContext';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '@/components/ui/modern-animated-sign-in';
import {
  clearOAuthParamsFromUrl,
  fetchGoogleOAuthConfig,
  getGoogleRedirectUri,
  readOAuthCallbackParams,
  startGoogleDirectSignIn,
  takeGooglePkceVerifier,
  validateGoogleOAuthState,
} from '@/lib/googleDirectAuth';
import { LOGIN_API_URL } from '@/lib/apiConfig';
import { scheduleOnboardingTour } from '@/lib/onboardingTour';
import { requestPasswordReset, resetPassword } from '@/lib/passwordReset';
import VerificationCodeInput from './VerificationCodeInput';

type FieldType = 'text' | 'email' | 'password';

type AuthMode = 'login' | 'signup' | 'forgotPassword' | 'resetPassword';

const resetPasswordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /\d/.test(p) },
  {
    id: 'special',
    label: 'One special character',
    test: (p: string) => /[@$!%*?&#^()_+=\-\[\]{}|\\:;"'<>,./]/.test(p),
  },
];

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
    /** Present after direct Google OAuth (`google_oauth_exchange`). */
    idToken?: string;
    emailVerificationSent?: boolean;
    emailVerified?: boolean;
  };
  error?: {
    code: string;
    message: string;
    blockedUntil?: string;
    deletedUntil?: string;
  };
}

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
  const { page, navigateTo } = useNavigation();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthWorking, setOauthWorking] = useState(false);
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const isLogin = authMode === 'login';
  const isSignup = authMode === 'signup';
  const isForgot = authMode === 'forgotPassword';
  const isReset = authMode === 'resetPassword';
  const showGoogleAuth = googleOAuthEnabled && (isLogin || isSignup);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchGoogleOAuthConfig(LOGIN_API_URL);
        if (!cancelled && cfg.googleEnabled && cfg.clientId) {
          setGoogleOAuthEnabled(true);
        }
      } catch {
        if (!cancelled) setGoogleOAuthEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (page === 'resetPassword') {
      setAuthMode('resetPassword');
      setResetUserId(params.get('userId')?.trim() || '');
      setResetToken(params.get('token')?.trim() || '');
      return;
    }

    if (page === 'forgotPassword') {
      setAuthMode('forgotPassword');
      return;
    }

    if (page === 'auth') {
      setAuthMode((prev) =>
        prev === 'forgotPassword' || prev === 'resetPassword' ? 'login' : prev
      );
    }
  }, [page]);

  useEffect(() => {
    setError(null);
  }, [authMode]);

  const goToLoginMode = () => {
    setAuthMode('login');
    setError(null);
    setForgotSent(false);
    setForgotMessage(null);
    setResetSuccess(false);
    setResetMessage(null);
    setResetCode('');
    setFormData({
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });
    navigateTo('auth');
  };

  // Google OAuth return: `/auth?code=...` — Lambda exchanges code (secret stays on server)
  useEffect(() => {
    const { code, state, error: oauthError, errorDescription } = readOAuthCallbackParams();
    if (!code && !oauthError) return;

    if (oauthError) {
      clearOAuthParamsFromUrl();
      setError(errorDescription || oauthError || 'Google sign-in was cancelled.');
      return;
    }

    if (!code || !state) {
      clearOAuthParamsFromUrl();
      return;
    }

    clearOAuthParamsFromUrl();

    if (!validateGoogleOAuthState(state)) {
      setError('Sign-in session expired or invalid. Please try again.');
      return;
    }

    const code_verifier = takeGooglePkceVerifier();
    if (!code_verifier) {
      setError('Missing sign-in data. Please try again.');
      return;
    }

    const redirectUri = getGoogleRedirectUri();

    let cancelled = false;
    setOauthWorking(true);
    setError(null);

    (async () => {
      try {
        const response = await fetch(LOGIN_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'google_oauth_exchange',
            code,
            redirect_uri: redirectUri,
            code_verifier,
          }),
        });

        const data: ApiResponse = await response.json();
        if (cancelled) return;

        if (data.success && data.data) {
          const { idToken, ...userRest } = data.data;
          if (idToken) {
            localStorage.setItem('oauthIdToken', idToken);
          }
          localStorage.setItem('userData', JSON.stringify(userRest));
          const userRole = data.data.role === 'admin' ? 'admin' : 'user';
          login(data.data.userId, data.data.email, userRole);
        } else {
          setError(data.error?.message || 'Could not complete sign-in with Google.');
        }
      } catch (err) {
        console.error('Google OAuth error:', err);
        setError(
          err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
        );
      } finally {
        if (!cancelled) setOauthWorking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OAuth callback runs once per page load
  }, []);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(LOGIN_API_URL, {
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
        if (data.data.emailVerificationSent) {
          sessionStorage.setItem('emailVerificationSent', 'true');
        }
        // Signup successful, now login the user
        const loggedIn = await handleLoginAfterSignup();
        if (!loggedIn) {
          setLoading(false);
        }
        return;
      } else {
        setError(data.error?.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Signup error:', err);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(LOGIN_API_URL, {
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
        return;
      } else {
        setError(data.error?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    }
    setLoading(false);
  };

  const handleLoginAfterSignup = async (): Promise<boolean> => {
    try {
      const response = await fetch(LOGIN_API_URL, {
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

        const userData = {
          ...data.data,
          emailVerified: data.data.emailVerified ?? false,
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        scheduleOnboardingTour();

        login(data.data.userId, data.data.email, userRole);
        return true;
      }

      setError('Account created but login failed. Please try logging in manually.');
      return false;
    } catch (err) {
      console.error('Auto-login after signup error:', err);
      setError('Account created but login failed. Please try logging in manually.');
      return false;
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setError('Enter the email linked to your account.');
      return;
    }
    setLoading(true);
    setError(null);
    setForgotMessage(null);
    try {
      const result = await requestPasswordReset(formData.email.trim());
      if (result.success) {
        setForgotSent(true);
        setForgotMessage(
          result.message ||
            'If an account exists for this email, we sent password reset instructions.'
        );
      } else {
        setError(result.error?.message || 'Could not send reset email. Try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    const userId = resetUserId.trim();
    const hasToken = Boolean(resetToken.trim());
    const passwordValid = resetPasswordRequirements.every((req) => req.test(formData.password));
    const passwordsMatch =
      formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

    if (!userId || !passwordValid || !passwordsMatch || (!hasToken && resetCode.length !== 6)) {
      setError('Enter a valid password and complete the reset code or use the email link.');
      return;
    }

    setLoading(true);
    setError(null);
    setResetMessage(null);
    try {
      const result = await resetPassword({
        userId,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        ...(hasToken ? { token: resetToken.trim() } : { code: resetCode }),
      });
      if (result.success) {
        setResetSuccess(true);
        setResetMessage(result.message || 'Your password has been reset. You can sign in now.');
      } else {
        setError(result.error?.message || 'Could not reset password. Request a new link.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isForgot) {
      await handleForgotPassword();
      return;
    }
    if (isReset) {
      await handleResetPasswordSubmit();
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
    if (isForgot || isReset) {
      goToLoginMode();
      return;
    }
    setAuthMode(isLogin ? 'signup' : 'login');
    setError(null);
    setFormData({
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });
  };

  const openForgotPassword = () => {
    setError(null);
    setForgotSent(false);
    setForgotMessage(null);
    setAuthMode('forgotPassword');
    navigateTo('forgotPassword');
  };

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

  const resetFields: typeof loginFields = [
    {
      label: 'Password',
      required: true,
      type: 'password',
      placeholder: 'Enter your new password',
      onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'password'),
      helperComponent:
        formData.password && resetPasswordRequirements.some((req) => !req.test(formData.password)) ? (
          <div className="space-y-1">
            {resetPasswordRequirements
              .filter((req) => !req.test(formData.password))
              .map((req) => (
                <p key={req.id} className="text-xs text-red-400">
                  {req.label}
                </p>
              ))}
          </div>
        ) : null,
    },
    {
      label: 'ConfirmPassword',
      required: true,
      type: 'password',
      placeholder: 'Confirm your new password',
      onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'confirmPassword'),
    },
  ];

  const forgotFields: typeof loginFields = [
    {
      label: 'Email',
      required: true,
      type: 'email',
      placeholder: 'Enter your email address',
      onChange: (event: ChangeEvent<HTMLInputElement>) => handleInputChange(event, 'email'),
    },
  ];

  const formFields = isForgot
    ? {
        header: 'Forgot password',
        subHeader: 'Enter your email and we will send a reset link and code.',
        fields: forgotFields,
        submitButton: 'Send reset link',
      }
    : isReset
      ? {
          header: 'Reset password',
          subHeader: resetToken
            ? 'Choose a new password for your account.'
            : 'Enter the code from your email and choose a new password.',
          fields: resetFields,
          submitButton: 'Reset password',
        }
      : {
          header: isLogin ? 'Welcome back' : 'Create an account',
          subHeader: isLogin ? 'Sign in to your account' : 'Sign up to get started',
          fields: isLogin ? loginFields : signupFields,
          submitButton: isLogin ? 'Sign in' : 'Sign up',
        };

  const accountToggleText = isForgot
    ? 'Remember your password? Sign in'
    : isReset
      ? 'Back to sign in'
      : isLogin
        ? "Don't have an account yet? Sign up"
        : 'Already have an account? Log in';

  const orbitText = isLogin
    ? 'Welcome Back'
    : isSignup
      ? 'Get Started'
      : isForgot
        ? 'Forgot Password'
        : 'New Password';

  const handleGoogleClick = () => {
    setError(null);
    (async () => {
      try {
        await startGoogleDirectSignIn(LOGIN_API_URL);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not start Google sign-in.');
      }
    })();
  };

  if (oauthWorking) {
    return (
      <section className='flex max-lg:justify-center h-screen overflow-hidden relative bg-black items-center justify-center'>
        <div className='text-center text-gray-300'>
          <div className='inline-block h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500 mb-4' aria-hidden />
          <p className='text-sm'>Completing sign-in…</p>
        </div>
      </section>
    );
  }

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
            <TechOrbitDisplay iconsArray={iconsArray} text={orbitText} />
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
          {showGoogleAuth && (
            <div className='w-full max-w-md mb-4 flex-shrink-0'>
              <button
                type='button'
                onClick={handleGoogleClick}
                className='flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-900/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:border-gray-500'
              >
                <svg className='h-5 w-5 shrink-0' viewBox='0 0 48 48' aria-hidden>
                  <path fill='#FFC107' d='M43.611 20.083H42V20H24v8h11.303C33.72 32.657 29.342 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z' />
                  <path fill='#FF3D00' d='m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z' />
                  <path fill='#4CAF50' d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z' />
                  <path fill='#1976D2' d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z' />
                </svg>
                Continue with Google
              </button>
              <p className='mt-3 text-center text-xs text-gray-500'>or use your email below</p>
            </div>
          )}
          <div className='w-full flex-shrink-0' key={authMode}>
            {isForgot && forgotSent ? (
              <div className='max-w-md w-full mx-auto text-center space-y-4'>
                <h2 className='font-bold text-3xl text-white'>Check your email</h2>
                <p className='text-sm text-white/80'>{forgotMessage}</p>
                <button
                  type='button'
                  onClick={goToLoginMode}
                  className='w-full rounded-md bg-black border border-gray-800 h-10 text-sm font-medium text-white hover:bg-gray-900 transition-colors'
                >
                  Back to sign in
                </button>
              </div>
            ) : isReset && resetSuccess ? (
              <div className='max-w-md w-full mx-auto text-center space-y-4'>
                <h2 className='font-bold text-3xl text-white'>Password updated</h2>
                <p className='text-sm text-white/80'>{resetMessage}</p>
                <button
                  type='button'
                  onClick={goToLoginMode}
                  className='w-full rounded-md bg-black border border-gray-800 h-10 text-sm font-medium text-white hover:bg-gray-900 transition-colors'
                >
                  Sign in
                </button>
              </div>
            ) : (
              <>
                {isReset && !resetToken && (
                  <div className='mb-4 max-w-md w-full mx-auto'>
                    <p className='mb-3 text-center text-sm text-white/80'>6-digit reset code</p>
                    <VerificationCodeInput
                      value={resetCode}
                      onChange={setResetCode}
                      disabled={loading}
                      idPrefix='auth-reset-code'
                    />
                  </div>
                )}
                {isReset && resetToken && (
                  <p className='mb-4 max-w-md w-full mx-auto text-center text-sm text-orange-300/90'>
                    Secure reset link detected. Enter your new password below.
                  </p>
                )}
                <AuthTabs
                  formFields={formFields}
                  goTo={() => { }}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  accountToggleText={accountToggleText}
                  onAccountToggle={toggleAuthMode}
                />
                {isLogin && (
                  <div className='mt-3 text-center'>
                    <button
                      type='button'
                      onClick={openForgotPassword}
                      className='text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors'
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {isReset && (
                  <div className='mt-3 text-center'>
                    <button
                      type='button'
                      onClick={() => {
                        setError(null);
                        navigateTo('forgotPassword');
                      }}
                      className='text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors'
                    >
                      Request a new reset link
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div className='mt-2 sm:mt-3 p-2 sm:p-3 bg-red-900/30 border border-red-500/50 rounded-lg max-w-md w-full flex-shrink-0'>
              <p className='text-xs sm:text-sm text-red-300 break-words'>{error}</p>
            </div>
          )}
        </div>
      </span>
    </section>
  );
};

export default AuthPage;
