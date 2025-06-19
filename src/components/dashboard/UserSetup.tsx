import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Key, CheckCircle } from 'lucide-react';
import { createUserAccount, signInUser } from '../../lib/createUser';
import { toast } from '../ui/toast';

const UserSetup: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [userCreated, setUserCreated] = useState(false);

  const handleCreateUser = async () => {
    setIsCreating(true);
    try {
      const result = await createUserAccount();
      if (result.success) {
        setUserCreated(true);
        toast.success('User account created successfully!');
      } else {
        toast.error(`Failed to create user: ${result.error}`);
      }
    } catch (error) {
      toast.error('Error creating user account');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signInUser();
      if (result.success) {
        toast.success('Successfully signed in!');
        window.location.href = '/app';
      } else {
        toast.error(`Failed to sign in: ${result.error}`);
      }
    } catch (error) {
      toast.error('Error signing in');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">User Setup</h1>
          <p className="text-gray-600 mt-2">Create your dashboard account</p>
        </div>

        <div className="space-y-6">
          {/* User Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">johnsmilin0@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <Key className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Name</p>
                  <p className="text-sm text-gray-600">John Smilin DS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!userCreated ? (
              <button
                onClick={handleCreateUser}
                disabled={isCreating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Create User Account
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center text-green-600 py-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Account Created Successfully!</span>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Or go to{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login Page
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSetup;