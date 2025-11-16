import React, { useState } from 'react';
import { useNavigation, useAuth } from '../App';
import AuthIllustration from './AuthIllustration';

const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
const PasswordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;


type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');

  const isLogin = authMode === 'login';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email);
    }
  };
  
  const toggleAuthMode = () => {
    setAuthMode(isLogin ? 'signup' : 'login');
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col lg:flex-row bg-white dark:bg-[#111111] rounded-2xl shadow-2xl shadow-blue-500/10 dark:shadow-purple-500/10 overflow-hidden">
          
          <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center p-12 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">
             <AuthIllustration />
          </div>

          <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <button onClick={() => navigateTo('home')} className="self-start mb-6 text-sm text-gray-500 hover:text-blue-500 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
            </button>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                    <EmailIcon />
                </span>
                <input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                  required
                />
              </div>

              {!isLogin && (
                 <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                        <PhoneIcon />
                    </span>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                      required
                    />
                </div>
              )}

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                    <PasswordIcon />
                </span>
                <input
                  type="password"
                  placeholder="Your Password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                  required
                />
              </div>

               {!isLogin && (
                 <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                        <PasswordIcon />
                    </span>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                      required
                    />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input id="remember" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-900" />
                    <label htmlFor="remember" className="ml-2 block text-gray-600 dark:text-gray-400">Keep me logged in</label>
                  </div>
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Forgot Password?
                  </a>
                </div>
              )}
              
              <div>
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-offset-gray-900 transition-all">
                  {isLogin ? 'Log In' : 'Register'}
                </button>
              </div>
            </form>

            {isLogin && (
                <>
                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">or</span>
                        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.651-3.657-11.303-8h-6.723C8.614 34.621 15.682 40 24 40z"></path><path fill="#1976D2" d="M43.611 20.083L43.595 20L42 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.012 35.836 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sign in with Google</span>
                    </button>
                </>
            )}
            
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
              {isLogin ? "Don't have an account yet?" : 'Already have an account?'}{' '}
              <button onClick={toggleAuthMode} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;