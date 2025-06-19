import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Send, Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/toast';
import { useLocation } from 'react-router-dom';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  description: string;
  budget: string;
  referralCode?: string;
  timeline?: string;
}

const Contact: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [isReferralReadonly, setIsReferralReadonly] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ContactFormData>();
  const location = useLocation();

  // Watch the referralCode field for manual entries
  const watchedReferralCode = watch('referralCode');

  useEffect(() => {
    // Check for referral code from URL or session storage
    const urlPath = location.pathname;
    const urlReferralMatch = urlPath.match(/^\/ref\/(.+)$/);
    const isFromReferralLink = sessionStorage.getItem('isFromReferralLink') === 'true';
    
    if (urlReferralMatch && isFromReferralLink) {
      // If we're on a referral URL, use that code
      const urlReferralCode = urlReferralMatch[1];
      setReferralCode(urlReferralCode);
      setIsReferralReadonly(true);
      setValue('referralCode', urlReferralCode);
    } else {
      // Check localStorage for referral code (fallback)
      const storedReferralCode = localStorage.getItem('referralCode');
      const isFromLink = sessionStorage.getItem('isFromReferralLink') === 'true';
      
      if (storedReferralCode && isFromLink) {
        setReferralCode(storedReferralCode);
        setIsReferralReadonly(true);
        setValue('referralCode', storedReferralCode);
      }
    }
  }, [setValue, location.pathname]);

  // Track referral code changes for manual entries
  useEffect(() => {
    const trackManualReferralCode = async () => {
      if (!watchedReferralCode || isReferralReadonly || watchedReferralCode === referralCode) {
        return;
      }

      try {
        // Check if the manually entered referral code exists
        const { data: influencer, error } = await supabase
          .from('influencers')
          .select('id, referral_code')
          .eq('referral_code', watchedReferralCode)
          .maybeSingle();

        if (!error && influencer) {
          // Track the manual referral code entry
          const { error: clickError } = await supabase.from('referral_clicks').insert({
            referral_code: watchedReferralCode,
            ip_address: 'unknown',
            user_agent: navigator.userAgent,
            converted: false
          });

          if (!clickError) {
            // Store the manually entered referral code
            localStorage.setItem('referralCode', watchedReferralCode);
            toast.success('Valid referral code applied!');
          }
        }
      } catch (error) {
        console.error('Error validating manual referral code:', error);
      }
    };

    // Debounce the tracking to avoid too many API calls
    const timeoutId = setTimeout(trackManualReferralCode, 1000);
    return () => clearTimeout(timeoutId);
  }, [watchedReferralCode, isReferralReadonly, referralCode]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Use the referral code from state if it's readonly, otherwise use form data
      const finalReferralCode = isReferralReadonly ? referralCode : data.referralCode;
      
      // Store in Supabase
      const { error: dbError } = await supabase
        .from('contacts')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          project_type: data.projectType,
          description: data.description,
          budget: data.budget,
          referral_code: finalReferralCode || null,
          status: 'new'
        }]);

      if (dbError) throw dbError;

      // Send email via EmailJS only if public key is configured
      const emailjsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (emailjsPublicKey && emailjsPublicKey !== 'your_emailjs_public_key_here') {
        await emailjs.send(
          'service_71obdms',
          'template_m5ovmt3',
          {
            from_name: data.name,
            from_email: data.email,
            phone: data.phone || 'Not provided',
            project_type: data.projectType,
            message: data.description,
            budget: data.budget,
            referral_code: finalReferralCode || 'None',
            timeline: data.timeline || 'Not specified',
            to_email: 'Johnsmilin6@gmail.com'
          },
          emailjsPublicKey
        );
      }

      // Track referral conversion if applicable
      if (finalReferralCode) {
        const { error: conversionError } = await supabase
          .from('referral_clicks')
          .update({ converted: true })
          .eq('referral_code', finalReferralCode)
          .eq('converted', false);

        if (!conversionError) {
          // Update influencer's total referrals count
          const { error: updateError } = await supabase.rpc('increment_referral_count', {
            ref_code: finalReferralCode
          });

          if (updateError) {
            console.error('Error updating referral count:', updateError);
          }
        }
      }

      setIsSubmitted(true);
      reset();
      
      // Clear referral code from storage after successful submission
      if (isReferralReadonly || finalReferralCode) {
        localStorage.removeItem('referralCode');
        sessionStorage.removeItem('referralCode');
        sessionStorage.removeItem('isFromReferralLink');
        setReferralCode('');
        setIsReferralReadonly(false);
      }
      
      toast.success('Message sent successfully! I\'ll get back to you soon.');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg border border-gray-200"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Thank You!
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Your message has been sent successfully. I'll review your project details and get back to you within 24 hours.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Send Another Message
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Let's Work Together
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to bring your ideas to life? Let's discuss your project and create something amazing together.
          </p>
          <div className="w-16 sm:w-24 h-1 bg-gray-900 mx-auto mt-4 sm:mt-6"></div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Get in Touch
              </h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Email</h4>
                    <p className="text-gray-600 text-sm sm:text-base">Johnsmilin6@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Phone</h4>
                    <p className="text-gray-600 text-sm sm:text-base">Available upon request</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Location</h4>
                    <p className="text-gray-600 text-sm sm:text-base">Remote & Worldwide</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Why Choose Me?</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Fast turnaround times</span>
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Modern technology stack</span>
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Transparent communication</span>
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Post-launch support</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type *
                  </label>
                  <select
                    {...register('projectType', { required: 'Project type is required' })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Select project type</option>
                    <option value="Business Website">Business Website</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="SaaS Product">SaaS Product</option>
                    <option value="Custom Software">Custom Software</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.projectType && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.projectType.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Tell me about your project..."
                />
                {errors.description && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  <select
                    {...register('budget')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Select budget range</option>
                    <option value="₹83k-4.2L">₹83k - ₹4.2L</option>
                    <option value="₹4.2L-8.3L">₹4.2L - ₹8.3L</option>
                    <option value="₹8.3L-21L">₹8.3L - ₹21L</option>
                    <option value="₹21L+">₹21L+</option>
                    <option value="Let's Discuss">Let's Discuss</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                    {isReferralReadonly && (
                      <span className="text-xs text-green-600 ml-2">(Applied from referral link)</span>
                    )}
                  </label>
                  {isReferralReadonly ? (
                    <input
                      type="text"
                      value={referralCode}
                      readOnly
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-green-300 rounded-lg bg-green-50 text-green-800 cursor-not-allowed text-sm sm:text-base"
                    />
                  ) : (
                    <input
                      {...register('referralCode')}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter referral code"
                    />
                  )}
                  {isReferralReadonly && (
                    <p className="text-xs text-green-600 mt-1">
                      This referral code was automatically applied from your referral link.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline/Deadline
                </label>
                <input
                  {...register('timeline')}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="When do you need this completed?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;