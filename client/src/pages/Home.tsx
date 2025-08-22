import { useState } from "react";
import { Link } from "wouter";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { AgeSelector, type AgeGroup } from "@/components/AgeSelector";
import { BreakActivities } from "@/components/BreakActivities";

export default function Home() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | undefined>();

  const handleAgeGroupSelect = (ageGroup: AgeGroup) => {
    setSelectedAgeGroup(ageGroup);
    // Store in localStorage for persistence
    localStorage.setItem("selectedAgeGroup", ageGroup);
  };

  return (
    <>
      <AtmosphericBackground />
      <FloatingNavigation />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-20" data-testid="hero-section">
          <div className="max-w-6xl mx-auto text-center">
            
            {/* Main Title */}
            <div className="mb-12">
              <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight" data-testid="text-main-title">
                Learning Made
                <span className="relative">
                  <span className="bg-gradient-to-r from-warm-orange to-sunset-orange bg-clip-text text-transparent font-bold">
                    {" "}Extraordinary
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-warm-orange to-sunset-orange bg-clip-text text-transparent animate-pulse-soft opacity-80">
                    {" "}Extraordinary
                  </span>
                  {/* Fallback text shadow for better readability */}
                  <span className="absolute inset-0 text-warm-orange opacity-20 blur-sm">
                    {" "}Extraordinary
                  </span>
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed" data-testid="text-main-description">
                AI-powered Australian curriculum learning that adapts to your pace, 
                wrapped in a beautiful, meditative experience.
              </p>
            </div>
            
            {/* Age Selection */}
            <AgeSelector 
              onAgeGroupSelect={handleAgeGroupSelect}
              selectedAgeGroup={selectedAgeGroup}
            />
            
            {/* Call to Action */}
            <div className="space-y-6">
              <Link 
                href={selectedAgeGroup ? "/dashboard" : "#"}
                className={`inline-block ${!selectedAgeGroup ? 'pointer-events-none opacity-50' : ''}`}
              >
                <button 
                  className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-12 py-4 rounded-2xl font-display font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-sunset-orange/25"
                  disabled={!selectedAgeGroup}
                  data-testid="button-begin-journey"
                >
                  Begin Your Journey
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </Link>
              
              <p className="text-white/60 text-sm" data-testid="text-features">
                <i className="fas fa-brain text-accent-teal mr-2"></i>
                AI-powered • Australian Curriculum • Progress Tracking
              </p>
            </div>
          </div>
        </section>
        
        {/* Break Activities Section */}
        <section className="px-4 py-20 relative" data-testid="break-activities-section">
          <BreakActivities />
        </section>
        
        {/* Footer */}
        <footer className="px-4 py-16 relative" data-testid="footer">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Call to Action */}
            <div className="mb-12">
              <h3 className="font-display text-3xl font-semibold text-white mb-6" data-testid="text-footer-cta">
                Ready to Transform Learning?
              </h3>
              <Link href={selectedAgeGroup ? "/dashboard" : "#"}>
                <button 
                  className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-12 py-4 rounded-2xl font-display font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-2xl"
                  disabled={!selectedAgeGroup}
                  data-testid="button-start-trial"
                >
                  Start Learning
                </button>
              </Link>
            </div>
            
            {/* Footer Links */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm mb-8">
              <a href="#" className="hover:text-white transition-colors duration-300" data-testid="link-about">About</a>
              <a href="#" className="hover:text-white transition-colors duration-300" data-testid="link-curriculum">Curriculum</a>
              <a href="#" className="hover:text-white transition-colors duration-300" data-testid="link-privacy">Privacy</a>
              <a href="#" className="hover:text-white transition-colors duration-300" data-testid="link-support">Support</a>
              <a href="#" className="hover:text-white transition-colors duration-300" data-testid="link-contact">Contact</a>
            </div>
            
            <div className="text-white/40 text-xs" data-testid="text-copyright">
              © 2024 LearnOz. Crafted with care for Australian learners.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
