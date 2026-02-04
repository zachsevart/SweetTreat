import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ErrorState } from '@/components/error-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useUser } from '@/src/contexts/UserContext';
import { swipeService } from '@/src/services/swipeService';
import { Restaurant, SavedRestaurant } from '@/src/types';
import { Fonts } from '@/constants/theme';

type SavedItem = SavedRestaurant & { restaurant: Restaurant };

export default function SavedPlacesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [savedPlaces, setSavedPlaces] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await swipeService.getSavedRestaurants(user.id);
      setSavedPlaces(data);
    } catch (err: any) {
      console.error('Error loading saved places:', err);
      setError(err.message || 'Failed to load saved places.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleGoBack = () => {
    router.back();
  };

  const handleRemove = (restaurantId: string, restaurantName: string) => {
    Alert.alert(
      'Remove Saved Place',
      `Remove ${restaurantName} from your saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await swipeService.removeSavedRestaurant(user.id, restaurantId);
              setSavedPlaces((prev) =>
                prev.filter((item) => item.restaurant_id !== restaurantId)
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SavedItem }) => {
    const restaurant = item.restaurant;
    if (!restaurant) return null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/restaurant/${restaurant.id}`)}
        activeOpacity={0.7}
      >
        {restaurant.image_url ? (
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.cardImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <ThemedText style={styles.placeholderEmoji}>🍰</ThemedText>
          </View>
        )}
        <View style={styles.cardInfo}>
          <ThemedText style={styles.cardName}>{restaurant.name}</ThemedText>
          <ThemedText style={styles.cardAddress} numberOfLines={1}>
            {restaurant.address}
          </ThemedText>
          <View style={styles.cardMeta}>
            {restaurant.rating != null && (
              <ThemedText style={styles.cardRating}>
                ⭐ {restaurant.rating.toFixed(1)}
              </ThemedText>
            )}
            {restaurant.cuisine_type && (
              <ThemedText style={styles.cardCuisine}>
                {restaurant.cuisine_type}
              </ThemedText>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(restaurant.id, restaurant.name)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ThemedText style={styles.removeText}>✕</ThemedText>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <IconSymbol name="xmark" size={24} color="black" />
        </TouchableOpacity>
        <ThemedText
          type="title"
          style={[styles.title, { fontFamily: Fonts.rounded }]}
        >
          Saved Places
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSaved} />
      ) : savedPlaces.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>
            No saved places yet. Swipe right on restaurants you like!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={savedPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  cardRating: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardCuisine: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  removeText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
});
