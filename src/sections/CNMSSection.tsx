import React, { useState } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';
import { ArrowUpRight, Maximize2, X } from 'lucide-react';

interface CNMSSectionProps {
  onRequestDemo: (product: 'cnms_v2') => void;
  isExpired?: boolean;
}

export const CNMSSection: React.FC<CNMSSectionProps> = ({ onRequestDemo, isExpired = false }) => {
  const [selectedScreenIdx, setSelectedScreenIdx] = useState(0);
  const [fullscreenModal, setFullscreenModal] = useState(false);

  // Verified authentic CNMS v2.0 interface captures (served through session-validated API)
  const cnmsScreens = [
    {
      title: 'Dynamic Network Topology',
      subtitle: 'Waveguide & Link Mapping',
      src: '/api/image?name=Network%20Topolgy.png',
      description: 'Interactive topological mapping of switches, transponders, waveguides, and carrier links with live route status.',
    },
    {
      title: 'Centralised Telemetry Dashboard',
      subtitle: 'Single-Pane Operational Console',
      src: '/api/image?name=Dashboard.png',
      description: 'Consolidated overview aggregating ground station telemetry, active link states, and critical equipment health.',
    },
    {
      title: 'Geospatial Earth Station Maps',
      subtitle: 'Ground Segment Footprint Tracking',
      src: '/api/image?name=Earth%20station%20map.png',
      description: 'Geospatial tracking of satellite antennas and teleports with live pointing azimuth and elevation coordinates.',
    },
    {
      title: 'Device Inventory & Port Details',
      subtitle: 'Hardware Asset Governance',
      src: '/api/image?name=Device%20inventory%20details.png',
      description: 'Granular hardware asset registry detailing chassis configurations, IP registers, and transceiver metrics.',
    },
    {
      title: 'Live Alerts & Event Ingestion',
      subtitle: 'Sub-Second SNMP Triage',
      src: '/api/image?name=Alerts%20and%20live%20events.png',
      description: 'Real-time incident bus streaming sub-second SNMP traps classified into Critical, Major, and Minor tiers.',
    },
    {
      title: 'RF & Carrier Performance',
      subtitle: 'Link Telemetry Analytics',
      src: '/api/image?name=Performance.png',
      description: 'Continuous RF analytics monitoring Eb/N0 margins, carrier-to-noise density (C/N0), and historical attenuation.',
    },
  ];

  const currentScreen = cnmsScreens[selectedScreenIdx];

  return (
    <section
      id="cnms"
      className="relative pt-10 sm:pt-14 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#050608] hairline-b"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header: Deliberate Editorial Transition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 sm:mb-10" data-cinematic-reveal>
          <div className="lg:col-span-3">
            <span className="editorial-label text-sky-400 block mb-2">
              01 &bull; CNMS v2.0 PLATFORM
            </span>
            <span className="text-xs font-sans text-neutral-400 uppercase tracking-wider block">
              Commedia Network Management System
            </span>
          </div>

          <div className="lg:col-span-9">
            <h2 className="editorial-section-title text-white mb-6">
              Visibility across your network.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 hairline-t">
              <p className="editorial-body-lead text-neutral-300">
                CNMS v2.0 delivers unified operational observability for satellite operators, teleports, and high-capacity carrier networks. It replaces fragmented tools with a single management platform.
              </p>
              <div className="flex flex-col justify-between">
                <p className="editorial-body">
                  Engineered for mission-critical reliability: sub-second SNMP trap triage, dynamic network interconnect mapping, and RF carrier telemetry monitoring.
                </p>
                <div className="pt-4 mt-4 hairline-t">
                  <button
                    onClick={() => onRequestDemo('cnms_v2')}
                    className="text-xs font-sans uppercase tracking-wider text-sky-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Request CNMS v2.0 Demonstration Briefing</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY FOCUS: Prominent Cinema Video Demonstration */}
        <div className="mb-10 sm:mb-12" data-video-entrance>
          <div className="hairline-all bg-[#080A0F]">
            {/* Video Header Strip */}
            <div className="flex items-center justify-between px-5 py-3.5 hairline-b bg-[#090C14] text-xs font-sans">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-white font-medium font-display">
                  CNMS v2.0 &bull; Official Video Demonstration
                </span>
              </div>
              <span className="text-neutral-400 text-xs hidden sm:inline">
                Full Production System Walkthrough
              </span>
            </div>

            {/* Expansive Playable Video Frame */}
            <VideoPlayer
              src="/api/video-cnms"
              title="CNMS v2.0 Platform Walkthrough"
              productName="cnms_v2"
              accentColor="cyan"
              callToActionLabel="Watch CNMS v2.0 Demo"
              className="w-full"
              isExpired={isExpired}
            />

            {/* Video Meta Strip */}
            <div className="px-5 py-3 hairline-t bg-[#07090F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="text-sky-400 font-semibold">Scope:</span>
                <span>Earth Station Tracking &bull; RF Telemetry &bull; Network Topology &bull; Alerts</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Restrained red indicators denote active critical alarm classifications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Authentic CNMS Interface Matrix (Verified 100% CNMS screens) */}
        <div data-cinematic-reveal className="space-y-6">
          <div className="flex items-center justify-between pb-3 hairline-b">
            <div>
              <span className="editorial-label text-sky-400 block mb-1">
                CNMS v2.0 Production Consoles
              </span>
              <h3 className="editorial-subhead text-white">
                Inspect authentic system interfaces
              </h3>
            </div>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              Select console to inspect
            </span>
          </div>

          {/* Console Switcher Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {cnmsScreens.map((screen, idx) => {
              const isSelected = selectedScreenIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedScreenIdx(idx)}
                  className={`p-3 text-left transition-colors text-xs hairline-all ${
                    isSelected
                      ? 'bg-[#0E1524] text-white border-sky-400/60'
                      : 'bg-[#080B12] text-neutral-400 hover:text-white hover:bg-[#0C101A]'
                  }`}
                >
                  <span className={`block text-[10px] uppercase font-mono mb-1 ${isSelected ? 'text-sky-400' : 'text-neutral-500'}`}>
                    Console 0{idx + 1}
                  </span>
                  <span className="font-display font-medium line-clamp-1 text-neutral-200">
                    {screen.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Interface Showcase Frame */}
          <div className="hairline-all bg-[#080A0F] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 hairline-b bg-[#090C14] text-xs font-sans">
              <span className="text-white font-medium">
                {currentScreen.title} &mdash; <span className="text-neutral-400 font-normal">{currentScreen.subtitle}</span>
              </span>
              <button
                onClick={() => setFullscreenModal(true)}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-xs hidden sm:inline">Enlarge</span>
              </button>
            </div>

            <div
              className="relative aspect-[16/9] bg-black cursor-pointer flex items-center justify-center p-2 group"
              onClick={() => setFullscreenModal(true)}
            >
              <img
                key={currentScreen.src}
                src={currentScreen.src}
                alt={`CNMS v2.0 - ${currentScreen.title}`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-4 py-2 bg-black/85 hairline-all text-xs text-white backdrop-blur-sm flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Click to Expand Fullscreen</span>
                </span>
              </div>
            </div>

            <div className="p-5 hairline-t bg-[#07090E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-neutral-400">
              <p className="max-w-2xl text-neutral-300">
                {currentScreen.description}
              </p>
              <span className="text-neutral-500 text-[11px] shrink-0 font-mono">
                Verified CNMS v2.0 Capture
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-8 backdrop-blur-md"
          onClick={() => setFullscreenModal(false)}
        >
          <div className="flex items-center justify-between pb-4 max-w-7xl mx-auto w-full">
            <span className="text-sm font-sans font-medium text-white">
              CNMS v2.0 &bull; {currentScreen.title}
            </span>
            <button
              onClick={() => setFullscreenModal(false)}
              className="p-2 text-neutral-400 hover:text-white"
              aria-label="Close fullscreen modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="flex-1 max-w-7xl mx-auto w-full flex items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentScreen.src}
              alt={currentScreen.title}
              className="max-h-[85vh] max-w-full object-contain hairline-all"
            />
          </div>
        </div>
      )}
    </section>
  );
};
