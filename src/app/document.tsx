import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

export default function DocumentScreen() {
  const { t } = useTranslation();
  const { type } = useLocalSearchParams<{ type: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, [type]);

  const fetchPolicy = async () => {
    if (!type) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('policies')
      .select('title, content')
      .eq('type', type)
      .single();

    if (error) {
      console.error(error);
      setTitle(t('document.notFoundTitle'));
      setContent(t('document.notFoundMessage'));
    } else if (data) {
      setTitle(data.title);
      setContent(data.content);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.documentCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content}>{content}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  documentCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.radii.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  content: {
    ...theme.typography.bodyLg,
    color: theme.colors.textSecondary,
    lineHeight: 26,
  },
});
