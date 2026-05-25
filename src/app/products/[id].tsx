import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import ShimmerImage from '../../components/ShimmerImage';
import Shimmer from '../../components/Shimmer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCartStore } from '../../store/useCartStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Minus, Plus, ShoppingCart, Heart } from 'lucide-react-native';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { translateSupabaseError } from '../../lib/errorTranslator';

export default function ProductScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { settings } = useSettingsStore();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (data) {
        setProduct(data);
      } else if (error) {
        console.error('Error fetching product:', error);
      }
      setLoading(false);
    };
    
    const fetchFavoriteStatus = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();
      
      if (data) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching favorite status:', error);
      }
    };
    
    if (id) {
      fetchProduct();
      fetchFavoriteStatus();
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert(t('alerts.loginRequiredTitle'), t('alerts.loginRequiredMsg'));
      return;
    }
    
    if (isFavorite && favoriteId) {
      setIsFavorite(false);
      const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);
      if (error) {
        console.error('Error removing favorite:', error);
        Alert.alert(t('alerts.error'), t('alerts.failedToRemoveFavorite'));
        setIsFavorite(true);
      } else {
        setFavoriteId(null);
      }
    } else {
      setIsFavorite(true);
      const { data, error } = await supabase.from('favorites').insert({
        user_id: user.id,
        product_id: id
      }).select().single();
      
      if (error) {
        console.error('Error adding favorite:', error);
        Alert.alert(t('alerts.error'), t('alerts.failedToAddFavorite') + ' ' + translateSupabaseError(error.message));
        setIsFavorite(false);
      } else if (data) {
        setFavoriteId(data.id);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock_quantity === 0) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    router.back();
  };

  const cartQuantity = useCartStore((state) => 
    product ? state.getItemQuantity(product.id) : 0
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Shimmer style={styles.imageContainer} />
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Shimmer style={{ height: 32, flex: 1, marginRight: 12, borderRadius: 8 }} />
            <Shimmer style={{ height: 32, width: 32, borderRadius: 16 }} />
          </View>
          <Shimmer style={{ height: 28, width: 120, marginBottom: 24, borderRadius: 8 }} />
          <Shimmer style={{ height: 60, width: '100%', marginBottom: 20, borderRadius: 8 }} />
          <Shimmer style={{ height: 24, width: 100, marginBottom: 12, borderRadius: 8 }} />
          <Shimmer style={{ height: 16, width: '100%', marginBottom: 8, borderRadius: 4 }} />
          <Shimmer style={{ height: 16, width: '100%', marginBottom: 8, borderRadius: 4 }} />
          <Shimmer style={{ height: 16, width: '80%', marginBottom: 8, borderRadius: 4 }} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>{t('products.product_not_found')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
          {product.images?.map((url: string, index: number) => (
            <ShimmerImage key={index} source={{ uri: url }} style={styles.image} />
          ))}
        </ScrollView>
        
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            <TouchableOpacity onPress={toggleFavorite} style={styles.heartBtn}>
              <Heart size={28} color={isFavorite ? "#ef4444" : "#9ca3af"} fill={isFavorite ? "#ef4444" : "none"} />
            </TouchableOpacity>
          </View>
          <View style={styles.badgeRow}>
            {product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0 && (
              <Text style={styles.lowStockBadge}>{t('common.only_left', { count: product.stock_quantity })}</Text>
            )}
            {product.stock_quantity === 0 && (
              <Text style={styles.outOfStockBadge}>{t('common.out_of_stock')}</Text>
            )}
          </View>
          <Text style={styles.price}>{settings.currency_symbol}{product.price.toFixed(2)}</Text>
          
          <View style={styles.stockInfoContainer}>
            <Text style={styles.stockInfoText}>{t('products.available_stock', { count: product.stock_quantity })}</Text>
            <Text style={styles.stockInfoText}>{t('products.total_stock', { count: product.total_stock })}</Text>
          </View>
          
          <Text style={styles.descriptionTitle}>{t('products.description')}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        {cartQuantity > 0 ? (
          <View style={[styles.quantityContainer, { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20 }]}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => useCartStore.getState().updateQuantity(product.id, cartQuantity - 1)}
            >
              <Minus size={24} color="#10b981" />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { fontSize: 22 }]}>{t('products.in_cart', { count: cartQuantity })}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => useCartStore.getState().updateQuantity(product.id, cartQuantity + 1)}
              disabled={cartQuantity >= product.stock_quantity}
            >
              <Plus size={24} color={cartQuantity >= product.stock_quantity ? "#d1d5db" : "#10b981"} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addToCartButton, product.stock_quantity === 0 && styles.addToCartDisabled, { marginLeft: 0 }]} 
            onPress={() => useCartStore.getState().addItem(product)}
            disabled={product.stock_quantity === 0}
          >
            <ShoppingCart size={20} color="#ffffff" style={styles.cartIcon} />
            <Text style={styles.addToCartText}>
              {product.stock_quantity === 0 ? t('common.out_of_stock') : t('common.add_to_cart')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    width: '100%',
    height: 300,
  },
  image: {
    width: 400, // Roughly screen width
    height: 300,
  },
  detailsContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  heartBtn: {
    padding: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  lowStockBadge: {
    backgroundColor: '#fef08a',
    color: '#ca8a04',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  outOfStockBadge: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  price: {
    fontSize: 22,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  stockInfoContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  stockInfoText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginHorizontal: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    marginRight: 8,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartDisabled: {
    backgroundColor: '#9ca3af',
  },
});
