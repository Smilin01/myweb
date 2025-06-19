import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Zap, Settings, Code, ChevronDown, ChevronUp, Palette, Layers, X, CheckCircle, ArrowRight, Star } from 'lucide-react';

const Services: React.FC = () => {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<any>(null);

  const services = [
    {
      icon: Palette,
      title: 'Landing Page Design',
      description: 'High-converting landing pages optimized for lead generation and designed to maximize your marketing ROI.',
      details: [
        'Conversion-focused design and layout',
        'A/B testing ready templates',
        'Mobile-first responsive approach',
        'Analytics and tracking integration',
        'Fast loading optimization',
        'SEO-friendly structure'
      ]
    },
    {
      icon: Settings,
      title: 'SaaS Product',
      description: 'Complete software-as-a-service solutions with scalable architecture and modern features.',
      details: [
        'User authentication and authorization',
        'Subscription and payment management',
        'Real-time features and notifications',
        'Scalable cloud architecture',
        'API development and integration',
        'Admin dashboard and analytics'
      ]
    },
    {
      icon: Code,
      title: 'Software',
      description: 'Custom software solutions built to solve specific business challenges with cutting-edge technology.',
      details: [
        'Custom business logic implementation',
        'Database design and optimization',
        'Third-party API integrations',
        'Cloud deployment and hosting',
        'Performance optimization',
        'Maintenance and support'
      ]
    },
    {
      icon: Globe,
      title: 'Web Design',
      description: 'Modern, responsive websites optimized for performance and user experience.',
      details: [
        'Responsive design for all devices',
        'Modern UI/UX principles',
        'SEO optimization',
        'Performance optimization',
        'Content management systems',
        'E-commerce functionality'
      ]
    },
    {
      icon: Layers,
      title: 'Full Stack Web',
      description: 'Complete web applications with both frontend and backend development.',
      details: [
        'Frontend development (React, Vue, Angular)',
        'Backend development (Node.js, Python)',
        'Database design and management',
        'API development and integration',
        'DevOps and deployment',
        'Testing and quality assurance'
      ]
    }
  ];

  // Detailed service information for modals
  const serviceDetails = {
    'Landing Page Design': {
      title: 'Landing Page Design',
      subtitle: 'High-Converting Pages That Drive Results',
      description: 'Transform your marketing campaigns with professionally designed landing pages that convert visitors into customers. Every element is strategically placed to guide users toward your desired action.',
      features: [
        {
          title: 'Conversion Optimization',
          description: 'Strategic placement of elements, compelling CTAs, and psychological triggers to maximize conversion rates.',
          icon: '🎯'
        },
        {
          title: 'A/B Testing Ready',
          description: 'Built-in support for testing different versions to continuously improve performance.',
          icon: '📊'
        },
        {
          title: 'Mobile-First Design',
          description: 'Optimized for mobile devices where most of your traffic comes from.',
          icon: '📱'
        },
        {
          title: 'Fast Loading',
          description: 'Optimized for speed with compressed images, efficient code, and CDN integration.',
          icon: '⚡'
        },
        {
          title: 'Analytics Integration',
          description: 'Built-in tracking for Google Analytics, Facebook Pixel, and other marketing tools.',
          icon: '📈'
        },
        {
          title: 'SEO Optimized',
          description: 'Search engine friendly structure to help your pages rank higher in search results.',
          icon: '🔍'
        }
      ],
      process: [
        'Strategy & Research - Understanding your goals and target audience',
        'Wireframing - Creating the blueprint for optimal user flow',
        'Design & Development - Building beautiful, functional pages',
        'Testing & Optimization - Ensuring maximum conversion rates',
        'Launch & Monitor - Going live with ongoing performance tracking'
      ],
      pricing: {
        starting: '₹4,000',
        timeline: '1-2 weeks',
        includes: ['Custom design', 'Mobile optimization', 'Analytics setup', '30-day support']
      }
    },
    'SaaS Product': {
      title: 'SaaS Product Development',
      subtitle: 'Complete Software-as-a-Service Solutions',
      description: 'Build scalable SaaS applications that grow with your business. From MVP to enterprise-level platforms, I create robust solutions with modern architecture and user-centric design.',
      features: [
        {
          title: 'User Management',
          description: 'Complete authentication system with role-based access control and user profiles.',
          icon: '👥'
        },
        {
          title: 'Subscription Billing',
          description: 'Integrated payment processing with Razorpay, subscription management, and billing automation.',
          icon: '💳'
        },
        {
          title: 'Real-time Features',
          description: 'Live updates, notifications, and collaborative features for enhanced user experience.',
          icon: '🔄'
        },
        {
          title: 'Scalable Architecture',
          description: 'Cloud-native design that scales automatically with your user base and data growth.',
          icon: '☁️'
        },
        {
          title: 'API Development',
          description: 'RESTful APIs and webhooks for third-party integrations and mobile app support.',
          icon: '🔌'
        },
        {
          title: 'Admin Dashboard',
          description: 'Comprehensive admin panel for managing users, analytics, and business operations.',
          icon: '📊'
        }
      ],
      process: [
        'Discovery & Planning - Defining features, user stories, and technical requirements',
        'MVP Development - Building core functionality for early validation',
        'User Testing - Gathering feedback and iterating on the product',
        'Full Development - Implementing advanced features and integrations',
        'Launch & Scale - Deploying to production with monitoring and optimization'
      ],
      pricing: {
        starting: '₹15,000',
        timeline: '8-16 weeks',
        includes: ['Full-stack development', 'Payment integration', 'Admin dashboard', '90-day support']
      }
    },
    'Software': {
      title: 'Custom Software Development',
      subtitle: 'Tailored Solutions for Unique Business Needs',
      description: 'Create bespoke software applications that solve your specific business challenges. From automation tools to complex business systems, I build solutions that streamline your operations.',
      features: [
        {
          title: 'Business Logic',
          description: 'Custom algorithms and workflows tailored to your specific business processes.',
          icon: '⚙️'
        },
        {
          title: 'Database Design',
          description: 'Optimized database architecture for efficient data storage and retrieval.',
          icon: '🗄️'
        },
        {
          title: 'API Integrations',
          description: 'Seamless connections with existing tools and third-party services.',
          icon: '🔗'
        },
        {
          title: 'Cloud Deployment',
          description: 'Secure, scalable hosting on AWS, Google Cloud, or Azure platforms.',
          icon: '☁️'
        },
        {
          title: 'Performance Optimization',
          description: 'Code optimization and caching strategies for maximum efficiency.',
          icon: '🚀'
        },
        {
          title: 'Ongoing Support',
          description: 'Maintenance, updates, and feature enhancements as your business grows.',
          icon: '🛠️'
        }
      ],
      process: [
        'Requirements Analysis - Understanding your business processes and pain points',
        'System Design - Architecting the solution with scalability in mind',
        'Development - Building the software with clean, maintainable code',
        'Testing & QA - Comprehensive testing to ensure reliability',
        'Deployment & Training - Going live with user training and documentation'
      ],
      pricing: {
        starting: '₹20,000',
        timeline: '6-12 weeks',
        includes: ['Custom development', 'Database design', 'Cloud hosting setup', '60-day support']
      }
    },
    'Web Design': {
      title: 'Modern Web Design',
      subtitle: 'Beautiful, Responsive Websites That Perform',
      description: 'Create stunning websites that not only look amazing but also drive business results. Every design is crafted with user experience and conversion optimization in mind.',
      features: [
        {
          title: 'Responsive Design',
          description: 'Perfect display across all devices - desktop, tablet, and mobile.',
          icon: '📱'
        },
        {
          title: 'Modern UI/UX',
          description: 'Contemporary design principles focused on user experience and accessibility.',
          icon: '🎨'
        },
        {
          title: 'SEO Foundation',
          description: 'Built-in SEO best practices to help your site rank higher in search results.',
          icon: '🔍'
        },
        {
          title: 'Performance Optimized',
          description: 'Fast loading times with optimized images, code, and hosting configuration.',
          icon: '⚡'
        },
        {
          title: 'Content Management',
          description: 'Easy-to-use CMS for updating content without technical knowledge.',
          icon: '📝'
        },
        {
          title: 'E-commerce Ready',
          description: 'Online store functionality with secure payment processing and inventory management.',
          icon: '🛒'
        }
      ],
      process: [
        'Brand Discovery - Understanding your brand identity and target audience',
        'Design Mockups - Creating visual concepts and getting your approval',
        'Development - Building the website with clean, semantic code',
        'Content Integration - Adding your content and optimizing for search engines',
        'Launch & Optimize - Going live with performance monitoring and improvements'
      ],
      pricing: {
        starting: '₹6,000',
        timeline: '3-5 weeks',
        includes: ['Custom design', 'CMS setup', 'SEO optimization', '45-day support']
      }
    },
    'Full Stack Web': {
      title: 'Full Stack Web Development',
      subtitle: 'Complete Web Applications from Frontend to Backend',
      description: 'Build comprehensive web applications with both beautiful user interfaces and powerful backend systems. Perfect for complex business applications and data-driven platforms.',
      features: [
        {
          title: 'Frontend Development',
          description: 'Modern JavaScript frameworks like React, Vue.js, or Angular for dynamic user interfaces.',
          icon: '💻'
        },
        {
          title: 'Backend Development',
          description: 'Robust server-side development with Node.js, Python, or other modern technologies.',
          icon: '⚙️'
        },
        {
          title: 'Database Management',
          description: 'Efficient database design and management with SQL and NoSQL solutions.',
          icon: '🗄️'
        },
        {
          title: 'API Development',
          description: 'RESTful APIs and GraphQL endpoints for seamless data communication.',
          icon: '🔌'
        },
        {
          title: 'DevOps & Deployment',
          description: 'Automated deployment pipelines and cloud infrastructure management.',
          icon: '🚀'
        },
        {
          title: 'Quality Assurance',
          description: 'Comprehensive testing including unit tests, integration tests, and end-to-end testing.',
          icon: '✅'
        }
      ],
      process: [
        'Architecture Planning - Designing the technical architecture and technology stack',
        'Backend Development - Building APIs, databases, and server-side logic',
        'Frontend Development - Creating user interfaces and user experience',
        'Integration & Testing - Connecting all components and comprehensive testing',
        'Deployment & Monitoring - Launching with performance monitoring and analytics'
      ],
      pricing: {
        starting: '₹10,000',
        timeline: '10-16 weeks',
        includes: ['Full-stack development', 'Database setup', 'API development', '90-day support']
      }
    }
  };

  const toggleService = (title: string) => {
    setExpandedService(expandedService === title ? null : title);
  };

  const openServiceDetail = (serviceTitle: string) => {
    setSelectedServiceDetail(serviceDetails[serviceTitle as keyof typeof serviceDetails]);
    setShowDetailModal(true);
  };

  return (
    <section id="services" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 text-center lg:text-left">
            My Services
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            It is a curated collection of works that not only captures the essence of their artistic vision but also 
            demonstrates their ability to think critically, innovate, and communicate effectively.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Services List */}
          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <motion.button
                  onClick={() => toggleService(service.title)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors text-left"
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                      <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{service.title}</h3>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedService === service.title ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {expandedService === service.title && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-6 pt-0 space-y-4">
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                          {service.description}
                        </p>
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">What's included:</h4>
                          <ul className="space-y-2">
                            {service.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-start text-xs sm:text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Right Column - Featured Service */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-2xl p-6 sm:p-8 space-y-6 h-fit"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Service</h3>
              <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Full Stack Development</h4>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Complete end-to-end development services from concept to deployment. I handle both frontend and backend 
                development, ensuring seamless integration and optimal performance across all components of your application.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6">
              <blockquote className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                "Quality development is not about using the latest technology, it's about solving real problems with the right tools"
              </blockquote>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">My Approach</h5>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    I focus on creating scalable, maintainable solutions that grow with your business. Every project 
                    starts with understanding your unique requirements and ends with a solution that exceeds expectations.
                  </p>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  From initial consultation to post-launch support, I ensure transparent communication and deliver 
                  solutions that provide real business value and exceptional user experiences.
                </p>
                
                <motion.button
                  onClick={() => openServiceDetail('Full Stack Web')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
                >
                  Learn More
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedServiceDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedServiceDetail.title}</h2>
                    <p className="text-gray-600 mt-1">{selectedServiceDetail.subtitle}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Description */}
                <div>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {selectedServiceDetail.description}
                  </p>
                </div>

                {/* Features Grid */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Key Features & Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedServiceDetail.features.map((feature: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{feature.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Process */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                    Development Process
                  </h3>
                  <div className="space-y-4">
                    {selectedServiceDetail.process.map((step: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 pt-1">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Investment & Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Starting Price</h4>
                      <p className="text-2xl font-bold text-blue-600">{selectedServiceDetail.pricing.starting}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Timeline</h4>
                      <p className="text-lg text-gray-700">{selectedServiceDetail.pricing.timeline}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Includes</h4>
                      <ul className="space-y-1">
                        {selectedServiceDetail.pricing.includes.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-4">
                  <motion.button
                    onClick={() => {
                      setShowDetailModal(false);
                      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
                  >
                    Get Started with {selectedServiceDetail.title}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <p className="text-sm text-gray-600 mt-3">
                    Ready to discuss your project? Let's talk about how I can help bring your vision to life.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Services;