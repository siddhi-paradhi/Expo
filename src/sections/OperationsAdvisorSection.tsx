import React from 'react';
import { VideoPlayer } from '../components/VideoPlayer';
import { ArrowUpRight } from 'lucide-react';

interface OperationsAdvisorSectionProps {
  onRequestDemo: (product: 'operations_advisor') => void;
  isExpired?: boolean;
}

export const OperationsAdvisorSection: React.FC<OperationsAdvisorSectionProps> = ({
  onRequestDemo,
  isExpired = false,
}) => {
  const capabilities = [
    {
      num: '01',
      title: 'Contextual Incident Investigation',
      description: 'Correlates concurrent telemetry alerts with historical incident records to synthesize coherent diagnostic summaries during time-critical shift operations.',
    },
    {
      num: '02',
      title: 'SOP & Documentation Retrieval',
      description: 'Surfaces approved switchover checklists, equipment manuals, and standard operating procedures tailored directly to the affected hardware state in seconds.',
    },
    {
      num: '03',
      title: 'Pattern Drift & Anomaly Correlation',
      description: 'Identifies subtle pattern drifts across RF gain, ambient humidity, and carrier tracking before alarms escalate to critical shutdown thresholds.',
    },
    {
      num: '04',
      title: 'Human-in-the-Loop Operational Safety',
      description: 'Engineered as a decision-support co-pilot: all operational actions, switchovers, and configurations require explicit authorized human approval.',
    },
  ];

  return (
    <section
      id="operations-advisor"
      className="relative pt-10 sm:pt-14 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-[#050608] hairline-b"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Memorable Transition Bridge from CNMS to Operations Advisor */}
        <div className="mb-8 sm:mb-10 pb-6 sm:pb-8 hairline-b" data-cinematic-reveal>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-sky-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Operational Transition
            </span>
            <span className="w-8 h-[1px] bg-purple-400" />
          </div>
          <p className="editorial-subhead text-neutral-300 max-w-3xl">
            From network visibility to operational reasoning: Once your network telemetry is visible in CNMS, Operations Advisor empowers duty engineers to investigate anomalies and access technical procedures without manual delays.
          </p>
        </div>

        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 sm:mb-10" data-cinematic-reveal>
          <div className="lg:col-span-3">
            <span className="editorial-label text-purple-400 block mb-2">
              02 &bull; OPERATIONS ADVISOR
            </span>
            <span className="text-xs font-sans text-neutral-400 uppercase tracking-wider block">
              AI Operations Co-Pilot
            </span>
          </div>

          <div className="lg:col-span-9">
            <h2 className="editorial-section-title text-white mb-6">
              From operational questions to actionable insights.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 hairline-t">
              <p className="editorial-body-lead text-neutral-300">
                Operations Advisor is an AI-assisted operations co-pilot designed for teleport engineers and broadcast NOC teams. It connects live incident context with approved documentation to accelerate decision-making.
              </p>
              <div className="flex flex-col justify-between">
                <p className="editorial-body">
                  Rather than replacing human oversight, Operations Advisor augments operator expertise during live shifts—eliminating manual documentation searches during time-critical carrier switchovers.
                </p>
                <div className="pt-4 mt-4 hairline-t">
                  <button
                    onClick={() => onRequestDemo('operations_advisor')}
                    className="text-xs font-sans uppercase tracking-wider text-purple-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Request Operations Advisor Briefing</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY FOCUS: Prominent Cinema Video Demonstration */}
        <div className="mb-8 sm:mb-10" data-video-entrance>
          <div className="hairline-all bg-[#090A14]">
            {/* Video Header Strip */}
            <div className="flex items-center justify-between px-5 py-3.5 hairline-b bg-[#0C0D1A] text-xs font-sans">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-white font-medium font-display">
                  Operations Advisor &bull; Official Video Demonstration
                </span>
              </div>
              <span className="text-neutral-400 text-xs hidden sm:inline">
                Co-Pilot Interface Walkthrough
              </span>
            </div>

            {/* Expansive Playable Video Frame */}
            <VideoPlayer
              src="/api/video-operations-advisor"
              title="Operations Advisor Co-Pilot Walkthrough"
              productName="operations_advisor"
              accentColor="purple"
              callToActionLabel="Watch Operations Advisor Demo"
              className="w-full"
              isExpired={isExpired}
            />

            {/* Video Meta Strip */}
            <div className="px-5 py-3 hairline-t bg-[#080812] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="text-purple-400 font-semibold">Role:</span>
                <span>Incident Triage &bull; SOP Search &bull; Decision Augmentation &bull; Shift Memory</span>
              </div>
              <span className="text-neutral-500 text-[11px] font-mono">
                Authentic Operations Advisor Demonstration
              </span>
            </div>
          </div>
        </div>

        {/* Demonstrated Capabilities Breakdown (Derived from real video functionality, zero CNMS confusion) */}
        <div data-cinematic-reveal className="space-y-6">
          <div className="pb-3 hairline-b">
            <span className="editorial-label text-purple-400 block mb-1">
              Demonstrated System Capabilities
            </span>
            <h3 className="editorial-subhead text-white">
              Built for high-stakes operational environments
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.num} className="p-6 bg-[#080812] hairline-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-purple-400">
                    <span>CAPABILITY {cap.num}</span>
                    <span className="text-neutral-500 font-sans">Enterprise Governance</span>
                  </div>
                  <h4 className="text-base font-display font-medium text-white mb-2">
                    {cap.title}
                  </h4>
                  <p className="editorial-body text-neutral-300 text-sm">
                    {cap.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 hairline-t text-[11px] font-mono text-neutral-500">
                  Duty Engineer Support &bull; Operations Advisor
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
