import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { trackProductDemoClick } from '../lib/analytics';

interface HeroProps {
  onNavigate: (sectionId: string) => void;
  onRequestDemo: (product?: 'cnms_v2' | 'operations_advisor' | 'both') => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onRequestDemo }) => {
  return (
    <section
      id="hero"
      className="relative pt-24 sm:pt-28 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 bg-[#050608] hairline-b flex flex-col justify-center"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Unified 12-Column Editorial Grid: 6 cols typography, 6 cols media */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Expressive Headline, Editorial Narrative & Understated Demo Links */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Restrained Eyebrow */}
            <div
              data-cinematic-reveal
              className="flex items-center gap-2.5 mb-5 sm:mb-6 text-neutral-400 font-sans"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
              <span className="editorial-label text-neutral-400 tracking-wider">
                Commedia Solutions &bull; Broadcast India Show 2026
              </span>
            </div>

            {/* Staggered Text-Mask Headline */}
            <div data-mask-reveal className="mb-6 sm:mb-7">
              <span className="text-mask-wrapper">
                <h1 className="text-mask-child editorial-hero-title text-white">
                  Networks are complex.
                </h1>
              </span>
              <span className="text-mask-wrapper">
                <h1 className="text-mask-child editorial-hero-title text-neutral-400 font-normal">
                  Operations shouldn&apos;t be.
                </h1>
              </span>
            </div>

            {/* Supporting Editorial Copy */}
            <div data-cinematic-reveal className="space-y-4 mb-8 sm:mb-10 max-w-xl">
              <p className="editorial-body-lead text-neutral-200">
                Explore Commedia Solutions&apos; enterprise technologies built for satellite networks, teleports, and broadcast infrastructure.
              </p>
              <p className="editorial-body text-neutral-400 text-sm sm:text-base">
                Discover unified network observability with <strong className="text-white font-medium">CNMS v2.0</strong>, and AI-assisted operational intelligence with <strong className="text-white font-medium">Operations Advisor</strong>. Both product demonstrations are available to stream below.
              </p>
            </div>

            {/* Two Clear, Understated Demo Links */}
            <div data-cinematic-reveal className="pt-6 hairline-t space-y-4">
              <span className="text-xs font-sans text-neutral-400 block font-medium">
                Jump directly to product demonstrations:
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                {/* Watch CNMS Demo Link */}
                <button
                  onClick={() => {
                    trackProductDemoClick('CNMS');
                    onNavigate('cnms');
                  }}
                  className="group inline-flex items-center gap-2.5 text-sm font-display font-medium text-white hover:text-sky-300 transition-colors w-fit"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 group-hover:scale-125 transition-transform shrink-0" />
                  <span>Watch CNMS Demo</span>
                  <ArrowDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-sky-300 group-hover:translate-y-0.5 transition-all" />
                </button>

                <span className="text-neutral-700 hidden sm:inline">&bull;</span>

                {/* Watch Operations Advisor Demo Link */}
                <button
                  onClick={() => {
                    trackProductDemoClick('Operations Advisor');
                    onNavigate('operations-advisor');
                  }}
                  className="group inline-flex items-center gap-2.5 text-sm font-display font-medium text-white hover:text-purple-300 transition-colors w-fit"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform shrink-0" />
                  <span>Watch Operations Advisor Demo</span>
                  <ArrowDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-purple-300 group-hover:translate-y-0.5 transition-all" />
                </button>
              </div>

              {/* Quieter Technical Briefing Link */}
              <div className="pt-2">
                <button
                  onClick={() => onRequestDemo('both')}
                  className="text-xs font-sans text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Or schedule a technical briefing at our booth</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent, Well-Integrated Product Visual (CNMS v2.0 Platform) */}
          <div className="lg:col-span-6" data-video-entrance>
            <div className="hairline-all bg-[#080A0F] overflow-hidden group">
              {/* Header Bar Explicitly Attributing to CNMS v2.0 */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 hairline-b bg-[#090C14] text-xs font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-white font-medium font-display">
                    CNMS v2.0 &bull; Satellite Earth Station Telemetry
                  </span>
                </div>
                <span className="text-neutral-400 text-[11px] hidden sm:inline">
                  Live Ground Segment Map
                </span>
              </div>

              {/* Unobstructed Genuine Screenshot Frame (Served through authenticated API) */}
              <div
                onClick={() => {
                  trackProductDemoClick('CNMS');
                  onNavigate('cnms');
                }}
                className="relative bg-black overflow-hidden cursor-pointer"
              >
                <img
                  src="/api/image?name=Earth%20station%20map.png"
                  alt="CNMS v2.0 Geospatial Earth Station and Antenna Tracking Interface"
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </div>

              {/* Contextual Caption Strip Leading Into the CNMS Demo Section */}
              <div
                onClick={() => {
                  trackProductDemoClick('CNMS');
                  onNavigate('cnms');
                }}
                className="px-4 sm:px-5 py-3 hairline-t bg-[#07090F] flex items-center justify-between text-xs font-sans text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="truncate pr-2">
                  Geospatial ground station tracking in CNMS v2.0
                </span>
                <span className="text-sky-400 shrink-0 font-medium inline-flex items-center gap-1">
                  <span>Explore platform</span>
                  <span>&darr;</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
