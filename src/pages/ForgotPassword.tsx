import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { RoyMenLogo } from '../components/RoyMenLogo';

export const ForgotPassword: React.FC = () => {
  const { getTranslatedText, addToast } = useShop();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        addToast(getTranslatedText(
          "If your email is registered, a recovery link has been sent.", 
          "আপনার ইমেইলটি নিবন্ধিত থাকলে, পাসওয়ার্ড রিসেট করার লিংক পাঠানো হয়েছে।"
        ), "success");
      } else {
        addToast(data.message || "Failed to initiate recovery", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen flex items-center justify-center py-20 px-4 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 bg-zinc-50 dark:bg-zinc-900/40 p-8 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-2xl relative overflow-hidden animate-fade-in">
        
        {/* Aesthetic premium gold trim accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500"></div>

        <div className="text-center space-y-4">
          <RoyMenLogo size="md" showTagline={false} className="mx-auto" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-[0.43em] text-yellow-600 dark:text-yellow-500 uppercase block">
              {getTranslatedText("ACCOUNT RECOVERY", "অ্যাকাউন্ট পুনরুদ্ধার")}
            </span>
            <h1 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">
              {getTranslatedText("RECOVER KEY", "পাসওয়ার্ড উদ্ধার")}
            </h1>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              {getTranslatedText("Enter your email to receive a secure login bypass key.", "আপনার পাসওয়ার্ড উদ্ধার করতে নিবন্ধিত ইমেইল প্রবেশ করান।")}
            </p>
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-zinc-650">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 block">
                {getTranslatedText("Registered Email Address:", "নিবন্ধিত ইমেইল ঠিকানা:")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@roymen.com"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 text-zinc-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-black uppercase tracking-[0.2em] rounded transition-all active:scale-[0.98] flex items-center justify-center space-x-2 border border-transparent dark:border-zinc-800"
            >
              {loading ? (
                <span className="inline-block animate-pulse">{getTranslatedText("ROUTING PROTOCOL...", "অনুরোধ পাঠানো হচ্ছে...")}</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>{getTranslatedText("DISPATCH KEY", "রিসেট লিংক পাঠান")}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-4">
            <div className="text-yellow-600 text-2xl font-serif">✉️</div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {getTranslatedText(
                "A secure, single-use password recovery link has been dispatched to your inbox. It will expire in exactly 15 minutes.",
                "একটি একক ব্যবহারযোগ্য পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। এটি আগামী ১৫ মিনিট সক্রিয় থাকবে।"
              )}
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-zinc-400 font-bold uppercase tracking-wider hover:text-black dark:hover:text-white ml-1 inline-flex items-center space-x-1.5"
          >
            <ArrowLeft size={12} />
            <span>{getTranslatedText("Back to Sign In", "সাইন ইন এ ফিরে যান")}</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
