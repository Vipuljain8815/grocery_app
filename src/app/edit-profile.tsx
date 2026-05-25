import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { Save, User, Phone, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import ShimmerImage from '../components/ShimmerImage';
import { useTranslation } from 'react-i18next';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { updateUserProfile } = useDataStore();
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setFullName(data.full_name || '');
      setPhoneNumber(data.phone_number || '');
      setAvatarUrl(data.avatar_url || null);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (phoneNumber.trim().length > 0 && phoneNumber.trim().length !== 10) {
      Alert.alert(t('alerts.validationError'), t('alerts.invalidPhone'));
      return;
    }

    setSaving(true);

    const updates = {
      id: user.id,
      email: user.email,
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      avatar_url: avatarUrl,
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updates);

    if (error) {
      Alert.alert(t('alerts.error'), t('alerts.failedToUpdateProfile'));
      console.error('Update profile error:', error);
    } else {
      updateUserProfile(updates);
      Alert.alert(t('alerts.success'), t('alerts.profileUpdated'));
      router.back();
    }
    setSaving(false);
  };

  const handleImagePickerResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0].base64) {
      setUploadingImage(true);
      const img = result.assets[0];
      const base64 = img.base64 as string;
      const filePath = `${user?.id}/${new Date().getTime()}.jpg`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
        });

      if (error) {
        Alert.alert(t('alerts.uploadError'), t('alerts.uploadFailed'));
        console.error(error);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        setAvatarUrl(publicUrlData.publicUrl);
      }
      setUploadingImage(false);
    }
  };

  const launchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('alerts.permissionRequired'), t('alerts.cameraPermission'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      await handleImagePickerResult(result);
    } catch (error) {
      console.error(error);
      Alert.alert(t('alerts.error'), t('alerts.failedCamera'));
    }
  };

  const launchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      await handleImagePickerResult(result);
    } catch (error) {
      console.error(error);
      Alert.alert(t('alerts.error'), t('alerts.failedPickImage'));
    }
  };

  const removePhoto = () => {
    setAvatarUrl(null);
  };

  const handleAvatarPress = () => {
    const options: any[] = [
      { text: t('editProfile.takePhoto'), onPress: launchCamera },
      { text: t('editProfile.chooseGallery'), onPress: launchGallery },
    ];
    
    if (avatarUrl) {
      options.push({ text: t('editProfile.removePhoto'), onPress: removePhoto, style: 'destructive' });
    }
    
    options.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(t('alerts.profilePicture'), t('alerts.chooseOption'), options);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarPlaceholder} onPress={handleAvatarPress} disabled={uploadingImage}>
          {avatarUrl ? (
            <ShimmerImage source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{fullName ? fullName.charAt(0).toUpperCase() : 'U'}</Text>
          )}
          {uploadingImage ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#ffffff" />
            </View>
          ) : (
            <View style={styles.cameraBadge}>
              <Camera size={16} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarSubtext}>{t('editProfile.tapToChange')}</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('auth.fullName')}</Text>
        <View style={styles.inputContainer}>
          <User size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('editProfile.enterFullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('checkout.phone_number')}</Text>
        <View style={styles.inputContainer}>
          <Phone size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('editProfile.enterPhone')}
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
            maxLength={10}
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveBtnText}>{t('editProfile.saveChanges')}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 16, color: '#1f2937' },
  saveBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#ffffff' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#374151', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
  avatarSubtext: { marginTop: 12, fontSize: 14, color: '#6b7280' },
});
