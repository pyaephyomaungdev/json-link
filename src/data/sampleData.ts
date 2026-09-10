import { TranslationItem } from '@/types';

// Generic sample localization dataset (30 practical, non-branded examples)
export const sampleEnglishData: Record<string, string> = {
  "common.ok": "OK",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "common.retry": "Retry",
  "common.close": "Close",
  "common.loading": "Loading...",
  "common.success": "Operation completed successfully.",
  "common.error": "Something went wrong. Please try again.",
  "nav.home": "Home",
  "nav.dashboard": "Dashboard",
  "nav.analytics": "Analytics",
  "nav.settings": "Settings",
  "nav.profile": "Profile",
  "nav.logout": "Log Out",
  "auth.login.title": "Welcome Back",
  "auth.login.subtitle": "Enter your credentials to sign in to your account.",
  "auth.login.email": "Email Address",
  "auth.login.password": "Password",
  "auth.login.forgotPassword": "Forgot Password?",
  "auth.login.submit": "Sign In",
  "auth.register.title": "Create an Account",
  "auth.register.fullName": "Full Name",
  "auth.register.terms": "I agree to the terms and privacy policy.",
  "auth.register.submit": "Create Account",
  "settings.theme.dark": "Dark Mode",
  "settings.theme.light": "Light Mode",
  "notifications.title": "Notifications",
};

export const sampleMyanmarData: Record<string, string> = {
  "common.ok": "အိုကေ",
  "common.cancel": "မလုပ်တော့ပါ",
  "common.save": "သိမ်းမည်",
  "common.delete": "ဖျက်မည်",
  "common.edit": "တည်းဖြတ်မည်",
  "common.search": "ရှာဖွေမည်",
  "common.retry": "ထပ်ကြိုးစားမည်",
  "common.close": "ပိတ်မည်",
  "common.loading": "ဖွင့်နေသည်...",
  "common.success": "လုပ်ဆောင်မှု အောင်မြင်ပါသည်",
  "common.error": "တစ်ခုခု မှားယွင်းနေပါသည်။ ထပ်မံကြိုးစားပါ။",
  "nav.home": "ပင်မစာမျက်နှာ",
  "nav.dashboard": "ဒက်ရှ်ဘုတ်",
  "nav.analytics": "အချက်အလက်ပိုင်းခြားစိတ်ဖြာမှု",
  "nav.settings": "ဆက်တင်များ",
  "nav.profile": "ပရိုဖိုင်",
  "nav.logout": "အကောင့်မှထွက်မည်",
  "auth.login.title": "ပြန်လည်ကြိုဆိုပါသည်",
  "auth.login.subtitle": "အကောင့်ဝင်ရောက်ရန် အချက်အလက်များ ဖြည့်သွင်းပါ",
  "auth.login.email": "အီးမေးလ်လိပ်စာ",
  "auth.login.password": "စကားဝှက်",
  "auth.login.forgotPassword": "စကားဝှက် မေ့နေပါသလား?",
  "auth.login.submit": "ဝင်ရောက်မည်",
  "auth.register.title": "အကောင့်အသစ်ဖွင့်မည်",
  "auth.register.fullName": "အမည်အပြည့်အစုံ",
  "auth.register.terms": "စည်းကမ်းသတ်မှတ်ချက်များကို သဘောတူပါသည်",
  "auth.register.submit": "အကောင့်ဖွင့်မည်",
  "settings.theme.dark": "အမှောင်စနစ်",
  "settings.theme.light": "အလင်းစနစ်",
  "notifications.title": "အသိပေးချက်များ",
};

/**
 * Generates initial TranslationItem array combining Myanmar and English
 */
export function getInitialTranslations(): { items: TranslationItem[]; languages: string[] } {
  const languages = ['en', 'my'];
  const allKeys = Object.keys(sampleEnglishData);

  const items: TranslationItem[] = allKeys.map(key => ({
    key,
    en: sampleEnglishData[key] || '',
    my: sampleMyanmarData[key] || '',
  }));

  return { items, languages };
}
