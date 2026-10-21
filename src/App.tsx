import React, { useState, useEffect } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useCinematicScroll } from './hooks/useScrollAnimations';
import { useVisitorSession } from './hooks/useVisitorSession';
import { initGA } from './lib/analytics';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CNMSSection } from './sections/CNMSSection';
import { OperationsAdvisorSection } from './sections/OperationsAdvisorSection';
import { DemoForm } from './components/DemoForm';
import { Footer } from './components/Footer';
import { SessionExpiredView } from './components/SessionExpiredView';

export const App: React.FC = () => {
  const { scrollTo } = useSmoothScroll();
  useCinematicScroll();
  const [selectedDemoProduct, setSelectedDemoProduct] = useState<'cnms_v2' | 'operations_advisor' | 'both'>('both');

  const {
    remainingSeconds,
    isExpired,
    formattedTime,
    refreshSession,
  } = useVisitorSession();

  useEffect(() => {
    // Initialise Google Analytics 4 (gracefully no-ops if VITE_GA_MEASUREMENT_ID is missing)
    initGA();
  }, []);

  const handleNavigate = (sectionId: string) => {
    scrollTo(`#${sectionId}`, -60);
  };

  const handleRequestDemo = (product: 'cnms_v2' | 'operations_advisor' | 'both' = 'both') => {
    setSelectedDemoProduct(product);
    scrollTo('#contact', -60);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-[#F1F3F5] flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Fixed Minimal Navigation with Session Indicator */}
      <Navbar
        onNavigate={handleNavigate}
        onRequestDemo={handleRequestDemo}
        remainingSeconds={remainingSeconds}
        isExpired={isExpired}
        formattedTime={formattedTime}
      />

      {/* Main Content Journey */}
      <main className="flex-1">
        {isExpired ? (
          /* When session concludes, immediately replace showcase with Swiss-styled Expired view */
          <SessionExpiredView onRefreshSession={refreshSession} />
        ) : (
          <>
            {/* Section 1: Opening / Hero with immediate video jump paths */}
            <Hero onNavigate={handleNavigate} onRequestDemo={handleRequestDemo} />

            {/* Section 2: CNMS v2.0 Platform, Video Demo & Authentic Consoles */}
            <CNMSSection onRequestDemo={handleRequestDemo} isExpired={isExpired} />

            {/* Section 3: Operations Advisor AI Co-Pilot & Video Demo */}
            <OperationsAdvisorSection onRequestDemo={handleRequestDemo} isExpired={isExpired} />

            {/* Section 4: Contact & Technical Consultation */}
            <DemoForm initialProduct={selectedDemoProduct} />
          </>
        )}
      </main>

      {/* Minimal Swiss Editorial Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
