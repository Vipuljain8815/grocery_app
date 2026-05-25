import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image, ImageProps } from 'expo-image';

export default function ShimmerImage({ style, ...props }: ImageProps) {
  return (
    <View style={[styles.container, style]}>
      <Image 
        {...props} 
        style={StyleSheet.absoluteFill} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  }
});
