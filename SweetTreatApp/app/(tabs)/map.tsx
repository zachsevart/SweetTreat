import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import { useRestaurants } from '../../hooks/use-restaurants';
import { ErrorState } from '@/components/error-state';

export default function MapScreen() {
  const { restaurants, loading, error, refetch } = useRestaurants();

  const initialRegion = {
    latitude: 47.6061,
    longitude: -122.3328,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Loading dessert spots...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={`Failed to load dessert spots. ${error}`}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
      >
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={{
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            }}
            title={restaurant.name}
            description={`${restaurant.cuisine_type} • ${restaurant.price_range} • ⭐ ${restaurant.rating}`}
            pinColor="#FF69B4"
            onCalloutPress={() => router.push(`/restaurant/${restaurant.id}`)}
          />
        ))}
      </MapView>

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {restaurants.length} dessert spots nearby
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF69B4',
  },
  hint: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#333',
  },
});
