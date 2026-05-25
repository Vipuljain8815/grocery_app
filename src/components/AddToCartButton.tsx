import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useCartStore } from '../store/useCartStore';
import { useTranslation } from 'react-i18next';

interface AddToCartButtonProps {
  product: any;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { t } = useTranslation();
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);

  if (product.stock_quantity <= 0) {
    return (
      <View style={styles.outOfStockContainer}>
        <Text style={styles.outOfStockText}>{t('alerts.outOfStock')}</Text>
      </View>
    );
  }

  const handleAdd = () => {
    if (quantity >= product.stock_quantity) {
      Alert.alert(t('alerts.outOfStock'), t('alerts.onlyLeft', { count: product.stock_quantity }));
      return;
    }
    addItem(product);
  };

  const handleIncrement = () => {
    if (quantity >= product.stock_quantity) {
      Alert.alert(t('alerts.outOfStock'), t('alerts.onlyLeft', { count: product.stock_quantity }));
      return;
    }
    updateQuantity(product.id, quantity + 1);
  };

  if (quantity === 0) {
    return (
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAdd}
      >
        <Text style={styles.addButtonText}>{t('common.add')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.counterContainer}>
      <TouchableOpacity 
        style={styles.counterButton}
        onPress={() => updateQuantity(product.id, quantity - 1)}
      >
        <Minus size={16} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity 
        style={styles.counterButton}
        onPress={handleIncrement}
      >
        <Plus size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10b981',
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 4,
  },
  counterButton: {
    padding: 6,
  },
  quantityText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 8,
  },
  outOfStockContainer: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  outOfStockText: {
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
