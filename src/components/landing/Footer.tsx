import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight, Linkedin, Twitter, Youtube, Github } from 'lucide-react';
import { 
  HelpCentreModal, 
  PrivacyPolicyModal, 
  TermsConditionsModal, 
  InformationHelpModal,
  usePolicyModals 
} from '../ui/PolicyModals';

const Footer: React.FC = () => {
  const {
    helpCentreOpen,
    privacyPolicyOpen,
    termsConditionsOpen,
    informationHelpOpen,
    openModal,
    setHelpCentreOpen,
    setPrivacyPolicyOpen,
    setTermsConditionsOpen,
    setInformationHelpOpen,
  } = usePolicyModals();

  const footerLinks = {
    company: [
      { name: 'Home', href: '#home' },
      { name: 'Services', href: '#services' },
      { name: 'Recent Projects', href: '#recent-projects' },
      { name: 'Testimonials', href: '#testimonials' },
      { name: 'Contact', href: '#contact' }
    ],
    support: [
      { name: 'Help Centre', action: () => openModal('help') },
      { name: 'Privacy Policy', action: () => openModal('privacy') },
      { name: 'Terms & Conditions', action: () => openModal('terms') },
      { name: 'Information Help', action: () => openModal('info') }
    ]
  };

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <footer className="bg-gray-100 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gray-200 rounded-2xl p-8 sm:p-12 mb-12 sm:mb-16 text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              LET'S DISCUSS YOUR IDEAS
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8">
              Ready to transform your vision into reality? Whether you need a stunning website, 
              a powerful SaaS platform, or custom software solutions, I'm here to help you 
              build something extraordinary. Let's collaborate and create digital experiences 
              that drive real business results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={scrollToContact}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                johnsmilin6@gmail.com
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </motion.button>
              
              <motion.a
                href="https://www.linkedin.com/in/johnsmilin/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-gray-900 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-gray-900 hover:text-white transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                Follow Me
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-4 text-center sm:text-left"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">John Smilin DS</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Full-Stack Developer & SaaS Creator specializing in transforming ideas into powerful digital solutions.
              </p>
              <div className="flex justify-center sm:justify-start space-x-3 sm:space-x-4">
                <motion.a
                  href="https://www.linkedin.com/in/johnsmilin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                >
                  <Linkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.a>
                <motion.a
                  href="https://github.com/Smilin01"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                >
                  <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.a>
                <motion.a
                  href="https://twitter.com/johnsmilin"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                >
                  <Twitter className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.a>
                <motion.a
                  href="https://youtube.com/@johnsmilin"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                >
                  <Youtube className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.a>
              </div>
            </motion.div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-4 text-center sm:text-left"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">Navigation</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base cursor-pointer"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-4 text-center sm:text-left"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">Support</h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={link.action}
                      className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base cursor-pointer"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-4 text-center sm:text-left"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <a 
                    href="mailto:johnsmilin6@gmail.com"
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
                  >
                    johnsmilin6@gmail.com
                  </a>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <span className="text-gray-600 text-sm sm:text-base">Available upon request</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <span className="text-gray-600 text-sm sm:text-base">Remote & Worldwide</span>
                </div>
              </div>
              <div className="pt-4">
                <a 
                  href="https://www.thesmilin.design" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  www.thesmilin.design
                </a>
              </div>
            </motion.div>
          </div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="border-t border-gray-300 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center"
          >
            <p className="text-gray-600 text-xs sm:text-sm">
              © 2025 John Smilin DS Portfolio. All Rights Reserved. Built with ❤️ by John Smilin DS
            </p>
          </motion.div>
        </div>
      </footer>

      {/* Policy Modals */}
      <HelpCentreModal 
        isOpen={helpCentreOpen} 
        onClose={() => setHelpCentreOpen(false)} 
      />
      <PrivacyPolicyModal 
        isOpen={privacyPolicyOpen} 
        onClose={() => setPrivacyPolicyOpen(false)} 
      />
      <TermsConditionsModal 
        isOpen={termsConditionsOpen} 
        onClose={() => setTermsConditionsOpen(false)} 
      />
      <InformationHelpModal 
        isOpen={informationHelpOpen} 
        onClose={() => setInformationHelpOpen(false)} 
      />
    </>
  );
};

export default Footer;