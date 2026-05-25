import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton = ({ onPress, title, style, textStyle, variant = 'primary', disabled = false }: AnimatedButtonProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: theme.colors.primaryLight };
      case 'outline':
        return { backgroundColor: theme.colors.transparent, borderWidth: 2, borderColor: theme.colors.primary };
      case 'primary':
      default:
        return { backgroundColor: theme.colors.primary };
    }
  };

  const getTextStyles = (): TextStyle => {
    switch (variant) {
      case 'secondary':
      case 'outline':
        return { color: theme.colors.primaryDark };
      case 'primary':
      default:
        return { color: theme.colors.surface };
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[styles.button, getVariantStyles(), animatedStyle, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={[styles.text, getTextStyles(), textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  text: {
    fontSize: theme.typography.bodyLg.fontSize,
    fontWeight: '600',
  },
});
