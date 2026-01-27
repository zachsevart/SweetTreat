import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ErrorState } from '@/components/error-state';
import { useUser } from '@/src/contexts/UserContext';
import { swipeService } from '@/src/services/swipeService';
import { Restaurant } from '@/src/types';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;
const SWIPE_THRESHOLD = 120;

export default function SwipeScreen() {
  const { user, loading: userLoading } = useUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);

  // Animation values for current card
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Animation values for next card (peek effect)
  const nextCardScale = useSharedValue(0.95);
  const nextCardOpacity = useSharedValue(0.5);

  // Load restaurants
  const loadRestaurants = useCallback(async () => {
    // Wait for user to be loaded
    if (userLoading) {
      return;
    }

    // If no user, stop loading
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await swipeService.getUnswipedRestaurants(user.id, {
        limit: 20,
      });
      setRestaurants(data);
      setCurrentIndex(0);
    } catch (err: any) {
      console.error('Error loading restaurants:', err);
      setError(err.message || 'Failed to load restaurants.');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, userLoading]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const currentRestaurant = restaurants[currentIndex];
  const nextRestaurant = restaurants[currentIndex + 1];

  // Handle swipe action
  const handleSwipe = useCallback(
    async (direction: 'left' | 'right') => {
      if (!user?.id || !currentRestaurant) return;

      try {
        setSwiping(true);

        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (direction === 'right') {
          // Save restaurant
          await swipeService.saveRestaurant(user.id, currentRestaurant.id);
        } else {
          // Skip restaurant
          await swipeService.skipRestaurant(user.id, currentRestaurant.id);
        }

        // Move to next card
        setCurrentIndex((prev) => prev + 1);
      } catch (error: any) {
        console.error('Error swiping:', error);
        Alert.alert('Error', 'Failed to save swipe. Please try again.');
      } finally {
        setSwiping(false);
      }
    },
    [user?.id, currentRestaurant]
  );

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1; // Reduce vertical movement
      rotate.value = (event.translationX / SCREEN_WIDTH) * 20; // Rotation based on swipe

      // Scale and opacity for next card
      const progress = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
      nextCardScale.value = 0.95 + progress * 0.05;
      nextCardOpacity.value = 0.5 + progress * 0.5;
    })
    .onEnd((event) => {
      const swipeDistance = event.translationX;

      if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
        // Swipe threshold reached
        const direction = swipeDistance > 0 ? 'right' : 'left';
        const exitX = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

        translateX.value = withSpring(exitX, { damping: 20 });
        translateY.value = withSpring(0);
        rotate.value = withSpring(direction === 'right' ? 20 : -20);
        opacity.value = withTiming(0, { duration: 300 }, () => {
          // Reset values on the UI thread AFTER the exit animation completes
          translateX.value = 0;
          translateY.value = 0;
          rotate.value = 0;
          opacity.value = 1;
          nextCardScale.value = 0.95;
          nextCardOpacity.value = 0.5;

          runOnJS(handleSwipe)(direction);
        });
      } else {
        // Spring back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        nextCardScale.value = withSpring(0.95);
        nextCardOpacity.value = withSpring(0.5);
      }
    });

  // Animated styles for current card
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  // Animated styles for next card
  const nextCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: nextCardScale.value }],
      opacity: nextCardOpacity.value,
    };
  });

  // Render restaurant card
  const renderCard = (restaurant: Restaurant, isNext = false) => {
    if (!restaurant) return null;

    const animatedStyle = isNext ? nextCardStyle : cardStyle;

    return (
      <Animated.View
        key={restaurant.id}
        style={[
          styles.card,
          animatedStyle,
          isNext && styles.nextCard,
        ]}>
        {/* Restaurant Image */}
        <View style={styles.imageContainer}>
          {restaurant.image_url ? (
            <Image
              source={{ uri: restaurant.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ThemedText style={styles.placeholderEmoji}>🍰</ThemedText>
            </View>
          )}
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <ThemedText type="title" style={[styles.name, { fontFamily: Fonts.rounded }]}>
            {restaurant.name}
          </ThemedText>

          <ThemedText style={styles.address}>{restaurant.address}</ThemedText>

          <View style={styles.detailsRow}>
            {restaurant.rating && (
              <View style={styles.ratingContainer}>
                <ThemedText style={styles.rating}>⭐ {restaurant.rating.toFixed(1)}</ThemedText>
              </View>
            )}
            {restaurant.cuisine_type && (
              <ThemedText style={styles.cuisine}>{restaurant.cuisine_type}</ThemedText>
            )}
            {restaurant.price_range && (
              <ThemedText style={styles.price}>{restaurant.price_range}</ThemedText>
            )}
          </View>
        </View>

        {/* Swipe indicators */}
        {!isNext && (
          <>
            <View style={[styles.swipeIndicator, styles.swipeRight]}>
              <ThemedText style={styles.swipeText}>SAVE</ThemedText>
            </View>
            <View style={[styles.swipeIndicator, styles.swipeLeft]}>
              <ThemedText style={styles.swipeText}>SKIP</ThemedText>
            </View>
          </>
        )}
      </Animated.View>
    );
  };

  // Loading state (user context or restaurants)
  if (userLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
        <ThemedText style={styles.loadingText}>
          {userLoading ? 'Loading...' : 'Loading restaurants...'}
        </ThemedText>
      </ThemedView>
    );
  }

  // No user state
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={[styles.emptyTitle, { fontFamily: Fonts.rounded }]}>
          Please Log In
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          You need to be logged in to swipe on restaurants.
        </ThemedText>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadRestaurants}
      />
    );
  }

  // No restaurants state
  if (restaurants.length === 0 || currentIndex >= restaurants.length) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={[styles.emptyTitle, { fontFamily: Fonts.rounded }]}>
          🎉 All Done!
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          You've swiped through all available restaurants.
        </ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Check back later for more options!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cardsContainer}>
        {/* Next card (peek) */}
        {nextRestaurant && renderCard(nextRestaurant, true)}

        {/* Current card (swipeable) */}
        {currentRestaurant && (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.cardWrapper}>
              {renderCard(currentRestaurant)}
            </Animated.View>
          </GestureDetector>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => handleSwipe('left')}
          disabled={swiping}>
          <ThemedText style={styles.actionButtonText}>✕ Skip</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={() => handleSwipe('right')}
          disabled={swiping}>
          <ThemedText style={styles.actionButtonText}>♥ Save</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  cardsContainer: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextCard: {
    position: 'absolute',
    zIndex: 0,
  },
  imageContainer: {
    width: '100%',
    height: '60%',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  cuisine: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 4,
    zIndex: 10,
  },
  swipeRight: {
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderColor: '#4CAF50',
  },
  swipeLeft: {
    left: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderColor: '#F44336',
  },
  swipeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  skipButton: {
    backgroundColor: '#fff',
    borderColor: '#F44336',
  },
  saveButton: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 36,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 40,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 40,
  },
});
