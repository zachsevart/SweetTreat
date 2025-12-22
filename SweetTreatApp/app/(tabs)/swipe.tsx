import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function SwipeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Swipe Screen</Text>
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});