import React from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';

interface ShimmerProps {
  style?: ViewStyle | ViewStyle[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Shimmer({ style }: ShimmerProps) {
  return <View style={[styles.shimmerContainer, style]} />;
}

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: '#e5e7eb', // Base gray color
    overflow: 'hidden',
  },
});
