import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUser } from '@/src/contexts/UserContext';

export default function HomeScreen() {
  const { profile } = useUser();

  const greeting = profile?.username ? `Hey, ${profile.username}` : 'Hey there';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.greeting}>
          {greeting}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          What are you craving?
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate('/(tabs)/swipe')}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.cardEmoji}>🍰</ThemedText>
          <ThemedText style={styles.cardTitle}>Discover</ThemedText>
          <ThemedText style={styles.cardDescription}>
            Swipe through dessert spots near you
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate('/(tabs)/map')}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.cardEmoji}>🗺️</ThemedText>
          <ThemedText style={styles.cardTitle}>Explore</ThemedText>
          <ThemedText style={styles.cardDescription}>
            Browse dessert places on the map
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate('/saved-places' as any)}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.cardEmoji}>💾</ThemedText>
          <ThemedText style={styles.cardTitle}>Saved</ThemedText>
          <ThemedText style={styles.cardDescription}>
            View your saved sweet spots
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
  },
  actions: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
});
