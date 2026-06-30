import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Heart, LogOut, MapPin, Settings, Trash2, UserCircle, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedButton } from '../../components/AnimatedButton';
import { Dialog } from '../../components/Dialog';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ShimmerImage from '../../components/ShimmerImage';
import { translateSupabaseError } from '../../lib/errorTranslator';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../models';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { theme } from '../../theme';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const { userProfile: profile, fetchUserProfile } = useDataStore();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
    }
  }, [user]);

  const handleLogout = async () => {
    setLogoutVisible(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    // Force the router to go back to the login screen immediately
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = async () => {
    setDeleteVisible(false);
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      Alert.alert(t('alerts.error'), t('alerts.failedToDeleteAccount') + ' ' + translateSupabaseError(error.message));
    } else {
      await supabase.auth.signOut();
    }
  };

  const renderMenuItem = (icon: any, title: string, onPress: () => void, isDestructive = false) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.iconWrapper, isDestructive && { backgroundColor: theme.colors.primaryLight }]}>
        {icon}
      </View>
      <Text style={[styles.menuText, isDestructive && { color: theme.colors.error }]}>{title}</Text>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <ShimmerImage source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <UserIcon size={40} color={theme.colors.primary} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{profile?.full_name || 'Set your name'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>{t('profile.profile')}</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem(<UserCircle size={22} color={theme.colors.primary} />, t('navigation.editProfile'), () => router.push('/edit-profile'))}
          {renderMenuItem(<Clock size={22} color={theme.colors.primary} />, t('profile.orders'), () => router.push('/orders'))}
          {renderMenuItem(<MapPin size={22} color={theme.colors.primary} />, t('navigation.myAddresses'), () => router.push('/addresses'))}
          {renderMenuItem(<Heart size={22} color={theme.colors.primary} />, t('profile.favorites'), () => router.push('/favorites'))}
          {renderMenuItem(<Settings size={22} color={theme.colors.primary} />, t('profile.settings'), () => router.push('/settings'))}
        </View>

        <Text style={styles.sectionHeader}>{t('profile.accountActions')}</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem(<LogOut size={22} color={theme.colors.warning} />, t('profile.logout'), () => setLogoutVisible(true))}
          {renderMenuItem(<Trash2 size={22} color={theme.colors.error} />, t('profile.deleteAccount'), () => setDeleteVisible(true), true)}
        </View>
      </ScrollView>

      {/* Logout Dialog */}
      <Dialog
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        title={t('profile.logout')}
        description="Are you sure you want to log out?"
      >
        <AnimatedButton
          title={t('profile.logout')}
          onPress={handleLogout}
          style={{ backgroundColor: theme.colors.warning, marginBottom: theme.spacing.md }}
        />
        <AnimatedButton
          title={t('common.cancel')}
          onPress={() => setLogoutVisible(false)}
          style={{ backgroundColor: theme.colors.surfaceDark }}
          textStyle={{ color: theme.colors.text }}
        />
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        title="Delete Account"
        description="Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
      >
        <AnimatedButton
          title={t('profile.deletePermanently')}
          onPress={handleDeleteAccount}
          style={{ backgroundColor: theme.colors.error, marginBottom: theme.spacing.md }}
        />
        <AnimatedButton
          title={t('common.cancel')}
          onPress={() => setDeleteVisible(false)}
          style={{ backgroundColor: theme.colors.surfaceDark }}
          textStyle={{ color: theme.colors.text }}
        />
      </Dialog>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  headerText: {
    marginLeft: theme.spacing.lg,
    flex: 1,
  },
  name: {
    ...theme.typography.h2,
    marginBottom: 4,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceDark,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    ...theme.typography.bodyLg,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
});
