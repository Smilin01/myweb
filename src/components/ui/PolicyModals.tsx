import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Shield, FileText, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const HelpCentreModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Help Centre"
      icon={<HelpCircle className="w-5 h-5 text-blue-600" />}
    >
      <div className="space-y-8">
        <div className="prose max-w-none">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">How do I get started with my project?</h4>
              <p className="text-gray-700">
                Getting started is simple! Fill out the contact form on our website with your project details, 
                and I'll get back to you within 24 hours to discuss your requirements, timeline, and budget.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">What types of projects do you work on?</h4>
              <p className="text-gray-700">
                I specialize in business websites, landing pages, SaaS products, and custom software solutions. 
                Whether you need a simple website or a complex web application, I can help bring your vision to life.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">How long does a typical project take?</h4>
              <p className="text-gray-700">
                Project timelines vary based on complexity. Landing pages typically take 1-2 weeks, 
                business websites 3-5 weeks, and SaaS applications 8-16 weeks. I'll provide a detailed 
                timeline during our initial consultation.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Do you provide ongoing support?</h4>
              <p className="text-gray-700">
                Yes! All projects include post-launch support. I offer maintenance packages and can help 
                with updates, bug fixes, and new features as your business grows.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">What technologies do you use?</h4>
              <p className="text-gray-700">
                I use modern technologies including React, Next.js, TypeScript, Node.js, Supabase, 
                and Tailwind CSS to build fast, scalable, and maintainable applications.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Still have questions?</h4>
            <p className="text-blue-700 mb-4">
              Can't find the answer you're looking for? Feel free to reach out directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="mailto:johnsmilin6@gmail.com"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Email Support
              </a>
              <button 
                onClick={() => {
                  onClose();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Contact Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const PrivacyPolicyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      icon={<Shield className="w-5 h-5 text-blue-600" />}
    >
      <div className="space-y-6">
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> January 2025
          </p>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Information We Collect</h3>
              <p className="text-gray-700 mb-4">
                When you use our services or contact us, we may collect the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Name and contact information (email, phone number)</li>
                <li>Project requirements and business information</li>
                <li>Communication preferences</li>
                <li>Website usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">How We Use Your Information</h3>
              <p className="text-gray-700 mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>To provide and improve our services</li>
                <li>To communicate with you about your projects</li>
                <li>To send project updates and important notifications</li>
                <li>To analyze website performance and user experience</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Information Sharing</h3>
              <p className="text-gray-700">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy. We may share information with 
                trusted service providers who assist us in operating our website and conducting business.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Data Security</h3>
              <p className="text-gray-700">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of 
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Your Rights</h3>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h3>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700">
                  <strong>Email:</strong> johnsmilin6@gmail.com<br />
                  <strong>Website:</strong> www.thesmilin.design
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const TermsConditionsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Terms & Conditions"
      icon={<FileText className="w-5 h-5 text-blue-600" />}
    >
      <div className="space-y-6">
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> January 2025
          </p>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Agreement to Terms</h3>
              <p className="text-gray-700">
                By accessing and using our services, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please 
                do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Services</h3>
              <p className="text-gray-700 mb-4">
                John Smilin DS provides web development services including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Business website development</li>
                <li>Landing page creation</li>
                <li>SaaS product development</li>
                <li>Custom software solutions</li>
                <li>Website maintenance and support</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Project Terms</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Terms</h4>
                  <p className="text-gray-700">
                    Payment schedules are agreed upon before project commencement. Typically, 
                    a 50% deposit is required to begin work, with the remainder due upon completion.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Project Timeline</h4>
                  <p className="text-gray-700">
                    Timelines are estimates and may vary based on project complexity and client 
                    feedback response times. Delays caused by client feedback or content provision 
                    may extend the timeline.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Revisions</h4>
                  <p className="text-gray-700">
                    Each project includes a specified number of revisions. Additional revisions 
                    beyond the agreed scope may incur additional charges.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Intellectual Property</h3>
              <p className="text-gray-700">
                Upon full payment, clients receive full ownership of the final deliverables. 
                However, John Smilin DS retains the right to showcase the work in portfolios 
                and marketing materials unless otherwise agreed.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Limitation of Liability</h3>
              <p className="text-gray-700">
                John Smilin DS shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, including without limitation, loss of profits, 
                data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Termination</h3>
              <p className="text-gray-700">
                Either party may terminate the agreement with written notice. In case of termination, 
                payment for work completed up to the termination date will be due.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  For questions about these Terms & Conditions, contact:<br />
                  <strong>Email:</strong> johnsmilin6@gmail.com<br />
                  <strong>Website:</strong> www.thesmilin.design
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const InformationHelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Information Help"
      icon={<Info className="w-5 h-5 text-blue-600" />}
    >
      <div className="space-y-6">
        <div className="prose max-w-none">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Getting Started</h3>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Ready to start your project?</h4>
                <ol className="list-decimal list-inside text-blue-700 space-y-2">
                  <li>Fill out the contact form with your project details</li>
                  <li>Schedule a consultation call to discuss requirements</li>
                  <li>Receive a detailed proposal and timeline</li>
                  <li>Sign the agreement and make the initial payment</li>
                  <li>Project development begins!</li>
                </ol>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Landing Pages</h4>
                  <p className="text-gray-700 text-sm mb-2">Starting from ₹4,000</p>
                  <p className="text-gray-600 text-sm">Timeline: 1-2 weeks</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Business Websites</h4>
                  <p className="text-gray-700 text-sm mb-2">Starting from ₹6,000</p>
                  <p className="text-gray-600 text-sm">Timeline: 3-5 weeks</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">SaaS Products</h4>
                  <p className="text-gray-700 text-sm mb-2">Starting from ₹15,000</p>
                  <p className="text-gray-600 text-sm">Timeline: 8-16 weeks</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Custom Software</h4>
                  <p className="text-gray-700 text-sm mb-2">Starting from ₹20,000</p>
                  <p className="text-gray-600 text-sm">Timeline: 6-12 weeks</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">What's Included</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">All Projects Include:</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Responsive design for all devices</li>
                    <li>Modern, clean user interface</li>
                    <li>SEO optimization</li>
                    <li>Performance optimization</li>
                    <li>Cross-browser compatibility</li>
                    <li>Post-launch support</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Technology Stack</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  I use modern, industry-standard technologies to ensure your project is:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="font-semibold text-gray-900 text-sm">Frontend</p>
                    <p className="text-gray-600 text-xs">React, Next.js, TypeScript</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="font-semibold text-gray-900 text-sm">Backend</p>
                    <p className="text-gray-600 text-xs">Node.js, Supabase</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="font-semibold text-gray-900 text-sm">Styling</p>
                    <p className="text-gray-600 text-xs">Tailwind CSS</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="font-semibold text-gray-900 text-sm">Database</p>
                    <p className="text-gray-600 text-xs">PostgreSQL</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Need More Information?</h3>
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <p className="text-green-700 mb-4">
                  Have specific questions about your project? I'm here to help!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => {
                      onClose();
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Your Project
                  </button>
                  <a 
                    href="mailto:johnsmilin6@gmail.com"
                    className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors text-center"
                  >
                    Ask a Question
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const usePolicyModals = () => {
  const [helpCentreOpen, setHelpCentreOpen] = useState(false);
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [termsConditionsOpen, setTermsConditionsOpen] = useState(false);
  const [informationHelpOpen, setInformationHelpOpen] = useState(false);

  const openModal = (modalType: string) => {
    switch (modalType) {
      case 'help':
        setHelpCentreOpen(true);
        break;
      case 'privacy':
        setPrivacyPolicyOpen(true);
        break;
      case 'terms':
        setTermsConditionsOpen(true);
        break;
      case 'info':
        setInformationHelpOpen(true);
        break;
    }
  };

  const closeAllModals = () => {
    setHelpCentreOpen(false);
    setPrivacyPolicyOpen(false);
    setTermsConditionsOpen(false);
    setInformationHelpOpen(false);
  };

  return {
    helpCentreOpen,
    privacyPolicyOpen,
    termsConditionsOpen,
    informationHelpOpen,
    openModal,
    closeAllModals,
    setHelpCentreOpen,
    setPrivacyPolicyOpen,
    setTermsConditionsOpen,
    setInformationHelpOpen,
  };
};