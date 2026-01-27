import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useUser } from '@/src/contexts/UserContext';
import { ThemedView } from '@/components/themed-view';

export default function IndexScreen() {
  const { session, profile, loading, isNewUser } = useUser();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session) {
      // Not signed in, redirect to login
      if (!inAuthGroup) {
        router.replace('/auth/login');
      }
    } else if (session) {
      // Signed in
      if (isNewUser || !profile) {
        // New user or no profile, redirect to profile creation
        router.replace('/auth/create-profile');
      } else {
        // Has profile, redirect to home
        router.replace('/(tabs)/home');
      }
    }
  }, [session, profile, loading, isNewUser, segments]);

  // Show loading screen while checking auth state
  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
});