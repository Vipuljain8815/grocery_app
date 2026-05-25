import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { translateSupabaseError } from '../lib/errorTranslator';
import { theme } from '../theme';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('alerts.error'), t('alerts.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('alerts.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      Alert.alert(t('alerts.error'), translateSupabaseError(error.message));
    } else {
      Alert.alert(t('alerts.success'), t('alerts.passwordUpdated'));
      router.back();
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.changePassword')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Lock size={64} color={theme.colors.primary} />
        </View>

        <View style={styles.form}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('auth.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              {showNewPassword ? (
                <EyeOff size={20} color={theme.colors.textSecondary} />
              ) : (
                <Eye size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={theme.colors.textSecondary} />
              ) : (
                <Eye size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, (!newPassword || !confirmPassword || loading) && styles.buttonDisabled]} 
            onPress={handleUpdatePassword}
            disabled={!newPassword || !confirmPassword || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('common.loading') : t('auth.updatePassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
