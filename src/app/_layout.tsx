import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

export default function RootLayout() {
  const { t } = useTranslation();
  const { user, session, setSession, setUser, setLoading, isLoading } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    fetchSettings();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Handle deep links for auth (e.g., password reset)
    const createSessionFromUrl = async (url: string | null) => {
      if (!url) return;
      
      // Supabase passes tokens in the hash fragment. Replace # with ? so Linking.parse can read it as query params.
      let parsedUrl = url;
      if (parsedUrl.includes('#')) {
        parsedUrl = parsedUrl.replace('#', '?');
      }
      
      const { queryParams } = Linking.parse(parsedUrl);
      
      if (queryParams?.access_token && queryParams?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: queryParams.access_token as string,
          refresh_token: queryParams.refresh_token as string,
        });
        if (error) {
          console.error("Error setting session from URL", error);
        }
      }
    };

    Linking.getInitialURL().then(createSessionFromUrl);
    const urlSubscription = Linking.addEventListener('url', (event) => {
      createSessionFromUrl(event.url);
    });

    return () => {
      subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isPublicRoute = segments[0] === 'document' || segments[0] === 'help';

    if (!session && !inAuthGroup && !isPublicRoute) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
    
    // Hide splash screen once auth state is resolved
    SplashScreen.hideAsync();
  }, [session, isLoading, segments, rootNavigationState?.key]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="dark" />
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { ...theme.typography.h3 },
          headerTintColor: theme.colors.text,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="products/[id]" options={{ headerShown: true, title: t('navigation.productDetails') }} />
        <Stack.Screen name="categories/[id]" options={{ headerShown: true, title: t('navigation.category') }} />
        <Stack.Screen name="addresses/index" options={{ headerShown: true, title: t('navigation.myAddresses') }} />
        <Stack.Screen name="orders/index" options={{ headerShown: true, title: t('navigation.orderHistory') }} />
        <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: t('navigation.orderDetails') }} />
        <Stack.Screen name="favorites" options={{ headerShown: true, title: t('navigation.savedItems') }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: true, title: t('navigation.editProfile') }} />
        <Stack.Screen name="checkout" options={{ headerShown: true, title: t('navigation.checkout') }} />
        <Stack.Screen name="all-products" options={{ headerShown: true, title: t('navigation.allProducts') }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: t('navigation.settings') }} />
        <Stack.Screen name="faq" options={{ headerShown: true, title: t('settings.faq', { defaultValue: 'FAQ' }) }} />
        <Stack.Screen name="help" options={{ headerShown: true, title: t('navigation.helpSupport') }} />
        <Stack.Screen name="document" options={{ headerShown: true, title: t('navigation.document') }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
