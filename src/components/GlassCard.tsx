import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { theme } from '../theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  children: React.ReactNode;
}

export const GlassCard = ({ intensity = 50, tint = 'light', children, style, ...props }: GlassCardProps) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <GlassView 
        colorScheme={tint === 'dark' ? 'dark' : 'light'} 
        style={styles.glass as any}
      >
        {children}
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...theme.shadows.md,
    backgroundColor: 'rgba(255,255,255,0.1)', // fallback
  },
  glass: {
    padding: theme.spacing.lg,
  },
});
