import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddToCartButton from '../../components/AddToCartButton';
import Shimmer from '../../components/Shimmer';
import ShimmerImage from '../../components/ShimmerImage';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 12;

export default function CategoryProductsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { settings } = useSettingsStore();

  const [categoryName, setCategoryName] = useState<string>('Category');
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Fetch Category Name
    const fetchCategory = async () => {
      if (!id) return;
      const { data } = await supabase.from('categories').select('name').eq('id', id).single();
      if (data) setCategoryName(data.name);
    };
    fetchCategory();
  }, [id]);

  const fetchProducts = async (pageIndex: number) => {
    if (!id || loading || (!hasMore && pageIndex > 0)) return;

    setLoading(true);
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', id)
      .eq('is_enabled', true)
      .range(from, to);

    if (error) {
      console.error('Error fetching category products:', error);
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
    fetchProducts(0);
  }, [id]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/products/${item.id}`)}
    >
      <ShimmerImage source={{ uri: item.images?.[0] }} style={styles.productImage} />
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productPrice}>{settings.currency_symbol}{item.price.toFixed(2)}</Text>
      <AddToCartButton product={item} />
    </TouchableOpacity>
  );

  if (loading && page === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: categoryName !== 'Category' ? t(`dbCategories.${categoryName.replace(/\s+/g, '_').replace(/&/g, 'and').toLowerCase()}`, { defaultValue: categoryName }) : t('common.loading'),
            headerBackButtonDisplayMode: 'minimal',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.headerCartButton}>
                <ShoppingCart size={22} color="#1f2937" />
                {cartCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          }}
        />
        <View style={styles.shimmerContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.productCard}>
              <Shimmer style={styles.productImage} />
              <Shimmer style={{ width: '80%', height: 16, marginBottom: 8, borderRadius: 4 }} />
              <Shimmer style={{ width: '40%', height: 16, marginBottom: 12, borderRadius: 4 }} />
              <Shimmer style={{ width: '100%', height: 36, borderRadius: 8 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: categoryName !== 'Category' ? t(`dbCategories.${categoryName.replace(/\s+/g, '_').replace(/&/g, 'and').toLowerCase()}`, { defaultValue: categoryName }) : t('common.loading'),
          headerBackButtonDisplayMode: 'minimal',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.headerCartButton}>
              <ShoppingCart size={22} color="#1f2937" />
              {cartCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>{t('products.product_not_found')}</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContainer: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  shimmerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6b7280'
  },
  headerCartButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
