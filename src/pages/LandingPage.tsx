import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/landing/Hero';
import { TechStackMarquee } from '../components/ui/TechStackMarquee';
import Services from '../components/landing/Services';
import RecentProjects from '../components/landing/RecentProjects';
import Testimonials from '../components/landing/Testimonials';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import Chatbot from '../components/landing/Chatbot';
import ModernMailbox from '../components/landing/ModernMailbox';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Hero />
        <TechStackMarquee />
        <Services />
        <RecentProjects />
        <Testimonials />
        <Contact />
        <Footer />
        <Chatbot />
        <ModernMailbox />
      </motion.div>
    </div>
  );
};

export default LandingPage;