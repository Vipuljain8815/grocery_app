import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ShoppingBag, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import AddToCartButton from '../components/AddToCartButton';
import ShimmerImage from '../components/ShimmerImage';
import Shimmer from '../components/Shimmer';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 10;

export default function AllProductsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [isSearching, setIsSearching] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const currencySymbol = useSettingsStore(state => state.settings.currency_symbol);
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [localQuery, setLocalQuery] = useState(q || '');

  const fetchAllProducts = async (pageIndex: number, currentQuery?: string) => {
    if (loading || (!hasMore && pageIndex > 0)) return;

    setLoading(true);
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let dbQuery = supabase
      .from('products')
      .select('*')
      .eq('is_enabled', true);

    if (currentQuery) {
      dbQuery = dbQuery.ilike('name', `%${currentQuery}%`);
    }

    const { data, error } = await dbQuery.range(from, to);

    if (error) {
      console.error('Error fetching all products:', error);
    } else if (data) {
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (pageIndex === 0) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    setProducts([]);
    setPage(0);
    setHasMore(true);
    fetchAllProducts(0, q);
    setLocalQuery(q || '');
  }, [q]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAllProducts(nextPage, q);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localQuery !== (q || '')) {
        router.setParams({ q: localQuery.trim() });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localQuery]);

  const handleSearch = () => {
    router.setParams({ q: localQuery.trim() });
  };

  const handleClear = () => {
    setLocalQuery('');
    router.setParams({ q: '' });
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/products/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <ShimmerImage source={{ uri: item.images?.[0] }} style={styles.productImage} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{currencySymbol}{item.price.toFixed(2)}</Text>
        <View style={styles.addButtonWrapper}>
          <AddToCartButton product={item} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: q ? t('products.resultsFor', { query: q }) : t('products.all_products'),
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { ...theme.typography.h3 },
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.headerCartButton}>
              <ShoppingBag size={24} color={theme.colors.text} />
              {cartCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />
      
      <View style={styles.searchContainer}>
        <Search size={22} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('products.searchAllProducts')}
          placeholderTextColor={theme.colors.textSecondary}
          value={localQuery}
          onChangeText={setLocalQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {localQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
            <X size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && page === 0 ? (
        <View style={styles.shimmerContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`shim-prod-${i}`} style={styles.productCard}>
              <View style={styles.imageContainer}>
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
          ))}
        </View>
      ) : (
        <FlatList
          data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
        columnWrapperStyle={styles.row}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? (
          <Text style={styles.emptyText}>{t('products.product_not_found')}</Text>
        ) : null}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  shimmerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  row: {
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
  imageContainer: {
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
  footerLoader: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  headerCartButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    paddingHorizontal: 2,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
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
    color: theme.colors.text,
  },
  emptyText: {
    ...theme.typography.bodyLg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
