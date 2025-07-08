
import React from 'react';
import { useCountAnimation } from '../hooks/useCountAnimation';

const HeroSection = () => {
  const videosCount = useCountAnimation({ end: 100, duration: 2000 });
  const studentsCount = useCountAnimation({ end: 500, duration: 2000 });

  const scrollToExplore = () => {
    const exploreElement = document.getElementById('explore');
    if (exploreElement) {
      exploreElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-orbitron text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Ma Madhurjo Shikkhalay
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light">
            Empowering Students with Knowledge
          </p>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Join our educational platform where learning meets innovation. 
            Access quality educational content curated by experienced educators.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={scrollToExplore}
            className="btn-primary text-lg px-8 py-4 animate-glow"
          >
            Try Now
          </button>
          
          <div className="text-sm text-gray-400 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Educational Content</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">{videosCount}+</div>
            <div className="text-sm text-gray-400">Educational Videos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">{studentsCount}+</div>
            <div className="text-sm text-gray-400">Active Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">24/7</div>
            <div className="text-sm text-gray-400">Access</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
