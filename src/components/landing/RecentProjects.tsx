import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, X, ExternalLink, Github, Eye, Code, Zap, Globe } from 'lucide-react';

interface Project {
  title: string;
  description: string;
  image: string;
  category: string;
  detailedDescription: string;
  features: string[];
  technologies: string[];
  liveDemo?: string;
  github?: string;
  status: 'completed' | 'in-progress' | 'coming-soon';
}

const RecentProjects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const categories = [
    { name: 'SaaS Development', color: 'text-gray-400' },
    { name: 'Web Development', color: 'text-gray-900' },
    { name: 'Custom Software', color: 'text-gray-400' }
  ];

  const projects: Project[] = [
    {
      title: 'All-in-One Productive Pro',
      description: 'Comprehensive web application featuring finance management, note-taking, AI-powered tools, and productivity modules all integrated seamlessly.',
      image: '/productive pro.png',
      category: 'SaaS Development',
      detailedDescription: 'A comprehensive productivity platform that combines multiple essential business tools into one seamless experience. This SaaS application features advanced finance management, intelligent note-taking systems, AI-powered content tools, and integrated productivity modules designed to streamline business operations.',
      features: [
        'Advanced Finance Management with income, expense, and budget tracking',
        'Intelligent Note-taking system with rich text editing and organization',
        'AI-powered content summarization and error correction tools',
        'Multiple productivity modules integrated into one platform',
        'Real-time collaboration and sharing capabilities',
        'Advanced analytics and reporting dashboard',
        'Mobile-responsive design for all devices',
        'Secure user authentication and data protection'
      ],
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AI Integration', 'Tailwind CSS'],
      status: 'completed'
    },
    {
      title: 'Business Website Creation',
      description: 'Creating professional business websites that convert visitors into customers with modern design, SEO optimization, and performance tuning.',
      image: '/Josg.png',
      category: 'Web Development',
      detailedDescription: 'A modern, professional business website designed to convert visitors into customers. Built with performance and SEO in mind, this website showcases the perfect blend of aesthetic appeal and functional excellence.',
      features: [
        'Modern, responsive design that works on all devices',
        'SEO-optimized structure for better search rankings',
        'Fast loading times with optimized performance',
        'Contact forms with automated email integration',
        'Professional portfolio and service showcases',
        'Blog system for content marketing',
        'Analytics integration for tracking performance',
        'Easy content management system'
      ],
      technologies: ['React', 'Next.js', 'Tailwind CSS', 'Supabase', 'TypeScript'],
      liveDemo: 'https://blesjosh.wiki/',
      status: 'completed'
    },
    {
      title: 'Pulsly - AI Feedback Analyzer',
      description: 'Advanced feedback collection and analysis platform with AI-powered sentiment analysis and comprehensive dashboard for business insights.',
      image: '/pulsly.png',
      category: 'SaaS Development',
      detailedDescription: 'An intelligent feedback collection and analysis platform that leverages AI to provide deep insights into customer sentiment and business performance. Pulsly transforms raw feedback into actionable business intelligence.',
      features: [
        'API key generation for seamless website integration',
        'Unique feedback link generation for customer surveys',
        'AI-powered sentiment analysis and emotional insights',
        'Comprehensive dashboard with real-time analytics',
        'Advanced reporting and data visualization',
        'Customer feedback management and organization',
        'Automated response suggestions based on AI analysis',
        'Integration capabilities with popular business tools'
      ],
      technologies: ['React', 'Python', 'AI/ML', 'REST API', 'PostgreSQL', 'Chart.js'],
      liveDemo: 'https://pulsly.netlify.app/',
      status: 'completed'
    },
    {
      title: 'Custom Software Solutions',
      description: 'Developing bespoke applications and software solutions tailored to specific business needs with cutting-edge technology and best practices.',
      image: '/Cover.png',
      category: 'Custom Software',
      detailedDescription: 'Tailored software solutions designed to meet specific business requirements. These custom applications are built with scalability, security, and user experience as top priorities.',
      features: [
        'Custom business logic implementation',
        'Scalable architecture for growing businesses',
        'Advanced user management and authentication',
        'Real-time data processing and analytics',
        'Third-party API integrations',
        'Automated workflow and process management',
        'Comprehensive admin dashboard',
        'Mobile and desktop compatibility'
      ],
      technologies: ['React', 'Node.js', 'MongoDB', 'Express.js', 'Socket.io', 'Docker'],
      status: 'completed'
    },
    {
      title: 'E-commerce Platform',
      description: 'Full-featured e-commerce solution with payment processing, inventory management, and customer analytics.',
      image: '/E commerce.png',
      category: 'Web Development',
      detailedDescription: 'A comprehensive e-commerce platform built for modern online businesses. Features advanced inventory management, secure payment processing, and detailed customer analytics.',
      features: [
        'Complete product catalog management',
        'Secure payment processing with multiple gateways',
        'Advanced inventory tracking and management',
        'Customer account management and profiles',
        'Order processing and fulfillment system',
        'Analytics dashboard for sales insights',
        'Mobile-optimized shopping experience',
        'SEO-friendly product pages'
      ],
      technologies: ['Next.js', 'Stripe', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
      status: 'in-progress'
    },
    {
      title: 'AI-Powered Analytics Dashboard',
      description: 'Intelligent business analytics platform with machine learning insights and predictive analytics.',
      image: '/AI dash.png',
      category: 'Custom Software',
      detailedDescription: 'An advanced analytics platform that uses artificial intelligence to provide predictive insights and automated business intelligence.',
      features: [
        'Machine learning-powered data analysis',
        'Predictive analytics and forecasting',
        'Real-time data visualization',
        'Automated report generation',
        'Custom KPI tracking and monitoring',
        'Integration with multiple data sources',
        'Advanced filtering and data exploration',
        'Export capabilities for presentations'
      ],
      technologies: ['React', 'Python', 'TensorFlow', 'D3.js', 'FastAPI', 'Redis'],
      status: 'coming-soon'
    }
  ];

  const nextProject = () => {
    setSelectedCategory((prev) => (prev + 1) % categories.length);
  };

  const prevProject = () => {
    setSelectedCategory((prev) => (prev - 1 + categories.length) % categories.length);
  };

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'coming-soon': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'coming-soon': return 'Coming Soon';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <section id="recent-projects" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12 sm:mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 text-center lg:text-left">
              CHECK OUT MY<br />
              RECENT PROJECTS
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column - Category Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6 lg:space-y-8"
            >
              <div className="flex lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0 lg:space-y-4 justify-center lg:justify-start">
                <motion.button
                  onClick={prevProject}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </motion.button>
                <motion.button
                  onClick={nextProject}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.button>
              </div>

              <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
                {categories.map((category, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedCategory(index)}
                    whileHover={{ x: 10 }}
                    className={`text-xl sm:text-2xl font-bold transition-colors block ${
                      selectedCategory === index ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="pt-6 sm:pt-8 text-center lg:text-left"
              >
                <motion.p 
                  key={selectedCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base"
                >
                  {projects.filter(p => p.category === categories[selectedCategory].name)[0]?.description || 
                   "Explore my latest projects showcasing modern web development, innovative SaaS solutions, and custom software applications built with cutting-edge technologies."}
                </motion.p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm sm:text-base mx-auto lg:mx-0"
                >
                  See all Projects
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Columns - Project Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects
                .filter(project => project.category === categories[selectedCategory].name)
                .slice(0, 2)
                .map((project, index) => (
                <motion.div
                  key={`${selectedCategory}-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                  onClick={() => openProjectModal(project)}
                >
                  <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-4">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>

                    {/* View Details Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white rounded-full p-3">
                        <Eye className="w-6 h-6 text-gray-900" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        {project.title}
                      </h3>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {project.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {showModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedProject.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">{selectedProject.category}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                        {getStatusText(selectedProject.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Image and Actions */}
                  <div className="space-y-6">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={selectedProject.image}
                        alt={selectedProject.title}
                        className="w-full h-64 sm:h-80 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {selectedProject.liveDemo && (
                        <motion.a
                          href={selectedProject.liveDemo}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Globe className="w-5 h-5" />
                          View Live Demo
                        </motion.a>
                      )}
                      {selectedProject.github && (
                        <motion.a
                          href={selectedProject.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          <Github className="w-5 h-5" />
                          View Code
                        </motion.a>
                      )}
                      {!selectedProject.liveDemo && !selectedProject.github && (
                        <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg">
                          <Zap className="w-5 h-5" />
                          {selectedProject.status === 'coming-soon' ? 'Coming Soon' : 'Private Project'}
                        </div>
                      )}
                    </div>

                    {/* Technologies */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Technologies Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Overview</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedProject.detailedDescription}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                      <ul className="space-y-3">
                        {selectedProject.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedProject.status === 'completed' && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Project Completed</h4>
                        <p className="text-green-700 text-sm">
                          This project has been successfully delivered and is currently live. 
                          All features are fully functional and optimized for performance.
                        </p>
                      </div>
                    )}

                    {selectedProject.status === 'in-progress' && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <h4 className="font-semibold text-yellow-900 mb-2">Work in Progress</h4>
                        <p className="text-yellow-700 text-sm">
                          This project is currently under development. Some features may not be 
                          fully implemented yet. Expected completion soon.
                        </p>
                      </div>
                    )}

                    {selectedProject.status === 'coming-soon' && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Coming Soon</h4>
                        <p className="text-blue-700 text-sm">
                          This exciting project is in the planning phase. Stay tuned for updates 
                          as development begins and features are implemented.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RecentProjects;