import React, { useEffect } from 'react';
import { useVisitorTracking } from '../../hooks/useVisitorTracking';

const LandingPage: React.FC = () => {
  const { trackVisitor } = useVisitorTracking();

  useEffect(() => {
    console.log('LandingPage mounted - tracking visitor');
    trackVisitor();
  }, [trackVisitor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Your existing landing page content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Our Site</h1>
        <p className="mt-4 text-lg text-gray-600">This is the landing page where visitor tracking is active.</p>
      </div>
    </div>
  );
};

export default LandingPage; 