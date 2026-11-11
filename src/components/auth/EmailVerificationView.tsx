import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const EmailVerificationView: React.FC = () => {
  const { currentUser, checkEmailVerified, sendVerificationEmail, logout } = useAuth();
  const { language } = useLanguage();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Handle countdown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        setMessage({
          type: 'success',
          text: language === 'bn'
            ? 'অভিনন্দন! আপনার ইমেইল সফলভাবে ভেরিফাই হয়েছে।'
            : 'Congratulations! Your email has been verified.',
        });
      } else {
        setMessage({
          type: 'error',
          text: language === 'bn'
            ? 'ইমেইলটি এখনো ভেরিফাই হয়নি। অনুগ্রহ করে আপনার ইনবক্স অথবা স্প্যাম ফোল্ডারে পাঠানো লিঙ্কে ক্লিক করুন।'
            : 'Email not verified yet. Please click the link sent to your inbox or spam folder.',
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || (language === 'bn' ? 'স্ট্যাটাস চেক করতে সমস্যা হয়েছে।' : 'Failed to verify status.'),
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setMessage(null);
    try {
      await sendVerificationEmail();
      setCooldown(60);
      setMessage({
        type: 'success',
        text: language === 'bn'
          ? 'নতুন ভেরিফিকেশন লিঙ্ক আপনার ইমেইলে সফলভাবে পাঠানো হয়েছে।'
          : 'A new verification link has been sent to your email.',
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: language === 'bn'
          ? 'লিঙ্ক পাঠাতে ব্যর্থ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : 'Failed to resend email. Please try again in a moment.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7FAF8]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E2EAE4] p-6 sm:p-8 text-center">
        {/* Brand Logo & Icon */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-[#16834A] text-white flex items-center justify-center shadow-lg">
            <Mail className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#105C35]">
          {language === 'bn' ? 'ইমেইল ভেরিফিকেশন প্রয়োজন' : 'Verify Your Email Address'}
        </h2>

        {/* Subtitle / Email badge */}
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          {language === 'bn'
            ? 'আপনার অ্যাকাউন্টটি সুরক্ষিত ও সক্রিয় করতে আমরা নিচের ঠিকানায় একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি:'
            : 'To secure and activate your business account, we have sent a verification email to:'}
        </p>

        <div className="my-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl inline-block text-xs sm:text-sm font-semibold text-gray-800 break-all">
          {currentUser?.email}
        </div>

        {/* Notice Card */}
        <div className="bg-[#EBF7F0] border border-[#CDEBD8] rounded-2xl p-4 text-left my-4 space-y-2">
          <div className="flex items-center gap-2 text-[#105C35] font-semibold text-xs sm:text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'কীভাবে অ্যাকাউন্ট সক্রিয় করবেন:' : 'How to activate:'}</span>
          </div>
          <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1 pl-1">
            <li>
              {language === 'bn'
                ? 'আপনার ইমেইলের ইনবক্স অথবা স্প্যাম (Spam/Junk) ফোল্ডার খুলুন।'
                : 'Open your email Inbox or Spam/Junk folder.'}
            </li>
            <li>
              {language === 'bn'
                ? 'ফায়ারবেস প্রেরিত ইমেইলের ভেরিফিকেশন লিঙ্কে ক্লিক করুন।'
                : 'Click the verification link inside the email.'}
            </li>
            <li>
              {language === 'bn'
                ? 'লিঙ্ক ক্লিক করার পর নিচের "ভেরিফিকেশন নিশ্চিত করুন" বোতামে চাপ দিন।'
                : 'Return here and click "Check Verification Status".'}
            </li>
          </ol>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 text-left border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{message.text}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Check Verification Status */}
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 bg-[#16834A] hover:bg-[#105C35] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>
              {checking
                ? language === 'bn'
                  ? 'যাচাই করা হচ্ছে...'
                  : 'Checking Status...'
                : language === 'bn'
                ? 'ভেরিফিকেশন নিশ্চিত করুন'
                : 'Check Verification Status'}
            </span>
          </button>

          {/* Resend Email */}
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full py-2.5 bg-white border border-[#16834A] text-[#16834A] hover:bg-green-50 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
          >
            <Send className="w-4 h-4" />
            <span>
              {cooldown > 0
                ? `${language === 'bn' ? 'অপেক্ষা করুন' : 'Wait'} (${cooldown}s)`
                : resending
                ? language === 'bn'
                  ? 'পাঠানো হচ্ছে...'
                  : 'Sending...'
                : language === 'bn'
                ? 'পুনরায় ভেরিফিকেশন ইমেইল পাঠান'
                : 'Resend Verification Email'}
            </span>
          </button>

          {/* Logout / Switch Account */}
          <button
            onClick={logout}
            className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'লগআউট / অন্য অ্যাকাউন্ট' : 'Logout / Switch Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
