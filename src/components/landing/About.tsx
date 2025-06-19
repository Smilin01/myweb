import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Award, Clock, Heart } from 'lucide-react';
import { Card } from '../ui/card';

const About: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              About John Smilin DS
            </h3>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              A passionate freelance developer specializing in creating digital solutions 
              that drive business growth. With years of experience helping businesses 
              establish their online presence, I focus on delivering exceptional results 
              that exceed expectations.
            </p>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              My expertise spans web development, SaaS product creation, and custom 
              software solutions. I believe in the power of clean code, user-centered 
              design, and collaborative partnerships to create digital experiences 
              that truly make a difference.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <Card variant="neubrutalism" className="bg-gray-50 p-4 sm:p-6 text-center border border-gray-200">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Problem Solving</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Turning complex challenges into elegant solutions</p>
            </Card>

            <Card variant="lifted" className="bg-gray-50 p-4 sm:p-6 text-center border border-gray-200">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Client Focus</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Building lasting partnerships through collaboration</p>
            </Card>

            <Card variant="dots" className="bg-gray-50 p-4 sm:p-6 text-center border border-gray-200">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Modern Tech</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Leveraging cutting-edge tools and frameworks</p>
            </Card>

            <Card variant="corners" className="bg-gray-50 p-4 sm:p-6 text-center border border-gray-200">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">End-to-End</h4>
              <p className="text-gray-600 text-xs sm:text-sm">From concept to deployment and beyond</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;