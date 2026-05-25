import i18n from '../i18n';

export const translateSupabaseError = (message: string): string => {
  if (!message) return '';
  
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('invalid login credentials')) {
    return i18n.t('supabaseErrors.invalidLogin');
  }
  if (msgLower.includes('user already registered')) {
    return i18n.t('supabaseErrors.userExists');
  }
  if (msgLower.includes('password should be at least')) {
    return i18n.t('supabaseErrors.weakPassword');
  }
  if (msgLower.includes('email rate limit exceeded')) {
    return i18n.t('supabaseErrors.rateLimit');
  }
  
  return message;
};
