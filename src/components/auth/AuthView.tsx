import React, { useState } from 'react';
import {
  Store,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const AuthView: React.FC = () => {
  const { registerUser, loginUser, loginWithGoogle, resetPassword } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!businessName.trim()) {
      setError(language === 'bn' ? 'প্রতিষ্ঠানের নাম লিখুন' : 'Please enter business name');
      return;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
      setError(
        language === 'bn'
          ? 'সঠিক মোবাইল নম্বর প্রদান করুন (কমপক্ষে ১১ ডিজিট)'
          : 'Please enter a valid mobile number'
      );
      return;
    }
    if (password.length < 8) {
      setError(
        language === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'
          : 'Password must be at least 8 characters'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(
        language === 'bn'
          ? 'পাসওয়ার্ড দুটি মিলছে না'
          : 'Passwords do not match'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        businessName,
        mobile,
        email,
        address,
        password,
      });
      // Automatic login is handled by Firebase onAuthStateChanged
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError(
          language === 'bn'
            ? 'এই ইমেইলটি ইতিপূর্বে ব্যবহার করা হয়েছে।'
            : 'Email already in use.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          language === 'bn'
            ? 'ইমেইল/পাসওয়ার্ড অনুমোদন ফায়ারবেস কনসোলে চালু থাকতে হবে অথবা নিচে গুগল দিয়ে লগইন করুন।'
            : 'Email auth not yet toggled on in console; you can use Google Sign-In below!'
        );
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginUser(email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError(
          language === 'bn'
            ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
            : 'Invalid email or password.'
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          language === 'bn'
            ? 'ইমেইল লগইন এখনো সক্রিয় করা হয়নি। অনুগ্রহ করে নিচের গুগল বোতাম ব্যবহার করুন।'
            : 'Email login disabled; please sign in with Google below.'
        );
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(language === 'bn' ? 'ইমেইল লিখুন' : 'Enter your email');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess(
        language === 'bn'
          ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।'
          : 'Password reset link sent to your email.'
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7FAF8]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E2EAE4] p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#16834A] text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md mb-3">
            ৳
          </div>
          <h1 className="text-2xl font-bold text-[#105C35]">{t.appName}</h1>
          <p className="text-xs text-gray-500 mt-1">{t.appTagline}</p>

          {/* Language Switch */}
          <div className="inline-flex mt-3 bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-3 py-1 rounded-md transition-colors ${
                language === 'bn' ? 'bg-[#16834A] text-white' : 'text-gray-600'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-md transition-colors ${
                language === 'en' ? 'bg-[#16834A] text-white' : 'text-gray-600'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl mb-6 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => {
              setMode('login');
              resetForm();
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-[#105C35] shadow-xs' : 'text-gray-500'
            }`}
          >
            {language === 'bn' ? 'লগইন' : 'Login'}
          </button>
          <button
            onClick={() => {
              setMode('register');
              resetForm();
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-[#105C35] shadow-xs' : 'text-gray-500'
            }`}
          >
            {language === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}
          </button>
        </div>

        {/* Feedback message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>{success}</span>
          </div>
        )}

        {/* --- LOGIN FORM --- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.email}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    resetForm();
                  }}
                  className="text-xs text-[#16834A] hover:underline"
                >
                  {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#16834A] hover:bg-[#105C35] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? t.common.loading : language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* --- REGISTRATION FORM --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'ব্যবসায়িক প্রতিষ্ঠানের নাম *' : 'Business Name *'}
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Al-Madina Traders"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="01712345678"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'ইমেইল এড্রেস *' : 'Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                {language === 'bn' ? 'প্রতিষ্ঠানের সংক্ষিপ্ত ঠিকানা' : 'Short Business Address'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Mirpur-10, Dhaka"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড (৮+ অক্ষর) *' : 'Password (8+ chars) *'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন *' : 'Confirm Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#16834A] hover:bg-[#105C35] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? t.common.loading : language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD FORM --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">{t.common.email}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16834A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#16834A] hover:bg-[#105C35] text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? t.common.loading : language === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetForm();
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-[#16834A]"
            >
              ← {language === 'bn' ? 'লগইন পাতায় ফিরুন' : 'Back to Login'}
            </button>
          </form>
        )}

        {/* Divider & Google Login Option */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-gray-400 uppercase">
            {language === 'bn' ? 'অথবা' : 'OR'}
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-xs sm:text-sm text-gray-700 transition-colors shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{language === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Continue with Google'}</span>
        </button>
      </div>
    </div>
  );
};
