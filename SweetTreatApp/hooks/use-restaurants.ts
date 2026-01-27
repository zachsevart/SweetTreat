import { useState, useEffect } from 'react';
import { supabase } from '@/src/services/supabase';
import { Restaurant } from '@/src/types';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      console.log('Starting to fetch restaurants...');
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .not('name', 'is', null);

      console.log('Fetch completed. Data:', data);
      console.log('Fetch error:', fetchError);

      if (fetchError) throw fetchError;

        setRestaurants(data || []);
        console.log('Restaurants set successfully:', data?.length);
    } catch (err) {
        console.error('ERROR in fetchRestaurants:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch restaurants');
    } finally {
        setLoading(false);
    }
  };

  return { restaurants, loading, error, refetch: fetchRestaurants };
}