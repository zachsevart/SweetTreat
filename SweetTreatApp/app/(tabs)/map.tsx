import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent, LatLng } from 'react-native-maps';

// Random dessert spots around Seattle
const MOCK_DESSERT_LOCATIONS = [
  {
    id: '1',
    name: 'Sweet Treats Cafe',
    coordinate: { latitude: 47.6101, longitude: -122.3421 },
  },
  {
    id: '2',
    name: 'Gelato Paradise',
    coordinate: { latitude: 47.6205, longitude: -122.3493 },
  },
  {
    id: '3',
    name: 'The Donut Shop',
    coordinate: { latitude: 47.6062, longitude: -122.3321 },
  },
  {
    id: '4',
    name: 'Cupcake Corner',
    coordinate: { latitude: 47.6145, longitude: -122.3200 },
  },
  {
    id: '5',
    name: 'Ice Cream Dreams',
    coordinate: { latitude: 47.5990, longitude: -122.3300 },
  },
  {
    id: '6',
    name: 'Pastry Heaven',
    coordinate: { latitude: 47.6180, longitude: -122.3150 },
  },
  {
    id: '7',
    name: 'Chocolate Bliss',
    coordinate: { latitude: 47.6020, longitude: -122.3500 },
  },
  {
    id: '8',
    name: 'Froyo Factory',
    coordinate: { latitude: 47.6250, longitude: -122.3380 },
  },
];

export default function MapScreen() {
  const [marker, setMarker] = useState<LatLng | null>(null);

  const initialRegion = {
    latitude: 47.6061,
    longitude: -122.3328,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const onMapPress = (e: MapPressEvent) => {
    setMarker(e.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        onPress={onMapPress}
        loadingEnabled
      >
        {/* Mock dessert location pins */}
        {MOCK_DESSERT_LOCATIONS.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            title={location.name}
            description="Tap for dessert videos"
            pinColor="#3b2203ff" // Hot pink to match your dessert theme
          />
        ))}

        {/* User-added marker */}
        {marker && <Marker coordinate={marker} title="Selected location" />}
      </MapView>

      {!marker && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tap a pin to see dessert videos</Text>
        </View>
      )}
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