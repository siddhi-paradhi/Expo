import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useScrollProgress } from '../hooks/useScrollAnimations';
import { trackProductDemoClick } from '../lib/analytics';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  onRequestDemo: (product?: 'cnms_v2' | 'operations_advisor' | 'both') => void;
  remainingSeconds?: number;
  isExpired?: boolean;
  formattedTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  onRequestDemo,
  remainingSeconds = 3600,
  isExpired = false,
  formattedTime = '01:00:00',
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'cnms', label: 'CNMS v2.0' },
    { id: 'operations-advisor', label: 'Operations Advisor' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleLinkClick = (id: string) => {
    if (id === 'cnms') {
      trackProductDemoClick('CNMS');
    } else if (id === 'operations-advisor') {
      trackProductDemoClick('Operations Advisor');
    }
    onNavigate(id);
    setMobileOpen(false);
  };

  const isLowTime = !isExpired && remainingSeconds < 300;

  return (
    <>
      {/* 1px quiet progress hairline */}
      <div
        className="fixed top-0 left-0 h-[1.5px] bg-neutral-200 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-200 ${
          scrolled ? 'bg-[#050608]/95 backdrop-blur-md hairline-b' : 'bg-[#050608]/80 backdrop-blur-sm hairline-b'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Trade Show Metadata */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => handleLinkClick('hero')}
              className="flex items-center gap-3 text-left focus:outline-none"
              aria-label="Commedia Solutions"
            >
              <img
                src="/images/commedia-logo.png"
                alt="Commedia Solutions"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </button>
            <span className="hidden lg:inline-block text-[11px] font-mono text-neutral-500 uppercase tracking-wider pl-4 hairline-l">
              Broadcast India Show 2026
            </span>
          </div>

          {/* Visitor Session Countdown Timer Pill */}
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono rounded hairline-all transition-colors select-none ${
                isExpired
                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                  : isLowTime
                  ? 'bg-amber-950/40 text-amber-300 border-amber-700/60 animate-pulse'
                  : 'bg-[#0A0D14] text-neutral-300 border-[#1C2333]'
              }`}
              title="Server-authoritative 60-minute showcase visitor access window"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isExpired
                    ? 'bg-rose-500'
                    : isLowTime
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="tracking-tight">
                {isExpired ? 'ACCESS EXPIRED' : `${formattedTime} ACCESS`}
              </span>
            </div>
          </div>

          {/* Minimal Functional Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {!isExpired &&
              navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}

            <button
              onClick={() => onRequestDemo('both')}
              className="text-xs font-mono uppercase tracking-wider text-white hover:text-sky-300 transition-colors flex items-center gap-1 pl-4 hairline-l"
            >
              <span>Request Briefing</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-neutral-400 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-[#07090E] hairline-b px-4 py-6 space-y-4">
            <div className="space-y-3">
              {!isExpired &&
                navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id)}
                    className="block w-full text-left text-sm font-mono uppercase tracking-wider text-neutral-300 hover:text-white py-2"
                  >
                    {link.label}
                  </button>
                ))}
              <button
                onClick={() => {
                  onRequestDemo('both');
                  setMobileOpen(false);
                }}
                className="w-full mt-4 py-2.5 px-4 bg-sky-500/10 border border-sky-400/40 text-sky-400 text-xs font-mono uppercase tracking-wider text-center"
              >
                Request Briefing
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
