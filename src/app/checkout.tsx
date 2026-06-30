import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Plus, MapPin, Edit2, Trash2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Address } from '../models';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { AnimatedButton } from '../components/AnimatedButton';

export default function CheckoutScreen() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
    } else if (data) {
      setAddresses(data);
      if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      } else {
        setIsAddingNew(true);
      }
    }
    setLoading(false);
  };

  const handleEditAddress = (addr: Address) => {
    setNewTitle(addr.title);
    setNewAddress(addr.full_address);
    setNewPhone(addr.phone_number);
    setEditingAddressId(addr.id);
    setIsAddingNew(true);
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert(t('alerts.deleteAddress'), t('alerts.deleteAddressConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { 
        text: t('alerts.delete'), 
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('addresses').delete().eq('id', id);
          if (error) {
            Alert.alert(t('alerts.error'), t('alerts.failedToDeleteAddress'));
          } else {
            setAddresses(addresses.filter(a => a.id !== id));
            if (selectedAddressId === id) {
              setSelectedAddressId(null);
            }
          }
        }
      }
    ]);
  };

  const validateAddress = () => {
    if (!newTitle.trim() || !newAddress.trim() || !newPhone.trim()) {
      Alert.alert(t('alerts.validationError'), t('alerts.fillAllFields'));
      return false;
    }
    if (newTitle.trim().length < 2) {
      Alert.alert(t('alerts.validationError'), t('alerts.titleTooShort'));
      return false;
    }
    if (newAddress.trim().length < 10) {
      Alert.alert(t('alerts.validationError'), t('alerts.addressTooShort'));
      return false;
    }
    if (newPhone.trim().length !== 10) {
      Alert.alert(t('alerts.validationError'), t('alerts.invalidPhone'));
      return false;
    }
    return true;
  };

  const handleSaveAddress = async () => {
    if (!validateAddress()) return;

    if (!user) {
      Alert.alert(t('alerts.error'), t('alerts.loginToSaveAddress'));
      return;
    }

    setSubmitting(true);
    
    if (editingAddressId) {
      const { data, error } = await supabase
        .from('addresses')
        .update({ title: newTitle, full_address: newAddress, phone_number: newPhone })
        .eq('id', editingAddressId)
        .select()
        .single();

      if (error) {
        Alert.alert(t('alerts.error'), t('alerts.failedToUpdateAddress'));
      } else if (data) {
        setAddresses(addresses.map(a => a.id === editingAddressId ? data : a));
        setSelectedAddressId(data.id);
        setIsAddingNew(false);
        setEditingAddressId(null);
        setNewTitle('');
        setNewAddress('');
        setNewPhone('');
      }
    } else {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          title: newTitle,
          full_address: newAddress,
          phone_number: newPhone,
        })
        .select()
        .single();

      if (error) {
        Alert.alert(t('alerts.error'), t('alerts.failedToSaveAddress'));
      } else if (data) {
        setAddresses([data, ...addresses]);
        setSelectedAddressId(data.id);
        setIsAddingNew(false);
        setEditingAddressId(null);
        setNewTitle('');
        setNewAddress('');
        setNewPhone('');
      }
    }
    setSubmitting(false);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert(t('alerts.error'), t('alerts.enterCoupon'));
      return;
    }
    
    setApplyingCoupon(true);
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();
      
    if (error || !data) {
      Alert.alert(t('alerts.invalidCoupon'), t('alerts.invalidCouponMsg'));
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } else {
      const subtotal = getTotalPrice();
      if (subtotal < data.min_order_amount) {
        Alert.alert(t('alerts.requirementNotMet'), t('alerts.minOrderReq', { amount: data.min_order_amount.toFixed(2) }));
        setAppliedCoupon(null);
        setDiscountAmount(0);
      } else {
        if (data.valid_until && new Date(data.valid_until) < new Date()) {
          Alert.alert(t('alerts.expired'), t('alerts.couponExpired'));
          setAppliedCoupon(null);
          setDiscountAmount(0);
        } else {
          setAppliedCoupon(data);
          let amount = 0;
          if (data.discount_type === 'percentage') {
            amount = subtotal * (data.discount_value / 100);
          } else {
            amount = data.discount_value;
          }
          setDiscountAmount(amount);
          Alert.alert(t('alerts.success'), t('alerts.couponApplied'));
        }
      }
    }
    setApplyingCoupon(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert(t('alerts.error'), t('alerts.selectAddress'));
      return;
    }

    if (!user) {
      Alert.alert(t('alerts.error'), t('alerts.loginToOrder'));
      return;
    }

    setSubmitting(true);
    
    const subtotal = getTotalPrice();
    const deliveryFee = settings.delivery_charge;
    const taxAmount = subtotal * (settings.tax_percentage / 100);
    const finalTotal = Math.max(0, subtotal + deliveryFee + taxAmount - discountAmount);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        address_id: selectedAddressId,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        tax: taxAmount,
        discount: discountAmount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        total_amount: finalTotal,
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        status: 'pending'
      })
      .select()
      .single();

    if (orderError || !order) {
      Alert.alert(t('alerts.error'), t('alerts.failedToCreateOrder'));
      setSubmitting(false);
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      Alert.alert(t('alerts.warning'), t('alerts.orderWarning'));
    }

    const stockUpdates = items.map(async (item) => {
      await supabase.rpc('decrement_stock', {
        product_id: item.id,
        decrement_by: item.quantity
      });
    });

    await Promise.all(stockUpdates);

    setSubmitting(false);
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconWrapper}>
          <CheckCircle size={80} color={theme.colors.primary} />
        </View>
        <Text style={styles.successTitle}>{t('checkout.order_placed')}</Text>
        <Text style={styles.successMessage}>
          {t('checkout.order_placed_msg')}
        </Text>
        <AnimatedButton 
          title={t('checkout.back_to_home')}
          onPress={() => router.push('/(tabs)')}
          style={styles.homeButton}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>{t('checkout.delivery_address')}</Text>
          {!isAddingNew && (
            <TouchableOpacity onPress={() => {
              setEditingAddressId(null);
              setNewTitle('');
              setNewAddress('');
              setNewPhone('');
              setIsAddingNew(true);
            }} style={styles.addIconBtn}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={styles.addIconText}>{t('checkout.add_new')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isAddingNew ? (
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('checkout.address_title')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('addresses.homePlaceholder')}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('checkout.full_address')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('checkout.full_address')}
                value={newAddress}
                onChangeText={setNewAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('checkout.phone_number')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('checkout.phone_number')}
                value={newPhone}
                onChangeText={(text) => setNewPhone(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formActions}>
              {addresses.length > 0 && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                  setIsAddingNew(false);
                  setEditingAddressId(null);
                }}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              )}
              <AnimatedButton 
                title={submitting ? t('checkout.saving') : t('checkout.save_address')}
                onPress={handleSaveAddress}
                disabled={submitting}
                style={[styles.saveBtn, addresses.length === 0 && { flex: 1 }]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {addresses.map((addr) => (
              <TouchableOpacity 
                key={addr.id}
                style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardSelected]}
                onPress={() => setSelectedAddressId(addr.id)}
              >
                <View style={styles.addressHeaderRow}>
                  <View style={styles.addressHeader}>
                    <MapPin size={20} color={selectedAddressId === addr.id ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[styles.addressTitle, selectedAddressId === addr.id && styles.textSelected]}>
                      {addr.title}
                    </Text>
                  </View>
                  <View style={styles.actionIcons}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditAddress(addr)}>
                      <Edit2 size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteAddress(addr.id)}>
                      <Trash2 size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressText}>{addr.full_address}</Text>
                <Text style={styles.addressPhone}>{addr.phone_number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>{t('checkout.promo_code')}</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder={t('checkout.enter_coupon')}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!appliedCoupon}
            />
            {appliedCoupon ? (
              <TouchableOpacity 
                style={styles.removeCouponBtn}
                onPress={() => {
                  setAppliedCoupon(null);
                  setDiscountAmount(0);
                  setCouponCode('');
                }}
              >
                <Text style={styles.removeCouponText}>{t('checkout.remove')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.applyCouponBtn, !couponCode.trim() && { opacity: 0.5 }]}
                onPress={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode.trim()}
              >
                {applyingCoupon ? (
                  <ActivityIndicator color={theme.colors.surface} size="small" />
                ) : (
                  <Text style={styles.applyCouponText}>{t('checkout.apply')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          {appliedCoupon && (
            <Text style={styles.couponSuccessText}>
              '{appliedCoupon.code}' applied!
            </Text>
          )}
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>{t('checkout.order_summary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
            <Text style={styles.summaryValue}>{settings.currency_symbol}{getTotalPrice().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('checkout.delivery_fee')}</Text>
            <Text style={styles.summaryValue}>{settings.currency_symbol}{settings.delivery_charge.toFixed(2)}</Text>
          </View>
          {settings.tax_percentage > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.tax_with_percentage', { percentage: settings.tax_percentage })}</Text>
              <Text style={styles.summaryValue}>{settings.currency_symbol}{(getTotalPrice() * (settings.tax_percentage / 100)).toFixed(2)}</Text>
            </View>
          )}
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>{t('checkout.discount')}</Text>
              <Text style={styles.discountValue}>-{settings.currency_symbol}{discountAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
            <Text style={styles.totalValue}>{settings.currency_symbol}{Math.max(0, getTotalPrice() + settings.delivery_charge + (getTotalPrice() * (settings.tax_percentage / 100)) - discountAmount).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {!isAddingNew && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <AnimatedButton 
            title={submitting ? t('checkout.processing') : t('checkout.place_order')}
            onPress={handlePlaceOrder}
            disabled={submitting || !selectedAddressId}
            style={styles.placeOrderButton}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  addIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIconText: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  addressesList: {
    marginBottom: theme.spacing.lg,
  },
  addressCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  addressCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
    marginLeft: theme.spacing.sm,
  },
  addressTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  textSelected: {
    color: theme.colors.primaryDark,
  },
  addressText: {
    ...theme.typography.body,
    marginBottom: 4,
  },
  addressPhone: {
    ...theme.typography.bodySm,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodySm,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    ...theme.typography.bodyLg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
  },
  cancelBtnText: {
    ...theme.typography.bodyLg,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
  },
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  summaryLabel: {
    ...theme.typography.bodyLg,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    ...theme.typography.h3,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  totalLabel: {
    ...theme.typography.h2,
  },
  totalValue: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  placeOrderButton: {
    width: '100%',
  },
  successContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    ...theme.typography.bodyLg,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  homeButton: {
    width: '100%',
  },
  couponRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  couponInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    ...theme.typography.bodyLg,
    marginRight: theme.spacing.md,
  },
  applyCouponBtn: {
    backgroundColor: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radii.md,
  },
  applyCouponText: {
    ...theme.typography.bodyLg,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  removeCouponBtn: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radii.md,
  },
  removeCouponText: {
    ...theme.typography.bodyLg,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  couponSuccessText: {
    ...theme.typography.bodySm,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  discountLabel: {
    ...theme.typography.bodyLg,
    color: theme.colors.primary,
  },
  discountValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
});
