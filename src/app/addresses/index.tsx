import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { supabase } from '../../lib/supabase';
import { Address } from '../../models';
import { MapPin, Plus, Trash2, Edit2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function AddressesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addresses, fetchAddresses } = useDataStore();
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAddresses(user.id);
    }
  }, [user]);

  const resetForm = () => {
    setTitle('');
    setFullAddress('');
    setPhone('');
    setEditingId(null);
    setIsFormVisible(false);
  };

  const handleEdit = (addr: Address) => {
    setTitle(addr.title);
    setFullAddress(addr.full_address);
    setPhone(addr.phone_number);
    setEditingId(addr.id);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    Alert.alert(t('alerts.deleteAddress'), t('alerts.deleteAddressConfirm'), [
      { text: t('alerts.cancel'), style: 'cancel' },
      { 
        text: t('alerts.delete'), 
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('addresses').delete().eq('id', id);
          if (error) {
            Alert.alert(t('alerts.error'), t('alerts.failedToDeleteAddress'));
          } else {
            await fetchAddresses(user.id);
          }
        }
      }
    ]);
  };

  const validateAddress = () => {
    if (!title.trim() || !fullAddress.trim() || !phone.trim()) {
      Alert.alert(t('alerts.validationError'), t('alerts.fillAllFields'));
      return false;
    }
    if (title.trim().length < 2) {
      Alert.alert(t('alerts.validationError'), t('alerts.titleTooShort'));
      return false;
    }
    if (fullAddress.trim().length < 10) {
      Alert.alert(t('alerts.validationError'), t('alerts.addressTooShort'));
      return false;
    }
    if (phone.trim().length !== 10) {
      Alert.alert(t('alerts.validationError'), t('alerts.invalidPhone'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateAddress()) return;

    if (!user) return;

    setSubmitting(true);
    
    if (editingId) {
      const { data, error } = await supabase
        .from('addresses')
        .update({ title, full_address: fullAddress, phone_number: phone })
        .eq('id', editingId)
        .select()
        .single();
        
      if (error) {
        Alert.alert(t('alerts.error'), t('alerts.failedToUpdateAddress'));
      } else if (data) {
        await fetchAddresses(user.id);
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          title,
          full_address: fullAddress,
          phone_number: phone,
        })
        .select()
        .single();
        
      if (error) {
        Alert.alert(t('alerts.error'), t('alerts.failedToSaveAddress'));
      } else if (data) {
        await fetchAddresses(user.id);
        resetForm();
      }
    }
    setSubmitting(false);
  };



  if (isFormVisible) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{editingId ? t('addresses.editAddress') : t('addresses.newAddress')}</Text>
            <TouchableOpacity onPress={resetForm}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('addresses.titleLabel')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('addresses.homePlaceholder')}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('checkout.full_address')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder={t('addresses.enterDeliveryAddress')}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('checkout.phone_number')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
              maxLength={10}
              placeholder={t('checkout.phone_number')}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSave}
            disabled={submitting}
          >
            <Text style={styles.saveBtnText}>{submitting ? t('checkout.saving') : t('checkout.save_address')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>{t('addresses.noSavedAddresses')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.addressCard}>
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <MapPin size={18} color="#10b981" />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardAddress}>{item.full_address}</Text>
              <Text style={styles.cardPhone}>{item.phone_number}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                <Edit2 size={18} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsFormVisible(true)}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>{t('addresses.addNewAddress')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginRight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  cardAddress: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  cardPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
