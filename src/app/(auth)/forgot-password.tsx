import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { translateSupabaseError } from '../../lib/errorTranslator';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('alerts.error'), t('alerts.fillAllFields'));
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    
    const resetUrl = Linking.createURL('/change-password');
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: resetUrl,
    });

    if (error) {
      Alert.alert(t('alerts.error'), translateSupabaseError(error.message));
    } else {
      Alert.alert(t('alerts.success'), t('alerts.passwordResetSent'));
      router.back();
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color="#1f2937" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Mail size={64} color="#10b981" />
        <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
        <Text style={styles.subtitle}>{t('auth.enterEmailForReset')}</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailAddress')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity 
          style={[styles.button, (!email || loading) && styles.buttonDisabled]} 
          onPress={handleResetPassword}
          disabled={!email || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('common.sending') : t('auth.sendResetLink')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  backButton: {
    marginTop: 50,
    marginBottom: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a7f3d0',
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
