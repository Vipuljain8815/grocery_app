import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useDataStore } from '../../store/useDataStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Order } from '../../models';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function OrdersScreen() {
  const { orders, fetchOrders } = useDataStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      fetchOrders(user.id);
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={20} color="#f59e0b" />;
      case 'processing': return <Package size={20} color="#3b82f6" />;
      case 'shipped': return <Truck size={20} color="#8b5cf6" />;
      case 'delivered': return <CheckCircle size={20} color="#10b981" />;
      case 'cancelled': return <XCircle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>{t('orders.noOrders')}</Text>
            <TouchableOpacity 
              style={styles.shopBtn}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.shopBtnText}>{t('orders.startShopping')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.orderCard}
            onPress={() => router.push(`/orders/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.orderIdContainer}>
                <Package size={16} color="#6b7280" />
                <Text style={styles.orderId}>{t('orders.orderId', { id: item.order_number || item.id.substring(0,8) })}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                {getStatusIcon(item.status)}
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('orders.date')}:</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(item.created_at), 'MMM dd, yyyy h:mm a')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('orders.total')}:</Text>
                <Text style={styles.totalValue}>{settings.currency_symbol}{item.total_amount.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.viewDetailsText}>{t('orders.viewDetails')}</Text>
              <ChevronRight size={20} color="#10b981" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#6b7280', marginBottom: 24 },
  shopBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  shopBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  orderCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderIdContainer: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginLeft: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  cardBody: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  totalValue: { fontSize: 16, color: '#10b981', fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  viewDetailsText: { fontSize: 14, color: '#10b981', fontWeight: '600', marginRight: 4 },
});
