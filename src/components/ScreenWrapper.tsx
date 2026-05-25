import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { theme } from '../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noSafeArea?: boolean;
}

export const ScreenWrapper = ({ children, style, noSafeArea = false }: ScreenWrapperProps) => {
  const Container = noSafeArea ? Animated.View : Animated.createAnimatedComponent(SafeAreaView);

  return (
    <Container
      style={[styles.container, style]}
      edges={noSafeArea ? undefined : ['right', 'bottom', 'left']}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
