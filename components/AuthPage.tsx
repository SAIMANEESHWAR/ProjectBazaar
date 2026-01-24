import React, { useState, ChangeEvent, FormEvent, ReactNode, useEffect } from 'react';
import { useNavigation, useAuth } from '../App';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '@/components/ui/modern-animated-sign-in';

type FieldType = 'text' | 'email' | 'password';

const API_ENDPOINT = 'https://xlxus7dr78.execute-api.ap-south-2.amazonaws.com/User_login_signup';

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

const AuthPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = authMode === 'login';

  // Clear error when switching between login and signup
  useEffect(() => {
    setError(null);
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
        // Determine role - check if admin
        const userRole = data.data.email === 'saimanee@gmail.com' ? 'admin' : (data.data.role || 'user');
        
        // Store user data in localStorage for session persistence
        localStorage.setItem('userData', JSON.stringify(data.data));
        
        // Call the login function with user data
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
        const userRole = data.data.email === 'saimanee@gmail.com' ? 'admin' : (data.data.role || 'user');
        
        // Store user data in localStorage for session persistence
        localStorage.setItem('userData', JSON.stringify(data.data));
        
        login(data.data.userId, data.data.email, userRole);
      }
    } catch (err) {
      console.error('Auto-login after signup error:', err);
      setError('Account created but login failed. Please try logging in manually.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

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

  const goToForgotPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    console.log('forgot password');
  };

  const toggleAuthMode = () => {
    setAuthMode(isLogin ? 'signup' : 'login');
    setError(null);
    // Clear form fields when switching modes
    setFormData({
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });
  };

  const loginFields: Array<{
    label: string;
    required: boolean;
    type: FieldType;
    placeholder: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
    },
    {
      label: 'ConfirmPassword',
      required: true,
      type: 'password',
      placeholder: 'Confirm your password',
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        handleInputChange(event, 'confirmPassword'),
    },
  ];

  const formFields = {
    header: isLogin ? 'Welcome back' : 'Create an account',
    subHeader: isLogin ? 'Sign in to your account' : 'Sign up to get started',
    fields: isLogin ? loginFields : signupFields,
    submitButton: isLogin ? 'Sign in' : 'Sign up',
    textVariantButton: isLogin ? 'Forgot password?' : undefined,
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
          <div className='w-full flex-shrink-0' key={authMode}>
            <AuthTabs
              formFields={formFields}
              goTo={isLogin ? goToForgotPassword : toggleAuthMode}
              handleSubmit={handleSubmit}
              accountToggleText={isLogin ? "Don't have an account yet? Sign up" : "Already have an account? Log in"}
              onAccountToggle={toggleAuthMode}
            />
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
