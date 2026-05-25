import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { AnimatedButton } from '../components/AnimatedButton';

export default function HelpScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (user) {
      setEmail(user.email || '');
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      if (data && data.full_name) {
        setName(data.full_name);
      }
    }
    setFetchingProfile(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(t('alerts.validationError'), t('alerts.fillAllFieldsHelp'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('alerts.validationError'), t('alerts.invalidEmail'));
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user ? user.id : null,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

    if (error) {
      console.error(error);
      Alert.alert(t('alerts.error'), t('alerts.failedToSubmitMessage'));
    } else {
      Alert.alert(t('alerts.success'), t('alerts.messageSentSuccess'));
      setMessage('');
      if (!user) {
        setName('');
        setEmail('');
      }
    }
    
    setLoading(false);
  };

  if (fetchingProfile) {
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MessageCircle size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>{t('help.title')}</Text>
          <Text style={styles.subtitle}>{t('help.subtitle')}</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('auth.fullName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('help.enterName')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('auth.emailAddress')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('help.enterEmail')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('help.message')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('help.messagePlaceholder')}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
        
        <AnimatedButton 
          title={loading ? t('common.loading') || 'Sending...' : t('help.submit')}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        />
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodyLg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.bodySm,
    fontWeight: '600',
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
    color: theme.colors.text,
  },
  textArea: {
    height: 120,
    paddingTop: theme.spacing.md,
  },
  submitButton: {
    width: '100%',
  }
});
