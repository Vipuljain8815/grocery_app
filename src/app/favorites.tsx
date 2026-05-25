import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Shimmer from '../components/Shimmer';
import ShimmerImage from '../components/ShimmerImage';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useDataStore } from '../store/useDataStore';
import { Product, Favorite } from '../models';
import { Heart, Trash2, ShoppingBag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, Layout, SlideOutRight } from 'react-native-reanimated';
import { AnimatedButton } from '../components/AnimatedButton';
import AddToCartButton from '../components/AddToCartButton';

type FavoriteWithProduct = Favorite & { product: Product };

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { settings } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { favorites, fetchFavorites } = useDataStore();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchFavorites(user.id);
      }
    }, [user])
  );

  const removeFavorite = async (id: string, productId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id);
      
    if (error) {
      Alert.alert(t('alerts.error'), t('alerts.error'));
    } else {
      // Background refresh to keep store in sync
      fetchFavorites(user.id);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <Text style={styles.headerTitle}>{t('profile.favorites')}</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Heart size={64} color={theme.colors.primary} fill={theme.colors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>{t('favorites.noSavedItemsTitle')}</Text>
            <Text style={styles.emptyText}>{t('favorites.noSavedItems')}</Text>
            <AnimatedButton 
              title={t('favorites.browseProducts')} 
              onPress={() => router.push('/(tabs)')}
              style={styles.shopBtn}
            />
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View 
            entering={FadeInUp.delay(index * 50).duration(400)}
            layout={Layout.springify()}
            exiting={SlideOutRight}
          >
            <TouchableOpacity 
              style={styles.cardContainer}
              onPress={() => router.push(`/products/${item.product.id}`)}
              activeOpacity={0.9}
            >
              <View style={styles.imageWrapper}>
                <ShimmerImage source={{ uri: item.product.images[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
              </View>
              <View style={styles.details}>
                <View>
                  <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{settings.currency_symbol}{item.product.price.toFixed(2)}</Text>
                  </View>
                </View>
                
                <View style={styles.actions}>
                  <View style={{ flex: 1, marginRight: theme.spacing.md }}>
                    <AddToCartButton product={item.product} />
                  </View>
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => removeFavorite(item.id, item.product.id)}
                  >
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.h1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  listContent: { 
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: theme.spacing.xxl * 2,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.sm,
  },
  emptyText: { 
    ...theme.typography.body,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  shopBtn: {
    width: '100%',
  },
  cardContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceDark,
    overflow: 'hidden',
  },
  image: { 
    width: '100%', 
    height: '100%', 
  },
  details: { 
    flex: 1, 
    marginLeft: theme.spacing.md, 
    justifyContent: 'space-between' 
  },
  name: { 
    ...theme.typography.bodyLg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  price: { 
    ...theme.typography.h3,
    color: theme.colors.primary, 
  },
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },

  removeBtn: { 
    padding: theme.spacing.sm,
  },
});
