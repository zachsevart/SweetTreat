import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Restaurant, VideoReview } from '@/src/types';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReelOverlayProps {
  video: VideoReview & { restaurant?: Restaurant };
  onLike?: () => void;
  isLiked?: boolean;
}

export function ReelOverlay({ video, onLike, isLiked = false }: ReelOverlayProps) {
  const restaurant = video.restaurant;

  const handleViewRestaurant = () => {
    if (restaurant?.id) {
      router.push(`/restaurant/${restaurant.id}`);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Bottom gradient for readability - using layered views */}
      <View style={styles.gradientContainer} pointerEvents="none">
        <View style={[styles.gradientLayer, { opacity: 0.1 }]} />
        <View style={[styles.gradientLayer, { opacity: 0.2, top: 60 }]} />
        <View style={[styles.gradientLayer, { opacity: 0.4, top: 120 }]} />
        <View style={[styles.gradientLayer, { opacity: 0.6, top: 180 }]} />
        <View style={[styles.gradientLayer, { opacity: 0.8, top: 240 }]} />
      </View>

      {/* Right side action buttons */}
      <View style={styles.actionsContainer}>
        {/* Like button */}
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <ThemedText style={[styles.actionIcon, isLiked && styles.actionIconLiked]}>
            {isLiked ? '♥' : '♡'}
          </ThemedText>
          <ThemedText style={styles.actionText}>
            {formatCount(video.likes_count || 0)}
          </ThemedText>
        </TouchableOpacity>

        {/* Views */}
        <View style={styles.actionButton}>
          <ThemedText style={styles.actionIcon}>👁</ThemedText>
          <ThemedText style={styles.actionText}>
            {formatCount(video.views_count || 0)}
          </ThemedText>
        </View>

        {/* Restaurant link */}
        {restaurant && (
          <TouchableOpacity style={styles.actionButton} onPress={handleViewRestaurant}>
            <ThemedText style={styles.actionIcon}>📍</ThemedText>
            <ThemedText style={styles.actionText}>Visit</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom info section */}
      <View style={styles.infoContainer}>
        {restaurant && (
          <>
            <ThemedText style={[styles.restaurantName, { fontFamily: Fonts.rounded }]}>
              {restaurant.name}
            </ThemedText>

            <View style={styles.detailsRow}>
              {restaurant.rating && (
                <View style={styles.ratingBadge}>
                  <ThemedText style={styles.ratingText}>
                    ⭐ {restaurant.rating.toFixed(1)}
                  </ThemedText>
                </View>
              )}
              {restaurant.cuisine_type && (
                <ThemedText style={styles.cuisineText}>{restaurant.cuisine_type}</ThemedText>
              )}
              {restaurant.price_range && (
                <ThemedText style={styles.priceText}>{restaurant.price_range}</ThemedText>
              )}
            </View>

            <TouchableOpacity style={styles.viewButton} onPress={handleViewRestaurant}>
              <ThemedText style={styles.viewButtonText}>View Restaurant</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  gradientContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  gradientLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    backgroundColor: '#000',
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 180,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionIconLiked: {
    color: '#ff4757',
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Account for tab bar
    width: SCREEN_WIDTH - 70, // Leave space for action buttons
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 243, 205, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
  },
  cuisineText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontStyle: 'italic',
  },
  priceText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
