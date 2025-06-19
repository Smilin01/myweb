import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Linkedin, Twitter, Youtube, Github } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
      {/* Animated Curved Lines - Updated to match reference */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
        {/* Top flowing curve */}
        <motion.path
          d="M-200,150 Q200,50 600,100 T1200,80 Q1400,70 1600,90"
          stroke="url(#gradient1)"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            times: [0, 0.5, 1]
          }}
        />
        
        {/* Middle serpentine curve */}
        <motion.path
          d="M-100,350 Q300,250 700,320 T1300,280 Q1500,260 1700,300"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1,
            times: [0, 0.5, 1]
          }}
        />
        
        {/* Bottom flowing curve */}
        <motion.path
          d="M-150,550 Q400,450 800,520 T1400,480 Q1600,460 1800,500"
          stroke="url(#gradient3)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 0],
            opacity: [0, 0.7, 0]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2,
            times: [0, 0.5, 1]
          }}
        />
        
        {/* Continuous snake-like curve */}
        <motion.path
          d="M0,400 Q200,300 400,400 T800,350 Q1000,320 1200,380 T1600,340"
          stroke="url(#gradient4)"
          strokeWidth="5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ 
            pathLength: [0, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear"
          }}
        />
        
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#4ECDC4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#45B7D1" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#96CEB4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFEAA7" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A8E6CF" stopOpacity="0.6" />
            <stop offset="33%" stopColor="#FFD93D" stopOpacity="0.5" />
            <stop offset="66%" stopColor="#6BCF7F" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#4D96FF" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9B59B6" stopOpacity="0.5" />
            <stop offset="25%" stopColor="#E74C3C" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#F39C12" stopOpacity="0.4" />
            <stop offset="75%" stopColor="#1ABC9C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3498DB" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF9A9E" stopOpacity="0.8" />
            <stop offset="20%" stopColor="#FECFEF" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#FECFEF" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#A8EDEA" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#FFD0A6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FD9853" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm sm:text-base lg:text-lg font-bold text-gray-900"
          >
            John Smilin DS
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center space-x-4 lg:space-x-6"
          >
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-900 hover:text-blue-600 transition-colors font-medium text-sm lg:text-base"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm lg:text-base"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('recent-projects')}
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm lg:text-base"
            >
              Portfolio
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm lg:text-base"
            >
              Testimonials
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm lg:text-base"
            >
              Contact
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex items-center min-h-screen pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Content - Main Text */}
          <div className="lg:col-span-9 xl:col-span-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6 lg:space-y-8"
            >
              {/* Main Heading */}
              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-[0.9] tracking-tight">
                  BUILDING{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    DIGITAL
                  </span>
                  <br />
                  PRODUCTS &{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                    BRANDS
                  </span>
                </h1>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-4 lg:gap-8 max-w-xl mx-auto lg:mx-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">5+</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Years of Experience</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">50+</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Projects Launched</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">25+</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">Happy Clients</div>
                </motion.div>
              </div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-4 lg:space-y-6"
              >
                {/* Let's Talk Section */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
                  <span className="text-sm sm:text-base lg:text-lg text-gray-900 font-medium">
                    Let's Talk with John Smilin DS
                  </span>
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-gray-400"
                  >
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </motion.div>
                </div>

                {/* Email Button */}
                <motion.button
                  onClick={scrollToContact}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-full text-sm sm:text-base lg:text-lg font-medium hover:bg-gray-800 transition-all duration-300 flex items-center gap-2 mx-auto lg:mx-0 shadow-lg"
                >
                  johnsmilin6@gmail.com
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Content - Social Links */}
          <div className="lg:col-span-3 xl:col-span-4 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-row lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3"
            >
              <motion.a
                href="https://www.linkedin.com/in/johnsmilin/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors shadow-md"
              >
                <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
              </motion.a>
              <motion.a
                href="https://github.com/Smilin01"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-md"
              >
                <Github className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-600" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shadow-md"
              >
                <Twitter className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-600" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-md"
              >
                <Youtube className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-600" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;