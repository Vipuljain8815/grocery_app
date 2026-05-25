import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Shimmer from '../../components/Shimmer';
import ShimmerImage from '../../components/ShimmerImage';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, Address, Product } from '../../models';
import { Package, Clock, CheckCircle, Truck, XCircle, MapPin, Receipt, CreditCard } from 'lucide-react-native';
import { format } from 'date-fns';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/useSettingsStore';

type OrderDetailsData = Order & {
  address: Address | null;
  items: (OrderItem & { product: Product })[];
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { settings } = useSettingsStore();

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    if (!id) return;
    setLoading(true);

    // Fetch order with address
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, address:addresses(*)')
      .eq('id', id)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      setLoading(false);
      return;
    }

    // Fetch order items with products
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:products(*)')
      .eq('order_id', id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    } else {
      setOrder({
        ...orderData,
        items: itemsData || []
      } as OrderDetailsData);
    }

    setLoading(false);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      t('orders.cancelConfirmTitle'),
      t('orders.cancelConfirmMessage'),
      [
        { text: t('orders.keepOrder'), style: 'cancel' },
        { 
          text: t('orders.yesCancel'), 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            
            // 1. Update order status
            const { error: updateError } = await supabase
              .from('orders')
              .update({ status: 'cancelled' })
              .eq('id', order!.id);
              
            if (updateError) {
              Alert.alert(t('alerts.error'), t('alerts.cancelError'));
              setLoading(false);
              return;
            }
            
            // 2. Restore stock via RPC
            const stockRestores = order!.items.map(async (item) => {
              const { error } = await supabase.rpc('increment_stock', {
                product_id: item.product_id,
                increment_by: item.quantity
              });
              if (error) {
                console.error(`Failed to restore stock for product ${item.product_id}:`, error);
              }
            });
            
            await Promise.all(stockRestores);
            
            // Refresh order
            fetchOrderDetails();
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: string, size = 24) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock size={size} color="#f59e0b" />;
      case 'processing': return <Package size={size} color="#3b82f6" />;
      case 'shipped': return <Truck size={size} color="#8b5cf6" />;
      case 'delivered': return <CheckCircle size={size} color="#10b981" />;
      case 'cancelled': return <XCircle size={size} color="#ef4444" />;
      default: return <Clock size={size} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header Shimmer */}
        <View style={styles.headerSection}>
          <Shimmer style={{ width: 150, height: 32, borderRadius: 8, marginBottom: 12 }} />
          <Shimmer style={{ width: 120, height: 16, borderRadius: 4, marginBottom: 4 }} />
          <Shimmer style={{ width: 180, height: 16, borderRadius: 4 }} />
        </View>
        
        {/* Section Shimmer */}
        <View style={styles.section}>
          <Shimmer style={{ width: 140, height: 24, borderRadius: 4, marginBottom: 16 }} />
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={`shim-item-${i}`} style={styles.itemRow}>
              <Shimmer style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Shimmer style={{ width: '80%', height: 18, borderRadius: 4, marginBottom: 8 }} />
                <Shimmer style={{ width: '40%', height: 14, borderRadius: 4 }} />
              </View>
              <Shimmer style={{ width: 60, height: 20, borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{t('orders.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Status */}
      <View style={styles.headerSection}>
        <View style={styles.statusContainer}>
          {getStatusIcon(order.status, 32)}
          <Text style={[styles.statusTextLarge, { color: getStatusColor(order.status) }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.orderId}>{t('orders.orderId', { id: order.order_number || order.id.substring(0,8) })}</Text>
        <Text style={styles.orderDate}>{format(new Date(order.created_at), 'MMMM dd, yyyy h:mm a')}</Text>
      </View>

      {/* Items Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#4b5563" />
          <Text style={styles.sectionTitle}>{t('orders.itemsOrdered')}</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <ShimmerImage source={{ uri: item.product?.images[0] || 'https://via.placeholder.com/150' }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.product?.name || t('orders.unknownProduct')}</Text>
              <Text style={styles.itemPrice}>{settings.currency_symbol}{item.unit_price.toFixed(2)} x {item.quantity}</Text>
            </View>
            <Text style={styles.itemTotal}>{settings.currency_symbol}{(item.unit_price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Financial Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Receipt size={20} color="#4b5563" />
          <Text style={styles.sectionTitle}>{t('checkout.order_summary')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
          <Text style={styles.summaryValue}>{settings.currency_symbol}{(order.subtotal || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('checkout.delivery_fee')}</Text>
          <Text style={styles.summaryValue}>{settings.currency_symbol}{(order.delivery_fee || 0).toFixed(2)}</Text>
        </View>
        {(order.tax || 0) > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.tax')}</Text>
            <Text style={styles.summaryValue}>{settings.currency_symbol}{(order.tax || 0).toFixed(2)}</Text>
          </View>
        )}
        {(order.discount || 0) > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.discount')}</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>-{settings.currency_symbol}{order.discount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
          <Text style={styles.totalValue}>{settings.currency_symbol}{order.total_amount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment & Delivery */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CreditCard size={20} color="#4b5563" />
          <Text style={styles.sectionTitle}>{t('orders.paymentDelivery')}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockTitle}>{t('orders.paymentMethod')}</Text>
          <Text style={styles.infoBlockText}>
            {order.payment_method === 'cash_on_delivery' ? t('orders.cashOnDelivery') : t('orders.creditCard')} 
            {' '} • {' '} 
            <Text style={{ color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b' }}>
              {order.payment_status?.toUpperCase() || 'PENDING'}
            </Text>
          </Text>
        </View>
        
        {order.address && (
          <View style={[styles.infoBlock, { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16, marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MapPin size={16} color="#4b5563" />
              <Text style={styles.infoBlockTitle}> {t('checkout.delivery_address')}</Text>
            </View>
            <Text style={styles.infoBlockText}><Text style={{fontWeight: 'bold'}}>{order.address.title}</Text></Text>
            <Text style={styles.infoBlockText}>{order.address.full_address}</Text>
            <Text style={styles.infoBlockText}>{order.address.phone_number}</Text>
          </View>
        )}
      </View>

      {order.status.toLowerCase() === 'pending' && (
        <View style={styles.cancelContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
            <Text style={styles.cancelButtonText}>{t('orders.cancelOrder')}</Text>
          </TouchableOpacity>
          <Text style={styles.cancelHintText}>{t('orders.cancelHint')}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#ef4444' },
  headerSection: { backgroundColor: '#ffffff', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusTextLarge: { fontSize: 24, fontWeight: 'bold', marginLeft: 8 },
  orderId: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  orderDate: { fontSize: 14, color: '#9ca3af' },
  section: { backgroundColor: '#ffffff', marginTop: 16, padding: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginLeft: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 16 },
  itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f3f4f6' },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  itemPrice: { fontSize: 14, color: '#6b7280' },
  itemTotal: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  infoBlock: { },
  infoBlockTitle: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginBottom: 4 },
  infoBlockText: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  cancelContainer: { marginTop: 24, paddingHorizontal: 20 },
  cancelButton: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  cancelHintText: { color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
