import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ShoppingBasket, Eye, EyeOff, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { translateSupabaseError } from '../../lib/errorTranslator';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert(t('alerts.error'), t('alerts.fillAllFields'));
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      Alert.alert(t('alerts.error'), translateSupabaseError(error.message));
    } else {
      Alert.alert(
        t('alerts.success'), 
        t('alerts.accountCreated'), 
        [{ text: t('common.ok'), onPress: () => router.replace('/(auth)/login') }]
      );
      
      // Clear fields just in case
      setFullName('');
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <ShoppingBasket size={48} color="#10b981" />
        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <Text style={styles.subtitle}>{t('auth.signUpToStart')}</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t('auth.fullName')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailAddress')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? (
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
            style={{ paddingRight: 8 }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Check size={14} color="#ffffff" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            <Text onPress={() => setAgreed(!agreed)} suppressHighlighting={true}>{t('auth.iAgreeTo')}</Text>{' '}
            <Text 
              style={styles.linkTextInline} 
              onPress={() => router.push({ pathname: '/document', params: { type: 'privacy' } })}
              suppressHighlighting={true}
            >
              {t('auth.privacyPolicy')}
            </Text>
            <Text onPress={() => setAgreed(!agreed)} suppressHighlighting={true}>{' '}{t('auth.and')}{' '}</Text>
            <Text 
              style={styles.linkTextInline} 
              onPress={() => router.push({ pathname: '/document', params: { type: 'terms' } })}
              suppressHighlighting={true}
            >
              {t('auth.termsConditions')}
            </Text>
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, (!fullName || !email || !password || !agreed || loading) && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={!fullName || !email || !password || !agreed || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('auth.creating') : t('auth.signUp')}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeIcon: {
    padding: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 15,
  },
  linkText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxText: {
    flex: 1,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  linkTextInline: {
    color: '#10b981',
    fontWeight: 'bold',
  },
});
