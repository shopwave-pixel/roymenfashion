import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { RoyMenLogo } from '../components/RoyMenLogo';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getTranslatedText, addToast } = useShop();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword || !token) return;

    if (password.length < 4) {
      addToast(getTranslatedText("Password must be at least 4 characters long.", "পাসওয়ার্ড অবশ্যই ৪ অক্ষরের হতে হবে।"), "error");
      return;
    }

    if (password !== confirmPassword) {
      addToast(getTranslatedText("Passwords do not match.", "উভয় পাসওয়ার্ড একই হতে হবে।"), "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        addToast(getTranslatedText(
          "Your password has been successfully updated. Welcome back!", 
          "আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।"
        ), "success");
      } else {
        addToast(data.message || "Failed to reset password.", "error");
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
              {getTranslatedText("IDENTITY VERIFICATION", "পরিচয় যাচাই")}
            </span>
            <h1 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">
              {getTranslatedText("RESET PASS", "নতুন পাসওয়ার্ড")}
            </h1>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              {getTranslatedText("Configure your premium account with secure new credentials.", "আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড সেট করুন।")}
            </p>
          </div>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-zinc-650">
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 block">
                {getTranslatedText("New Secure Password (min 4):", "নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর):")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 text-zinc-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 block">
                {getTranslatedText("Confirm Password:", "পাসওয়ার্ড নিশ্চিত করুন:")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                <span className="inline-block animate-pulse">{getTranslatedText("REWRITING DATABASE...", "পরিবর্তন সংরক্ষণ করা হচ্ছে...")}</span>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>{getTranslatedText("CONFIRM PASSWORD CHANGE", "পাসওয়ার্ড পরিবর্তন করুন")}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-lg space-y-4">
            <div className="text-green-600 text-2xl">✓</div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {getTranslatedText(
                "Your password has been updated. You will receive a security dispatch confirming this adjustment.",
                "আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে। একটি নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে।"
              )}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-black uppercase text-[10px] tracking-wider rounded"
              >
                <span>{getTranslatedText("Login to Dashboard", "লগইন করুন")}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
