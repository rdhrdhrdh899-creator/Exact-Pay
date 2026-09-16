import React from 'react';
import { Shield, Sparkles, Github, Twitter, Linkedin, Activity, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Scroll smoothly to any page section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="footer" className="bg-slate-900 text-slate-400 pt-16 pb-12 px-4 md:px-6 border-t border-slate-800/80 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background visual detail */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Upper Footer: Multi-column structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand Info & Interactive Logo (8 cols) */}
          <div className="md:col-span-8 flex flex-col items-start text-left">
            <div className="flex items-center gap-3 group mb-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-full h-full text-emerald-400 fill-none stroke-current"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <g className="logo-brackets-group">
                    <path d="M 32,12 H 18 A 6,6 0 0,0 12,18 V 32" />
                    <path d="M 68,12 H 82 A 6,6 0 0,1 88,18 V 32" />
                    <path d="M 12,68 V 82 A 6,6 0 0,0 18,88 H 32" />
                    <path d="M 88,68 V 82 A 6,6 0 0,1 82,88 H 68" />
                  </g>
                  <rect x="20" y="20" width="16" height="16" rx="3.5" strokeWidth="5" />
                  <rect x="25" y="25" width="6" height="6" rx="1" fill="currentColor" stroke="none" className="logo-dot-tl" />
                  <rect x="64" y="20" width="16" height="16" rx="3.5" strokeWidth="5" />
                  <rect x="69" y="25" width="6" height="6" rx="1" fill="currentColor" stroke="none" className="logo-dot-tr" />
                  <rect x="20" y="64" width="16" height="16" rx="3.5" strokeWidth="5" />
                  <rect x="25" y="69" width="6" height="6" rx="1" fill="currentColor" stroke="none" className="logo-dot-bl" />
                  <g className="logo-center-group">
                    <circle cx="50" cy="50" r="17" className="stroke-teal-400 fill-slate-950" strokeWidth="4.5" />
                    <path d="M 42,50 L 47,55 L 56,43" className="stroke-emerald-400" strokeWidth="5" />
                    <path d="M 50,43 H 56 V 49" className="stroke-emerald-400" strokeWidth="4.5" />
                  </g>
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-display font-black text-lg tracking-tight text-white leading-none">EXACT</span>
                  <span className="font-display font-black text-lg tracking-tight text-emerald-400 leading-none">PAY</span>
                </div>
                <span className="text-[7.5px] font-bold text-slate-500 tracking-widest uppercase mt-0.5 leading-none">Secure Payments</span>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xl">
              Free, fast, and secure client-side UPI QR code and payment link generator. Powering merchants, creators, and freelancers with custom offline-first pay templates.
            </p>

            {/* Social handles with hover magnetic effect */}
            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all duration-300 border border-slate-800 text-slate-400" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all duration-300 border border-slate-800 text-slate-400" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all duration-300 border border-slate-800 text-slate-400" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (4 cols, shifted to right) */}
          <div className="md:col-span-4 flex flex-col md:items-end text-left md:text-right">
            <div>
              <h4 className="font-display font-extrabold text-sm text-white tracking-widest uppercase mb-4 text-emerald-400/90">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm flex flex-col md:items-end">
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer flex items-center gap-1 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all duration-300" />
                    <span>Generate QR</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('why-exact-pay')} className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer flex items-center gap-1 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all duration-300" />
                    <span>Why Exact Pay</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-to-generate')} className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer flex items-center gap-1 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all duration-300" />
                    <span>How it Works</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('faq')} className="hover:text-emerald-400 transition-colors duration-200 cursor-pointer flex items-center gap-1 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-all duration-300" />
                    <span>Help & FAQs</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Lower Footer: Status info & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-medium">
          
          {/* Copyright Info */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>&copy; {currentYear} Exact Pay. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="flex items-center gap-1 bg-slate-800/40 border border-slate-800/80 rounded-full px-3 py-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">100% Secure Client-Side Privacy</span>
            </div>
          </div>

          {/* Live system status indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-400 flex items-center gap-1.5">
                Status: 
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  All Systems Operational
                </span>
              </span>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="flex items-center gap-1 text-slate-400">
                Created with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> for India
              </span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}

