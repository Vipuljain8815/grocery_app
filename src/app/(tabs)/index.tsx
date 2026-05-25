import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Keyboard, Linking, Alert, RefreshControl } from 'react-native';
import ShimmerImage from '../../components/ShimmerImage';
import { Search, X, MapPin, Bell, ChevronRight } from 'lucide-react-native';
import Shimmer from '../../components/Shimmer';
import AddToCartButton from '../../components/AddToCartButton';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { settings } = useSettingsStore();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_enabled', true)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (!error && data) {
        setSearchResults(data);
      }
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const [
        { data: cats },
        { data: prods },
        { data: activeCoupons },
        { data: bns, error }
      ] = await Promise.all([
        supabase.from('categories').select('*').limit(6),
        supabase.from('products').select('*').eq('is_featured', true).eq('is_enabled', true).limit(10),
        supabase.from('coupons').select('*').eq('is_active', true),
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order', { ascending: true })
      ]);

      if (cats) setCategories(cats);
      if (prods) setFeaturedProducts(prods);

      if (activeCoupons) {
        const validCoupons = activeCoupons.filter(c => !c.valid_until || new Date(c.valid_until) > new Date());
        setCoupons(validCoupons);
      }

      if (error) {
        console.error("Error fetching banners:", error);
      }
      if (bns) {
        setBanners(bns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsLoading(true);
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleBannerPress = (banner: any) => {
    switch(banner.type) {
      case 'category':
        router.push(`/categories/${banner.action_value}`);
        break;
      case 'product':
        router.push(`/products/${banner.action_value}`);
        break;
      case 'link':
        Linking.openURL(banner.action_value).catch(() => Alert.alert(t('alerts.error'), t('alerts.couldNotOpenLink')));
        break;
      case 'coupon':
        Alert.alert(t('alerts.coupon'), t('alerts.useCodeAtCheckout', { code: banner.action_value }), [{ text: t('common.ok') }]);
        break;
    }
  };

  const renderProductCard = (product: any, i: number) => (
    <TouchableOpacity 
      key={product.id} 
      style={styles.productCard}
      onPress={() => router.push(`/products/${product.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.productImageContainer}>
        <ShimmerImage source={product.images?.[0]} style={styles.productImage} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productPrice}>{settings.currency_symbol}{product.price.toFixed(2)}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.addButtonWrapper}>
          <AddToCartButton product={product} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        
        {/* Search */}
        <Animated.View style={styles.searchContainer}>
          <Search size={22} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.search_placeholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {searchQuery.trim().length > 0 ? (
          /* Search Results View */
          <View style={styles.searchResultsContainer}>
            {!isSearching && (
              searchResults.length > 0 ? (
                <View style={styles.productsGrid}>
                  {searchResults.map((product, i) => renderProductCard(product, i))}
                </View>
              ) : (
                <Text style={styles.emptyText}>{t('home.noProductsForQuery', { query: searchQuery })}</Text>
              )
            )}
          </View>
        ) : (
          /* Default Home Content */
          <>
            {/* Dynamic Banners */}
            {isLoading ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
              >
                {Array.from({ length: 2 }).map((_, i) => (
                  <View key={`shim-banner-${i}`} style={[styles.bannerContainer, { marginRight: theme.spacing.md }]}>
                    <Shimmer style={{ width: '100%', height: '100%' }} />
                  </View>
                ))}
              </ScrollView>
            ) : banners.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
              >
                {banners.map((banner, index) => (
                  <Animated.View 
                    key={banner.id || index} 
                    style={[styles.bannerContainer, { marginRight: theme.spacing.md }]}
                  >
                    <TouchableOpacity onPress={() => handleBannerPress(banner)} activeOpacity={0.9} style={{ flex: 1, width: '100%', height: '100%' }}>
                      <ShimmerImage source={banner.image_url} style={styles.bannerImage} />
                      <View style={styles.bannerOverlay}>
                        <Text style={styles.bannerTitleText}>{banner.title}</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : null}

            {/* Categories */}
            <Animated.View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
                  <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesList} contentContainerStyle={{ paddingRight: theme.spacing.lg }}>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <View key={`shim-cat-${i}`} style={styles.categoryCard}>
                      <Shimmer style={{ width: '100%', height: '100%' }} />
                    </View>
                  ))
                ) : (
                  categories.map((item) => (
                  <TouchableOpacity 
                    key={item.id}
                    style={styles.categoryCard}
                    onPress={() => router.push(`/categories/${item.id}`)}
                    activeOpacity={0.9}
                  >
                    <ShimmerImage source={item.image_url} style={styles.categoryImage} />
                    <View style={styles.cardOverlay}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {t(`dbCategories.${item.name.replace(/\s+/g, '_').replace(/&/g, 'and').toLowerCase()}`, { defaultValue: item.name })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )))}
              </ScrollView>
            </Animated.View>

            {/* Featured Products */}
            <Animated.View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.featured_products')}</Text>
                <TouchableOpacity onPress={() => router.push('/all-products')}>
                  <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.productsGrid}>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <View key={`shim-prod-${i}`} style={styles.productCard}>
                      <View style={styles.productImageContainer}>
                        <Shimmer style={styles.productImage} />
                      </View>
                      <View style={styles.productInfo}>
                        <Shimmer style={{ width: '40%', height: 24, marginBottom: 4, borderRadius: 4 }} />
                        <Shimmer style={{ width: '90%', height: 16, marginBottom: 4, borderRadius: 4 }} />
                        <Shimmer style={{ width: '60%', height: 16, marginBottom: 10, borderRadius: 4 }} />
                        <View style={styles.addButtonWrapper}>
                          <Shimmer style={{ width: '100%', height: 36, borderRadius: 8 }} />
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  featuredProducts.map((product, i) => renderProductCard(product, i))
                )}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    height: 54,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.md,
    ...theme.typography.body,
    height: '100%',
  },
  bannerContainer: {
    width: 300,
    height: 150,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  bannerTitleText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
  },
  seeAllText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  categoriesList: {
    paddingLeft: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  categoryCard: {
    marginRight: theme.spacing.md,
    width: 140,
    height: 140,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    padding: theme.spacing.sm,
  },
  categoryName: {
    ...theme.typography.bodyLg,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radii.lg,
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: theme.colors.surfaceDark,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: theme.spacing.md,
  },
  productPrice: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 4,
  },
  productName: {
    ...theme.typography.bodySm,
    color: theme.colors.textSecondary,
    height: 38,
    marginBottom: 8,
  },
  addButtonWrapper: {
    marginTop: 'auto',
  },
  searchResultsContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.bodyLg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
