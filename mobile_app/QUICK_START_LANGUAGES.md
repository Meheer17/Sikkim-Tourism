# 🚀 Quick Start: Adding Languages to Your App

## Super Simple! Just 2 Steps

### Step 1️⃣ Add to `constants/languages.ts`

```typescript
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', icon: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', nativeName: 'Hindi', icon: '🇮🇳' },
  
  // ADD YOUR LANGUAGE HERE:
  { code: 'es', name: 'Español', nativeName: 'Spanish', icon: '🇪🇸' },
];
```

### Step 2️⃣ Add to `constants/translations.ts`

```typescript
export const translations: TranslationsMap = {
  en: { /* English translations */ },
  hi: { /* Hindi translations */ },
  
  // ADD YOUR LANGUAGE HERE:
  es: {
    language: 'Idioma',
    home: 'Inicio',
    services: 'Servicios',
    explore: 'Explorar',
    bookings: 'Reservas',
    // ... add all 200+ keys
  },
};
```

### Done! 🎉 

The app will automatically:
- Show the language in language selector
- Support switching to that language
- Update all 70+ pages instantly
- Save user's choice

---

## 🌍 Common Language Codes

```
en - English 🇺🇸
hi - Hindi 🇮🇳
es - Spanish 🇪🇸
fr - French 🇫🇷
de - German 🇩🇪
it - Italian 🇮🇹
pt - Portuguese 🇵🇹
ja - Japanese 🇯🇵
zh - Chinese 🇨🇳
ko - Korean 🇰🇷
ru - Russian 🇷🇺
ar - Arabic 🇸🇦
```

---

## 📋 All Translation Keys (Copy & Paste Template)

```typescript
xx: {  // Replace 'xx' with your language code
  language: '',
  chooseLanguage: '',
  english: '',
  hindi: '',
  home: '',
  services: '',
  explore: '',
  bookings: '',
  profile: '',
  dashboard: '',
  manage: '',
  places: '',
  roles: '',
  events: '',
  tickets: '',
  chat: '',
  search: '',
  back: '',
  next: '',
  save: '',
  cancel: '',
  confirm: '',
  delete: '',
  edit: '',
  add: '',
  logout: '',
  settings: '',
  login: '',
  signup: '',
  register: '',
  email: '',
  password: '',
  forgotPassword: '',
  rememberMe: '',
  welcomeBack: '',
  signInContinue: '',
  newUser: '',
  alreadyUser: '',
  missingFields: '',
  pleaseEnter: '',
  loginFailed: '',
  checkCredentials: '',
  explore_places: '',
  popular_services: '',
  trending_now: '',
  viewAll: '',
  specialOffer: '',
  getDiscount: '',
  allServices: '',
  searchServices: '',
  filterBy: '',
  adventure: '',
  culture: '',
  transport: '',
  food: '',
  all: '',
  nearbyPlaces: '',
  expandMap: '',
  collapseMap: '',
  loading_places: '',
  myBookings: '',
  upcomingBookings: '',
  pastBookings: '',
  bookingDetails: '',
  bookingHistory: '',
  active: '',
  upcoming: '',
  completed: '',
  myProfile: '',
  editProfile: '',
  myFavorites: '',
  favoriteSubtitle: '',
  favoritesComingSoon: '',
  savedPlacesSubtitle: '',
  savedPlacesComingSoon: '',
  bookingHistorySubtitle: '',
  bookingHistoryComingSoon: '',
  savedPlaces: '',
  helpSupport: '',
  safetyCenter: '',
  terms: '',
  about: '',
  accountSettings: '',
  bookingHistoryMenu: '',
  friendsLocation: '',
  notifications: '',
  privacy: '',
  community: '',
  typeMessage: '',
  send: '',
  noResults: '',
  noBookings: '',
  noFavorites: '',
  loading: '',
  retry: '',
  error: '',
  success: '',
  adminDashboard: '',
  adminUsers: '',
  adminBusinesses: '',
  adminPlaces: '',
  adminOrganizations: '',
  adminRoles: '',
  adminManage: '',
  totalUsers: '',
  totalBusinesses: '',
  totalPlaces: '',
  totalOrganizations: '',
  searchBusinesses: '',
  categoryFilter: '',
  statusFilter: '',
  noBusinessesFound: '',
  businessDashboard: '',
  businessBookings: '',
  businessServices: '',
  businessRequests: '',
  businessProfile: '',
  businessManage: '',
  addService: '',
  editService: '',
  serviceName: '',
  servicePrice: '',
  serviceDescription: '',
  organizationDashboard: '',
  organizationEvents: '',
  organizationTickets: '',
  organizationPlaces: '',
  organizationProfile: '',
  addEvent: '',
  editEvent: '',
  eventName: '',
  eventDate: '',
  eventLocation: '',
  manageTickets: '',
  aboutUs: '',
  version: '',
  versionNumber: '',
  aboutDescription: '',
  helpAndSupport: '',
  weAreHere: '',
  commonTopics: '',
  howToBook: '',
  paymentMethods: '',
  cancellationPolicy: '',
  refundProcess: '',
  needMoreHelp: '',
  contactUs: '',
  contactSupport: '',
  safetyInformation: '',
  safetyTips: '',
  travelSafely: '',
  yourSafetyPriority: '',
  emergencyHelpline: '',
  verifySP: '',
  verifySPDesc: '',
  emergencyContacts: '',
  emergencyContactsDesc: '',
  shareLocation: '',
  shareLocationDesc: '',
  securePayments: '',
  securePaymentsDesc: '',
  termsAndConditions: '',
  acceptanceOfTerms: '',
  acceptAgreement: '',
  useLicense: '',
  usePermission: '',
  privacyPolicy: '',
  privacyDescription: '',
  infoWeCollect: '',
  collectDescription: '',
  howWeUse: '',
  useDescription: '',
  favorites: '',
  bookingHistoryPage: '',
  myReviews: '',
  mySavedPlaces: '',
  myFriendsAndLocation: '',
  notificationSettings: '',
  notificationsSubtitle: '',
  notificationsComingSoon: '',
  myReviewsSubtitle: '',
  reviewsComingSoon: '',
  friendsLocationSubtitle: '',
  shareMyLocation: '',
  shareLocationToggleOn: '',
  shareLocationToggleOff: '',
  searchRadius: '',
  nearbyFriends: '',
  notSharingLocation: '',
  locationSharingDisabled: '',
  vouchersMyCoupons: '',
  vouchersSubtitle: '',
  vouchersComingSoon: '',
  immersiveExperience: '',
  aiPlanner: '',
  placeDetails: '',
  eventDetails: '',
  currency: '',
  category: '',
  status: '',
  date: '',
  time: '',
  location: '',
  description: '',
  name: '',
  price: '',
  rating: '',
  reviews: '',
  distance: '',
  contact: '',
  address: '',
  website: '',
  email_label: '',
  firstName: '',
  lastName: '',
  phone: '',
  confirmPassword: '',
  passwordMismatch: '',
  registrationSuccess: '',
  businesses: '',
  users: '',
  analytics: '',
}
```

---

## 🎯 Usage in Components

```typescript
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/constants/translations';

export default function MyComponent() {
  const { language } = useLanguage();
  const t = translations[language];
  
  return <Text>{t.home}</Text>;  // Automatically translated!
}
```

---

## ✅ Verification Checklist

After adding a language:

- [ ] Added language config to `constants/languages.ts`
- [ ] Added all translation keys to `constants/translations.ts`
- [ ] Saved the files
- [ ] App builds without errors
- [ ] Language appears in language selector
- [ ] Can switch to the language
- [ ] UI shows translated text
- [ ] All pages are translated
- [ ] Language persists after app restart

---

## 🐛 Troubleshooting

**Language not showing in selector?**
- Check language code in `languages.ts`
- Make sure you added it to `SUPPORTED_LANGUAGES` array
- Restart app

**Language shows key instead of translation?**
- You forgot to translate that key in `translations.ts`
- Add the missing key: `keyName: 'Your translation'`

**Translations not updating?**
- Check language code matches exactly (case-sensitive)
- Reload app
- Clear app cache if needed

**TypeScript errors?**
- Make sure translation key exists in all languages
- Check for typos in key names

---

## 📞 Need Help?

1. **Check Examples**: See `LANGUAGE_EXAMPLES.ts` for Spanish example
2. **Read Guide**: See `MULTI_LANGUAGE_GUIDE.md` for detailed explanation
3. **Review Code**: Look at `constants/translations.ts` for patterns
4. **Check Pages**: See how pages use `useLanguage()` hook

---

## 🚀 You're Ready!

Your app supports **unlimited languages**. Have fun translating! 🌍

