import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import ShimmerImage from '../../components/ShimmerImage';
import { useCartStore } from '../../store/useCartStore';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/useSettingsStore';
import { theme } from '../../theme';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { AnimatedButton } from '../../components/AnimatedButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const { settings } = useSettingsStore();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 65 + (insets.bottom > 0 ? insets.bottom - 10 : 0);

  const handleCheckout = () => {
    if (getTotalPrice() < settings.min_order_value) {
      Alert.alert(t('alerts.requirementNotMet'), t('alerts.minOrderReq', { amount: settings.min_order_value.toFixed(2) }).replace('$', settings.currency_symbol));
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <ScreenWrapper style={styles.emptyContainer}>
        <View style={styles.iconCircle}>
          <ShoppingBag size={56} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{t('cart.emptyTitle')}</Text>
        <Text style={styles.emptyText}>{t('cart.emptySubtitle')}</Text>
        <AnimatedButton 
          title="Start Shopping"
          onPress={() => router.push('/(tabs)')}
          style={styles.continueButton}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.imageWrapper}>
              <ShimmerImage source={{ uri: item.images?.[0] }} style={styles.itemImage} />
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeItem(item.id)}
                >
                  <Trash2 size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemPrice}>{settings.currency_symbol}{item.price.toFixed(2)}</Text>
              
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => {
                    if (item.quantity >= item.stock_quantity) {
                      Alert.alert(t('common.out_of_stock'), t('common.only_left', { count: item.stock_quantity }));
                    } else {
                      updateQuantity(item.id, item.quantity + 1);
                    }
                  }}
                >
                  <Plus size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={[styles.listContainer, { paddingBottom: TAB_BAR_HEIGHT + 130 }]}
      />

      <View style={[styles.footer, { bottom: TAB_BAR_HEIGHT }]}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>{t('cart.total')}</Text>
          <Text style={styles.totalAmount}>{settings.currency_symbol}{getTotalPrice().toFixed(2)}</Text>
        </View>
        <AnimatedButton 
          title={t('cart.checkout')}
          onPress={handleCheckout}
        />
      </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  iconCircle: {
    width: 120,
    height: 120,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
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
  continueButton: {
    width: '100%',
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 220,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceDark,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...theme.typography.bodyLg,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  itemPrice: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.radii.pill,
    alignSelf: 'flex-start',
    padding: 4,
  },
  quantityButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    ...theme.shadows.sm,
  },
  quantityText: {
    ...theme.typography.bodyLg,
    fontWeight: '600',
    marginHorizontal: theme.spacing.md,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingBottom: 110,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  totalText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  totalAmount: {
    ...theme.typography.h1,
  },
});
