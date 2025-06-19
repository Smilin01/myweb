import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LandingPage from './LandingPage';

const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);

  useEffect(() => {
    const trackReferral = async () => {
      if (!code) {
        setIsValidCode(false);
        return;
      }

      try {
        // Check if referral code exists
        const { data: influencer, error } = await supabase
          .from('influencers')
          .select('id, referral_code')
          .eq('referral_code', code)
          .maybeSingle();

        if (error) {
          console.error('Error checking referral code:', error);
          setIsValidCode(false);
          return;
        }

        if (influencer) {
          setIsValidCode(true);
          
          // Track the referral click
          const { error: clickError } = await supabase.from('referral_clicks').insert({
            referral_code: code,
            ip_address: 'unknown',
            user_agent: navigator.userAgent,
            converted: false
          });

          if (clickError) {
            console.error('Error tracking referral click:', clickError);
          }

          // Store referral code in localStorage and sessionStorage for persistence
          localStorage.setItem('referralCode', code);
          sessionStorage.setItem('referralCode', code);
          sessionStorage.setItem('isFromReferralLink', 'true');
        } else {
          setIsValidCode(false);
        }
      } catch (error) {
        console.error('Error tracking referral:', error);
        setIsValidCode(false);
      }
    };

    trackReferral();
  }, [code]);

  // Show loading while checking referral code
  if (isValidCode === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If invalid code, redirect to home
  if (isValidCode === false) {
    window.location.href = '/';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render the landing page while maintaining the referral URL
  return <LandingPage />;
};

export default ReferralLanding;