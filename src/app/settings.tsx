import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, FileText, HelpCircle, MessageCircle, ChevronRight, Globe, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { Dialog } from '../components/Dialog';
import { AnimatedButton } from '../components/AnimatedButton';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [languageVisible, setLanguageVisible] = useState(false);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setLanguageVisible(false);
  };

  const getLanguageName = (code: string) => {
    switch(code) {
      case 'hi': return t('settings.hindi');
      case 'es': return t('settings.spanish');
      default: return t('settings.english');
    }
  };

  const renderMenuItem = (icon: any, title: string, rightText: string, onPress: () => void, hideBorder = false) => (
    <TouchableOpacity style={[styles.menuItem, hideBorder && { borderBottomWidth: 0 }]} onPress={onPress}>
      <View style={styles.iconWrapper}>
        {icon}
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <View style={styles.rightContent}>
        {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        <ChevronRight size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionHeader}>{t('settings.appearance')}</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem(
            <Globe size={22} color={theme.colors.primary} />,
            t('settings.language'),
            getLanguageName(i18n.language),
            () => setLanguageVisible(true),
            true
          )}
        </View>

        <Text style={styles.sectionHeader}>{t('profile.accountActions')}</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem(
            <Lock size={22} color={theme.colors.primary} />,
            t('settings.changePassword'),
            '',
            () => router.push('/change-password' as any),
            true
          )}
        </View>

        <Text style={styles.sectionHeader}>{t('settings.supportLegal')}</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem(
            <HelpCircle size={22} color={theme.colors.primary} />,
            t('settings.faq'),
            '',
            () => router.push('/faq')
          )}
          {renderMenuItem(
            <MessageCircle size={22} color={theme.colors.primary} />,
            t('settings.helpSupport'),
            '',
            () => router.push('/help')
          )}
          {renderMenuItem(
            <Shield size={22} color={theme.colors.primary} />,
            t('settings.privacyPolicy'),
            '',
            () => router.push('/document?type=privacy')
          )}
          {renderMenuItem(
            <FileText size={22} color={theme.colors.primary} />,
            t('settings.termsConditions'),
            '',
            () => router.push('/document?type=terms'),
            true
          )}
        </View>

      </ScrollView>

      {/* Language Dialog */}
      <Dialog
        visible={languageVisible}
        onClose={() => setLanguageVisible(false)}
        title={t('settings.select_language')}
      >
        <AnimatedButton 
          title={t('settings.english')} 
          onPress={() => handleLanguageChange('en')} 
          style={{ backgroundColor: i18n.language === 'en' ? theme.colors.primary : theme.colors.surfaceDark, marginBottom: theme.spacing.md }} 
          textStyle={i18n.language === 'en' ? {} : { color: theme.colors.text }}
        />
        <AnimatedButton 
          title={t('settings.hindi')} 
          onPress={() => handleLanguageChange('hi')} 
          style={{ backgroundColor: i18n.language === 'hi' ? theme.colors.primary : theme.colors.surfaceDark, marginBottom: theme.spacing.md }} 
          textStyle={i18n.language === 'hi' ? {} : { color: theme.colors.text }}
        />
        <AnimatedButton 
          title={t('settings.spanish')} 
          onPress={() => handleLanguageChange('es')} 
          style={{ backgroundColor: i18n.language === 'es' ? theme.colors.primary : theme.colors.surfaceDark, marginBottom: theme.spacing.md }} 
          textStyle={i18n.language === 'es' ? {} : { color: theme.colors.text }}
        />
        <AnimatedButton 
          title={t('common.cancel')} 
          onPress={() => setLanguageVisible(false)} 
          style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }} 
          textStyle={{ color: theme.colors.text }}
        />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
    paddingTop: theme.spacing.md,
  },
  sectionHeader: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
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
    color: theme.colors.text,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
});
