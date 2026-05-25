import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import ShimmerImage from '../../components/ShimmerImage';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Shimmer from '../../components/Shimmer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
        
      if (data) setCategories(data);
      if (error) console.error('Error fetching categories:', error);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.listContainer}>
          <View style={[styles.columnWrapper, { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.md }]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={`shim-${i}`} style={styles.categoryContainer}>
                <View style={styles.categoryCard}>
                  <Shimmer style={{ width: '100%', height: '100%' }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => router.push(`/categories/${item.id}`)}
              activeOpacity={0.9}
            >
              <ShimmerImage source={item.image_url} style={styles.categoryImage} />
              <View style={styles.cardOverlay}>
                <Text style={styles.categoryName}>
                  {t(`dbCategories.${item.name.replace(/\s+/g, '_').replace(/&/g, 'and').toLowerCase()}`, { defaultValue: item.name })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 90 }]}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...theme.typography.h1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  categoryContainer: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  categoryCard: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  categoryName: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
