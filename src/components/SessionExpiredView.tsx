import React from 'react';
import { Clock, ShieldAlert, Mail, ArrowUpRight } from 'lucide-react';
import { DemoForm } from './DemoForm';

interface SessionExpiredViewProps {
  onRefreshSession?: () => void;
}

export const SessionExpiredView: React.FC<SessionExpiredViewProps> = () => {
  return (
    <div className="min-h-screen bg-[#050608] text-[#F1F3F5] flex flex-col pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        {/* Editorial Access Notice Header */}
        <div className="p-8 sm:p-10 bg-[#080A0F] hairline-all border-neutral-800 relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Visitor Access Concluded &bull; 60-Minute Expiry
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-white mb-4">
              Broadcast India 2026 Showcase Session Expired
            </h1>

            <p className="text-neutral-300 text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
              Your 60-minute preview of Commedia Solutions&apos; proprietary platforms (CNMS v2.0 Platform and Operations Advisor AI Co-Pilot) has concluded. In accordance with enterprise access guidelines, interactive demonstrations and interface captures are currently restricted.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 hairline-t text-xs font-mono text-neutral-400">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>Proprietary video streams and operational telemetry consoles have been safely unmounted.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Schedule a dedicated engineering demonstration with our senior satellite systems architects.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retain Demo Form for immediate Lead Capture / Briefing Request */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 hairline-b">
            <div>
              <span className="editorial-label text-sky-400 block mb-1">
                Direct Engineer Briefing
              </span>
              <h2 className="editorial-subhead text-white">
                Request an Extended Technical Walkthrough
              </h2>
            </div>
            <a
              href="mailto:sales@commediaindia.com?subject=Commedia%20Solutions%20-%20Broadcast%20India%20Showcase%20Access%20Request"
              className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span>sales@commediaindia.com</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <DemoForm initialProduct="both" />
        </div>
      </div>
    </div>
  );
};
