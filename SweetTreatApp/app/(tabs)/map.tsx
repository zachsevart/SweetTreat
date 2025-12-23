import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent, LatLng } from 'react-native-maps';

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
        {marker && <Marker coordinate={marker} title="Selected location" />}
      </MapView>

      {!marker && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tap anywhere to add a marker</Text>
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