/**
 * EXAMPLE: How to Add Spanish Language
 * 
 * This file shows exactly how to add a new language to the app.
 * Copy this pattern for any new language!
 */

// ============================================================
// STEP 1: Update constants/languages.ts
// ============================================================

// Add this to SUPPORTED_LANGUAGES array:

const NEW_LANGUAGE_CONFIG = {
  code: 'es',              // ISO 639-1 language code
  name: 'Español',         // Display name in the language
  nativeName: 'Spanish',   // English name for reference
  icon: '🇪🇸',            // Optional flag emoji
};

// Result: Users will see "Español" in the language selector with the 🇪🇸 flag


// ============================================================
// STEP 2: Update constants/translations.ts
// ============================================================

// Add this to the translations object:

const SPANISH_TRANSLATIONS = {
  es: {
    // Language Screen
    language: 'Idioma',
    chooseLanguage: 'Elige tu idioma preferido',
    english: 'English',
    hindi: 'हिंदी',

    // Navigation & General
    home: 'Inicio',
    services: 'Servicios',
    explore: 'Explorar',
    bookings: 'Reservas',
    profile: 'Perfil',
    dashboard: 'Panel',
    manage: 'Administrar',
    places: 'Lugares',
    roles: 'Funciones',
    events: 'Eventos',
    tickets: 'Entradas',
    chat: 'Chat',
    search: 'Buscar',
    back: 'Atrás',
    next: 'Siguiente',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    logout: 'Cerrar sesión',
    settings: 'Configuración',

    // Auth
    login: 'Iniciar sesión',
    signup: 'Registrarse',
    register: 'Registro',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidó su contraseña?',
    rememberMe: 'Recuérdame',
    welcomeBack: 'Bienvenido de nuevo',
    signInContinue: 'Inicia sesión para continuar',
    newUser: '¿Usuario nuevo?',
    alreadyUser: '¿Ya tienes una cuenta?',
    missingFields: 'Campos obligatorios',
    pleaseEnter: 'Por favor ingresa correo y contraseña',
    loginFailed: 'Error al iniciar sesión',
    checkCredentials: 'Por favor verifica tus credenciales',

    // Home Screen
    explore_places: 'Explorar lugares',
    popular_services: 'Servicios populares',
    trending_now: 'Tendencia ahora',
    viewAll: 'Ver todo',
    specialOffer: '¡Oferta especial!',
    getDiscount: 'Obtén 20% de descuento en tu primera reserva',

    // Services
    allServices: 'Todos los servicios',
    searchServices: 'Buscar servicios...',
    filterBy: 'Filtrar por',
    adventure: 'Aventura',
    culture: 'Cultura',
    transport: 'Transporte',
    food: 'Comida',
    all: 'Todos',

    // Explore
    nearbyPlaces: 'Lugares cercanos',
    expandMap: 'Expandir mapa',
    collapseMap: 'Contraer mapa',
    loading_places: 'Cargando lugares...',

    // Bookings
    myBookings: 'Mis reservas',
    upcomingBookings: 'Próximas reservas',
    pastBookings: 'Reservas anteriores',
    bookingDetails: 'Detalles de la reserva',
    bookingHistory: 'Historial de reservas',
    active: 'Activo',
    upcoming: 'Próximo',
    completed: 'Completado',

    // Profile
    myProfile: 'Mi perfil',
    editProfile: 'Editar perfil',
    myFavorites: 'Mis favoritos',
    favoriteSubtitle: 'Tus lugares y servicios favoritos',
    favoritesComingSoon: 'El contenido de favoritos estará disponible pronto...',
    savedPlacesSubtitle: 'Lugares que deseas visitar',
    savedPlacesComingSoon: 'Los lugares guardados estarán disponibles pronto...',
    bookingHistorySubtitle: 'Ver todas tus reservas anteriores',
    bookingHistoryComingSoon: 'El historial de reservas estará disponible pronto...',
    savedPlaces: 'Lugares guardados',
    helpSupport: 'Ayuda y soporte',
    safetyCenter: 'Centro de seguridad',
    terms: 'Términos y condiciones',
    about: 'Acerca de',
    accountSettings: 'Configuración de cuenta',
    bookingHistoryMenu: 'Historial de reservas',
    friendsLocation: 'Amigos y ubicación',
    notifications: 'Notificaciones',
    privacy: 'Política de privacidad',

    // Community Chat
    community: 'Comunidad',
    typeMessage: 'Escribe un mensaje...',
    send: 'Enviar',

    // Messages & Notifications
    noResults: 'No se encontraron resultados',
    noBookings: 'No se encontraron reservas',
    noFavorites: 'No hay favoritos añadidos',
    loading: 'Cargando...',
    retry: 'Reintentar',
    error: 'Algo salió mal',
    success: 'Éxito',

    // Admin Pages
    adminDashboard: 'Panel',
    adminUsers: 'Usuarios',
    adminBusinesses: 'Empresas',
    adminPlaces: 'Lugares',
    adminOrganizations: 'Organizaciones',
    adminRoles: 'Funciones',
    adminManage: 'Administración',
    totalUsers: 'Usuarios totales',
    totalBusinesses: 'Empresas totales',
    totalPlaces: 'Lugares totales',
    totalOrganizations: 'Organizaciones totales',
    searchBusinesses: 'Buscar empresas...',
    categoryFilter: 'Categoría',
    statusFilter: 'Estado',
    noBusinessesFound: 'No se encontraron empresas',

    // Business Pages
    businessDashboard: 'Panel de negocio',
    businessBookings: 'Mis reservas',
    businessServices: 'Mis servicios',
    businessRequests: 'Solicitudes de servicio',
    businessProfile: 'Perfil de negocio',
    businessManage: 'Administrar negocio',
    addService: 'Añadir servicio',
    editService: 'Editar servicio',
    serviceName: 'Nombre del servicio',
    servicePrice: 'Precio',
    serviceDescription: 'Descripción',

    // Organization Pages
    organizationDashboard: 'Panel de organización',
    organizationEvents: 'Eventos',
    organizationTickets: 'Entradas',
    organizationPlaces: 'Lugares',
    organizationProfile: 'Perfil de organización',
    addEvent: 'Añadir evento',
    editEvent: 'Editar evento',
    eventName: 'Nombre del evento',
    eventDate: 'Fecha del evento',
    eventLocation: 'Ubicación del evento',
    manageTickets: 'Administrar entradas',

    // Stack Pages & More...
    // Copy all remaining keys from 'en' version above and translate them
    
    // Common UI
    currency: '₹',
    category: 'Categoría',
    status: 'Estado',
    date: 'Fecha',
    time: 'Hora',
    location: 'Ubicación',
    description: 'Descripción',
    name: 'Nombre',
    price: 'Precio',
    rating: 'Calificación',
    reviews: 'Opiniones',
    distance: 'Distancia',
    contact: 'Contacto',
    address: 'Dirección',
    website: 'Sitio web',
    email_label: 'Dirección de correo',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    confirmPassword: 'Confirmar contraseña',
    passwordMismatch: 'Las contraseñas no coinciden',
    registrationSuccess: 'Registro exitoso',
  },
};

// ============================================================
// RESULT
// ============================================================

/*
After adding Spanish:

1. Language selector will show:
   - English 🇺🇸
   - हिंदी 🇮🇳
   - Español 🇪🇸

2. Users can switch to Spanish

3. Entire app will be translated to Spanish:
   - All buttons will show Spanish text
   - All labels will show Spanish text
   - All 70+ pages will be in Spanish

4. Spanish preference will be saved automatically

That's it! No other code changes needed! 🎉
*/

// ============================================================
// ADDING MORE LANGUAGES
// ============================================================

/*
To add French:

1. In constants/languages.ts:
   {
     code: 'fr',
     name: 'Français',
     nativeName: 'French',
     icon: '🇫🇷',
   }

2. In constants/translations.ts:
   fr: {
     language: 'Langue',
     home: 'Accueil',
     services: 'Services',
     // ... translate all keys
   }

To add Japanese:

1. In constants/languages.ts:
   {
     code: 'ja',
     name: '日本語',
     nativeName: 'Japanese',
     icon: '🇯🇵',
   }

2. In constants/translations.ts:
   ja: {
     language: '言語',
     home: 'ホーム',
     services: 'サービス',
     // ... translate all keys
   }

The pattern is always the same - just add language config and translations!
*/

// ============================================================
// TESTING YOUR NEW LANGUAGE
// ============================================================

/*
1. App will automatically show new language in language selector
2. Select your new language
3. App UI should immediately show translations
4. Refresh app - language should persist
5. All 70+ pages should show translations correctly

If translation key is missing:
- The key name will be displayed as fallback
- Check constants/translations.ts to add missing key
*/

// ============================================================
// LANGUAGE CODES (ISO 639-1)
// ============================================================

const COMMON_LANGUAGE_CODES = {
  'en': 'English',
  'hi': 'Hindi',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'zh': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ko': 'Korean',
  'ru': 'Russian',
  'ar': 'Arabic',
  'pl': 'Polish',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'th': 'Thai',
};

// ============================================================
// BEST PRACTICES
// ============================================================

const BEST_PRACTICES = `
✅ Use ISO 639-1 language codes (en, hi, es, fr)
✅ Add language name in its own language (e.g., 'Español' not 'Spanish')
✅ Include nativeName for reference (e.g., 'Spanish')
✅ Add emoji/flag icon for visual appeal
✅ Translate ALL keys - don't skip any
✅ Keep key names in English (they're identifiers)
✅ Use consistent terminology across translations
✅ Test in RTL languages (Arabic, Hebrew) if adding them
✅ Keep translations concise for mobile screens
✅ Use native numerals and date formats when possible
`;

export default BEST_PRACTICES;
