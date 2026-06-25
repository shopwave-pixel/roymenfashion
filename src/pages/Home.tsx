import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { ChevronLeft, ChevronRight, Star, Truck, ShieldCheck, RefreshCw, BadgePercent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Home: React.FC = () => {
  const { getTranslatedText, products } = useShop();
  const navigate = useNavigate();
  const [currentHero, setCurrentHero] = useState(0);

  const heroSlides = [
    {
      titleEn: "ROY MEN",
      titleBn: "রয় মেন",
      subEn: "EDITORIAL SELECTION // 2026",
      subBn: "এডিটরিয়াল সিলেকশন // ২০২৬",
      descEn: "Wear Confidence. Premium Men's Fashion for Bangladesh.",
      descBn: "আত্মবিশ্বাসে সজ্জ্বিত হন। বাংলাদেশের জন্য প্রিমিয়াম পুরুষদের ফ্যাশন।",
      image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1200&auto=format&fit=crop",
      link: "/shop",
      styleName: "THE MINIMALIST APEX",
      styleNameBn: "দ্য মিনিমালিস্ট অ্যাপেক্স"
    },
    {
      titleEn: "ROY MEN",
      titleBn: "রয় মেন",
      subEn: "SARTORIAL CRAFTSMANSHIP",
      subBn: "সার্টোরিয়াল ক্রাফটসম্যানশিপ",
      descEn: "Wear Confidence. Premium Men's Fashion for Bangladesh.",
      descBn: "আত্মবিশ্বাসে সজ্জ্বিত হন। বাংলাদেশের জন্য প্রিমিয়াম পুরুষদের ফ্যাশন।",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop",
      link: "/shop?category=Shirts",
      styleName: "THE SARTORIAL MODERN",
      styleNameBn: "দ্য সার্টোরিয়াল মডার্ন"
    },
    {
      titleEn: "ROY MEN",
      titleBn: "রয় মেন",
      subEn: "PREMIUM ESSENTIAL OUTFITS",
      subBn: "প্রিমিয়াম এসেনশিয়াল আউটফিটস",
      descEn: "Wear Confidence. Premium Men's Fashion for Bangladesh.",
      descBn: "আত্মবিশ্বাসে সজ্জ্বিত হন। বাংলাদেশের জন্য প্রিমিয়াম পুরুষদের ফ্যাশন।",
      image: "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?q=80&w=1200&auto=format&fit=crop",
      link: "/shop?category=T-Shirts",
      styleName: "THE PREMIUM CASUAL",
      styleNameBn: "দ্য প্রিমিয়াম ক্যাজুয়াল"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const featuredList = products.filter(p => p.featured).slice(0, 4);
  const newArrivals = products.filter(p => p.isNew).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);

  const collections = [
    { nameEn: "T-Shirts", nameBn: "টি-শার্ট", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400" },
    { nameEn: "Shirts", nameBn: "শার্ট", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400" },
    { nameEn: "Panjabi", nameBn: "পাঞ্জাবি", img: "https://images.unsplash.com/photo-1610473068565-df0480927e1f?q=80&w=400" },
    { nameEn: "Accessories", nameBn: "এক্সেসরিজ", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400" }
  ];

  const localTestimonials = [
    {
      name: "Sabbir Hossain",
      role: "Corporate Executive, Gulshan",
      reviewEn: "Royal Crimson Pique Polo has a fantastic fabric feel. Perfect collar line that holds even after multiple machine washes. Absolute elite branding experience.",
      reviewBn: "গুলশান রোডের প্রিমিয়াম শপগুলোর থেকেও রয়মেন এর পোলো শার্ট আমার অসাধারণ লেগেছে। কালার ফেইড করে না, কলার বাঁকা হয় না। নিখুঁত স্যুয়িং!",
      rating: 5
    },
    {
      name: "Arif Al-Amin",
      role: "Tech Entrepreneur, Banani",
      reviewEn: "Best selvedge raw denim jeans in Dhaka. Stitch quality, solid bronze rivets, and fit are comparable to Japanese imports. Amazing craft value.",
      reviewBn: "আমি সত্যিই মুগ্ধ! বাংলাদেশে তৈরি জাপানিজ র-সেলভেজ ডেনিমের রয়মেন ফিটিং সত্যিই জাস্ট অসাধারণ। পকেট ও বাটনগুলোর ফিনিশিং অত্যন্ত নিখুঁত।",
      rating: 5
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 1. Premium Editorial Split Hero Section */}
      <section className="relative w-full h-[85vh] lg:h-[90vh] grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 transition-colors duration-300">
        
        {/* Left Column: Premium Brand Typography and Content */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 bg-[#F5F5F3] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-50 relative border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-900/60 z-20">
          
          {/* Subtle grid background line decorations */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* Top Editorial Label */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center space-x-3 text-[10px] tracking-[0.4em] uppercase font-bold text-zinc-500 dark:text-zinc-400"
          >
            <span>EST. 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span>DHAKA // PREMIER</span>
          </motion.div>

          {/* Main Slogan & Title */}
          <div className="my-auto py-8 lg:py-0 space-y-6">
            <div className="space-y-2">
              <motion.span 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="block text-[11px] font-bold tracking-[0.55em] text-zinc-400 dark:text-zinc-500 uppercase"
              >
                {getTranslatedText(heroSlides[currentHero].titleEn, heroSlides[currentHero].titleBn)}
              </motion.span>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-black dark:text-white tracking-tight leading-[1.05]"
              >
                {getTranslatedText("Wear Confidence.", "আত্মবিশ্বাসে সজ্জ্বিত হন।")}
              </motion.h1>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-sm sm:text-base font-light text-zinc-600 dark:text-zinc-400 max-w-md tracking-wide leading-relaxed"
            >
              {getTranslatedText(heroSlides[currentHero].descEn, heroSlides[currentHero].descBn)}
            </motion.p>

            {/* Premium Interactive Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="pt-6 flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/shop"
                className="px-8 py-4 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-[11px] font-extrabold uppercase tracking-[0.25em] transition-all shadow-lg shadow-black/10 dark:shadow-white/5 text-center"
              >
                {getTranslatedText("Shop Now", "শপ করুন")}
              </Link>
              <Link
                to="/shop"
                onClick={() => {
                  // Direct navigation with Category logic or New Arrivals filter can be set if needed
                }}
                className="px-8 py-4 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[11px] font-extrabold uppercase tracking-[0.25em] transition-all text-center"
              >
                {getTranslatedText("New Arrivals", "নতুন কালেকশন")}
              </Link>
            </motion.div>
          </div>

          {/* Bottom Luxury Metadata Coordinates */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex justify-between items-center text-[9px] font-mono tracking-[0.2em] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/50 dark:border-zinc-900/60 pt-4"
          >
            <span>LAT: 23.8103° N</span>
            <span>LONG: 90.4125° E</span>
            <span>EDITION 2026 // RM</span>
          </motion.div>
        </div>

        {/* Right Column: Premium Male Model Showcase Slider */}
        <div className="col-span-12 lg:col-span-7 h-[45vh] sm:h-[55vh] lg:h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 z-10 group">
          
          {/* Subtle vignette layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-10 pointer-events-none" />

          {/* Floating Luxury Stamp Animation (COS / Zara Style) */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [1, -2, 1] 
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-6 right-6 z-20 bg-black/85 dark:bg-zinc-950/90 backdrop-blur-md border border-white/10 dark:border-zinc-800/80 px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase font-mono text-zinc-200 select-none hidden sm:block"
          >
            <div className="flex flex-col items-center leading-none space-y-1">
              <span className="font-extrabold text-amber-400">ROY MEN</span>
              <span className="text-[8px] opacity-75">SARTORIAL LAB</span>
            </div>
          </motion.div>

          {/* Side Indicator Badge */}
          <div className="absolute bottom-6 left-6 z-20 text-[10px] tracking-[0.3em] font-bold text-white select-none hidden sm:block">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentHero}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4 }}
                className="bg-black/60 px-3 py-1.5 rounded-sm border border-white/5"
              >
                {getTranslatedText(heroSlides[currentHero].styleName, heroSlides[currentHero].styleNameBn)}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Interactive Slide Render */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHero}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <motion.img
                src={heroSlides[currentHero].image}
                alt={heroSlides[currentHero].titleEn}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                loading="eager"
                animate={{ 
                  scale: [1, 1.04, 1],
                  y: [0, -4, 0]
                }}
                transition={{ 
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Carousel Arrow Controls */}
          <button
            onClick={() => setCurrentHero((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 border border-white/10 text-white hover:bg-white hover:text-black rounded-full flex items-center justify-center transition-all bg-black/25 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentHero((prev) => (prev + 1) % heroSlides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 border border-white/10 text-white hover:bg-white hover:text-black rounded-full flex items-center justify-center transition-all bg-black/25 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Next Slide"
          >
            <ChevronRight size={18} />
          </button>

          {/* Minimalist Dot/Dash Navigation */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center space-x-3 bg-black/35 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/10">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentHero(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentHero ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </section>

      {/* 2. Core Value Props Showcase (Bangladesh custom delivery speed) */}
      <section className="py-8 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="flex flex-col items-center p-3">
              <Truck size={22} className="text-zinc-800 dark:text-zinc-200 mb-2 stroke-[1.5]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                {getTranslatedText("Fast Delivery", "দ্রুততম ডেলিভারি")}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                {getTranslatedText("24-48 Hours inside Dhaka. 3 Days across BD.", "ঢাকায় ২৪-৪৮ ঘণ্টা, সারা বাংলাদেশে ৩ দিনের মধ্যে।")}
              </p>
            </div>

            <div className="flex flex-col items-center p-3">
              <ShieldCheck size={22} className="text-zinc-800 dark:text-zinc-200 mb-2 stroke-[1.5]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                {getTranslatedText("100% Genuine Craft", "১০০% অথেন্টিক কোটি")}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                {getTranslatedText("Guaranteed Egyptian cotton & Italian linen fibers.", "শতভাগ প্রিমিয়াম ইতালিয়ান লিনেন ও সুতি কাপড়।")}
              </p>
            </div>

            <div className="flex flex-col items-center p-3">
              <RefreshCw size={22} className="text-zinc-800 dark:text-zinc-200 mb-2 stroke-[1.5]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                {getTranslatedText("7-Day Easy Exchange", "৭ দিনের সহজ রিটার্ন")}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                {getTranslatedText("No-questions-asked change matching guarantee.", "সাইজ বা ফিটিং নিয়ে সমস্যা হলে ৭ দিনে এক্সচেঞ্জ সুবিধা।")}
              </p>
            </div>

            <div className="flex flex-col items-center p-3">
              <BadgePercent size={22} className="text-zinc-800 dark:text-zinc-200 mb-2 stroke-[1.5]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                {getTranslatedText("Premium Membership", "রয়মেন প্রিভে")}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                {getTranslatedText("Earn loyalty points & unlocks with code Welcome15.", "প্রিভিলেজ পয়েন্ট ও মেম্বারশিপে বিশেষ ডিসকাউন্ট।")}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Luxury Collection Categories Grid (Bento Style) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center pb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-black dark:text-white uppercase">
              {getTranslatedText("Curated Collections", "অভিজাত কালেকশন")}
            </h2>
            <div className="w-16 h-[3px] bg-black dark:bg-white mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {collections.map((col, idx) => (
              <div
                key={idx}
                className="group relative h-[320px] rounded-lg overflow-hidden bg-zinc-100 hover:shadow-lg transition-all duration-300"
              >
                {/* Visual image screen */}
                <img
                  src={col.img || null}
                  alt={col.nameEn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Visual curtain */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>

                {/* Info Overlay absolute block */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-black tracking-widest text-white uppercase">
                    {getTranslatedText(col.nameEn, col.nameBn)}
                  </h3>
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest mt-1">
                    {getTranslatedText("Shop Collection", "অন্বেষণ করুন")} →
                  </p>
                  <Link
                    to={`/shop?category=${encodeURIComponent(col.nameEn)}`}
                    className="absolute inset-0 z-10"
                    aria-label={`Shop category ${col.nameEn}`}
                  ></Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Elegant New Arrivals Showcase Grid (Featured Tabs) */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-900/20 border-t border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center pb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-black dark:text-white uppercase">
              {getTranslatedText("New Arrivals", "নতুন কালেকশন")}
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1 whitespace-pre-line font-medium uppercase tracking-widest">
              {getTranslatedText("Precision styling, fine fabrics, effortless charm.", "আমাদের সর্বাধুনিক ডিজাইন ও ফেব্রিক্সে সজ্জ্বিত কালেকশন।")}
            </p>
            <div className="w-16 h-[3px] bg-black dark:bg-white mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
          
          <div className="text-center pt-10">
            <Link
              to="/shop"
              className="px-8 py-3.5 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-black uppercase tracking-[0.25em] rounded transition-transform hover:scale-105 inline-block"
            >
              {getTranslatedText("View All New Styles", "সব আকর্ষণীয় পোশাক দেখুন")}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Custom Promotional Banner absolute layout */}
      <section className="py-20 relative bg-zinc-950 overflow-hidden text-center text-white">
        {/* Background visual watermarks */}
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/90 to-zinc-950"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-6">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.43em] text-amber-400">
            {getTranslatedText("LIMITED CAMPAIGN PRESENTATION", "লিমিটেড টাইম অফার")}
          </span>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-white uppercase leading-tight">
            ⚡ {getTranslatedText("UP TO 15% WELCOME OFFER", "১৫% পর্যন্ত বিশেষ ছাড়")}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-xl mx-auto tracking-wide">
            {getTranslatedText(
              "Sign up now for premium lifestyle previews or apply code WELCOME15 in the checkout tray to deduct 15% instantly on your first purchase.",
              "রয়মেন-এ প্রথমবারের অর্ডারে ১৫% পর্যন্ত ডিসকাউন্ট পেতে অ্যাপ্লাই করুন কুপন কোড WELCOME15"
            )}
          </p>
          <div className="flex border border-zinc-800 rounded max-w-md mx-auto items-center p-1.5 bg-zinc-900/80">
            <span className="text-xs font-mono font-black text-amber-400 px-4 select-all">WELCOME15</span>
            <button
              onClick={() => {
                navigate('/shop');
              }}
              className="px-6 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-wider rounded ml-auto"
            >
              {getTranslatedText("Claim Voucher", "অফারটি নিন")}
            </button>
          </div>
        </div>
      </section>

      {/* 6. High End Best Sellers */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center pb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-black dark:text-white uppercase animate-fade-in">
              {getTranslatedText("Most Coveted Models", "সেরা বিক্রিত কালেকশন")}
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1 whitespace-pre-line font-medium uppercase tracking-widest">
              {getTranslatedText("High retention, timeless elegance, chosen by many.", "গ্রাহকদের অত্যন্ত পছন্দের ও সর্বাধিক বিক্রিত স্টাইলিশ পোশাকসমূহ।")}
            </p>
            <div className="w-16 h-[3px] bg-black dark:bg-white mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>



    </div>
  );
};
