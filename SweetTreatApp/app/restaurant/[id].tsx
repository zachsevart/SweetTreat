import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorState } from '@/components/error-state';
import { VideoReviewCard } from '@/components/video-review-card';
import { restaurantService } from '@/src/services/restaurantService';
import { videoService } from '@/src/services/videoService';
import { Restaurant, VideoReview } from '@/src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [restaurantData, videosData] = await Promise.all([
        restaurantService.getById(id),
        videoService.getByRestaurant(id),
      ]);

      setRestaurant(restaurantData);
      setVideos(videosData ?? []);
    } catch (err: any) {
      console.error('Error loading restaurant details:', err);
      setError(err.message || 'Failed to load restaurant details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </ThemedView>
    );
  }

  if (error || !restaurant) {
    return (
      <ErrorState
        message={error || 'Restaurant not found.'}
        onRetry={fetchData}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Image */}
        {restaurant.image_url ? (
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.heroImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.heroImage, styles.imagePlaceholder]}>
            <ThemedText style={styles.placeholderEmoji}>🍰</ThemedText>
          </View>
        )}

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.name}>{restaurant.name}</ThemedText>
          <ThemedText style={styles.address}>{restaurant.address}</ThemedText>

          <View style={styles.metaRow}>
            {restaurant.rating != null && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  ⭐ {restaurant.rating.toFixed(1)}
                </ThemedText>
              </View>
            )}
            {restaurant.cuisine_type && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {restaurant.cuisine_type}
                </ThemedText>
              </View>
            )}
            {restaurant.price_range && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>
                  {restaurant.price_range}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Video Reviews */}
        <View style={styles.videosSection}>
          <ThemedText style={styles.sectionTitle}>
            Video Reviews{videos.length > 0 ? ` (${videos.length})` : ''}
          </ThemedText>

          {videos.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No video reviews yet for this spot.
            </ThemedText>
          ) : (
            videos.map((video) => (
              <VideoReviewCard key={video.id} video={video} />
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'pink',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 240,
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  infoSection: {
    padding: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  address: {
    fontSize: 15,
    opacity: 0.6,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  videosSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
