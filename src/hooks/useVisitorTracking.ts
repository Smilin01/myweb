import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  uniqueVisitors: number;
  recentVisitors: any[];
}

export const useVisitorTracking = () => {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    todayVisitors: 0,
    uniqueVisitors: 0,
    recentVisitors: []
  });
  const [loading, setLoading] = useState(true);

  const trackVisitor = async () => {
    try {
      console.log('Starting visitor tracking...');
      
      // Get or create session ID
      let sessionId = sessionStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem('visitor_session_id', sessionId);
        console.log('Created new session ID:', sessionId);
      } else {
        console.log('Using existing session ID:', sessionId);
      }

      // Get visitor data
      const pageUrl = window.location.href;
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;

      console.log('Visitor data:', {
        sessionId,
        pageUrl,
        userAgent,
        referrer
      });

      // Check if visitor exists
      const { data: existingVisitor, error: checkError } = await supabase
        .from('visitors')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking visitor:', checkError);
      }

      if (existingVisitor) {
        console.log('Updating existing visitor...');
        // Update existing visitor
        const { error: updateError } = await supabase
          .from('visitors')
          .update({
            page_url: pageUrl,
            user_agent: userAgent,
            referrer: referrer,
            last_seen_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);

        if (updateError) {
          console.error('Error updating visitor:', updateError);
        } else {
          console.log('Visitor updated successfully');
        }
      } else {
        console.log('Creating new visitor...');
        // Create new visitor
        const { error: insertError } = await supabase
          .from('visitors')
          .insert({
            session_id: sessionId,
            page_url: pageUrl,
            user_agent: userAgent,
            referrer: referrer
          });

        if (insertError) {
          console.error('Error creating visitor:', insertError);
        } else {
          console.log('New visitor created successfully');
        }
      }
    } catch (error) {
      console.error('Error in trackVisitor:', error);
    }
  };

  const fetchVisitorStats = async () => {
    try {
      console.log('Fetching visitor stats...');
      setLoading(true);

      // Get total visitors
      const { count: totalVisitors, error: totalError } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total visitors:', totalError);
      }

      // Get today's visitors
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayVisitors, error: todayError } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (todayError) {
        console.error('Error fetching today visitors:', todayError);
      }

      // Get unique visitors (based on session_id)
      const { data: uniqueVisitorsData, error: uniqueError } = await supabase
        .from('visitors')
        .select('session_id')
        .order('created_at', { ascending: false });

      if (uniqueError) {
        console.error('Error fetching unique visitors:', uniqueError);
      }

      const uniqueVisitors = new Set(uniqueVisitorsData?.map(v => v.session_id) || []).size;

      // Get recent visitors
      const { data: recentVisitors, error: recentError } = await supabase
        .from('visitors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('Error fetching recent visitors:', recentError);
      }

      console.log('Stats fetched:', {
        totalVisitors,
        todayVisitors,
        uniqueVisitors,
        recentVisitorsCount: recentVisitors?.length
      });

      setStats({
        totalVisitors: totalVisitors || 0,
        todayVisitors: todayVisitors || 0,
        uniqueVisitors,
        recentVisitors: recentVisitors || []
      });
    } catch (error) {
      console.error('Error in fetchVisitorStats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useVisitorTracking hook mounted');
    trackVisitor();
    fetchVisitorStats();

    // Set up periodic refresh of stats
    const interval = setInterval(fetchVisitorStats, 60000); // Refresh every minute

    return () => {
      console.log('useVisitorTracking hook unmounted');
      clearInterval(interval);
    };
  }, []);

  return {
    stats,
    loading,
    refreshStats: fetchVisitorStats,
    trackVisitor
  };
}; 