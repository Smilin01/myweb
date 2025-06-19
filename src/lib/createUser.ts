import { supabase } from './supabase';

export const createUserAccount = async () => {
  try {
    // First, try to sign in to check if user already exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'johnsmilin0@gmail.com',
      password: 'MySupabaseP@ss123'
    });

    // If sign in is successful, user already exists
    if (signInData?.user && !signInError) {
      console.log('User already exists and signed in successfully:', signInData);
      return { success: true, data: signInData };
    }

    // If user doesn't exist, create new account
    const { data, error } = await supabase.auth.signUp({
      email: 'johnsmilin0@gmail.com',
      password: 'MySupabaseP@ss123',
      options: {
        data: {
          full_name: 'John Smilin DS'
        }
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }

    console.log('User created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// Function to sign in the user
export const signInUser = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'johnsmilin0@gmail.com',
      password: 'MySupabaseP@ss123'
    });

    if (error) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message };
    }

    console.log('User signed in successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};