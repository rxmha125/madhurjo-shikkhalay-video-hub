
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ExploreSection from '../components/ExploreSection';

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle section scrolling from URL params
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    
    if (section) {
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <ExploreSection />
    </div>
  );
};

export default Index;
