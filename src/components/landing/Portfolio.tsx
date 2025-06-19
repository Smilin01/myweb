import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Star, Zap, Brain, TrendingUp } from 'lucide-react';

const Portfolio: React.FC = () => {
  const projects = [
    {
      title: 'All-in-One Productive Pro',
      description: 'Comprehensive web application featuring finance management, note-taking, AI-powered tools, and productivity modules all integrated seamlessly.',
      image: '/neo.png',
      features: [
        'Finance module for income, expense, and budget management',
        'Note-taking and content creation tools',
        'AI-powered summarization and error correction',
        'Multiple productivity modules integrated'
      ],
      tech: ['React', 'Node.js', 'MongoDB', 'AI Integration'],
      icon: Star
    },
    {
      title: 'Pulsly - AI Feedback Analyzer',
      description: 'Advanced feedback collection and analysis platform with AI-powered sentiment analysis and comprehensive dashboard for business insights.',
      image: '/startup.png',
      features: [
        'API key generation for website integration',
        'Unique link generation for customer feedback',
        'AI-powered sentiment analysis and insights',
        'Dashboard for feedback management and reporting'
      ],
      tech: ['React', 'Python', 'AI/ML', 'REST API'],
      icon: Brain
    },
    {
      title: 'Custom Business Solutions',
      description: 'Showcase of various business websites and applications created for different industries, optimized for performance and user engagement.',
      image: '/webui.png',
      features: [
        'Industry-specific design templates',
        'Performance optimization and SEO',
        'Mobile-first responsive design',
        'Analytics and conversion tracking'
      ],
      tech: ['React', 'Next.js', 'Tailwind CSS', 'Analytics'],
      icon: TrendingUp
    },
    {
      title: 'SaaS Platform Development',
      description: 'End-to-end SaaS solutions with user authentication, subscription management, and scalable architecture for growing businesses.',
      image: '/joshweb.png',
      features: [
        'User authentication and authorization',
        'Subscription and payment management',
        'Scalable cloud architecture',
        'Real-time features and notifications'
      ],
      tech: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      icon: Zap
    }
  ];

  return (
    <section id="portfolio" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
            My Portfolio
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
            A showcase of innovative projects that demonstrate expertise in modern web development and SaaS solutions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group border border-gray-200"
            >
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                <div className="absolute top-4 left-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                    <project.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {project.title}
                </h3>
                
                <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  {project.description}
                </p>

                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {project.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start text-xs sm:text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mr-2 sm:mr-3 mt-1.5 sm:mt-2 flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm sm:text-base border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                    View Live
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-gray-800 font-medium transition-colors text-sm sm:text-base px-4 py-2 rounded-lg">
                    <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                    Source Code
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;