export type Language = "en" | "tr" | "de" | "es" | "fr";

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
];

export const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: "Dashboard",
      finance: "Finance",
      settings: "Settings",
      adminPanel: "Admin Panel",
      profile: "Profile",
      signOut: "Sign Out",
      signIn: "Sign In",
      getStarted: "Get Started",
      account: "Account",
    },
    // Dashboard
    dashboard: {
      title: "Your Subscriptions",
      subtitle: "Manage and track all your recurring payments",
      totalSubscriptions: "Total Subscriptions",
      monthlyCost: "Monthly Cost",
      yearlyCost: "Yearly Cost",
      addSubscription: "Add Subscription",
      addFirstSubscription: "Add Your First Subscription",
      noSubscriptions: "No subscriptions yet",
      noSubscriptionsDesc: "Add your first subscription to start tracking your recurring payments.",
      trialLimit: "Free trial limit reached",
      getLifetime: "Upgrade to Pro",
      auto: "Auto",
    },
    // Finance
    finance: {
      title: "Finance Dashboard",
      subtitle: "Track your income, expenses, and spending habits",
      income: "Income",
      expenses: "Expenses",
      subscriptions: "Subscriptions",
      balance: "Balance",
      addTransaction: "Add Transaction",
      addBudget: "Add Budget",
      transactions: "Recent Transactions",
      budgets: "Budgets",
      cashFlow: "Cash Flow",
      spendingByCategory: "Spending by Category",
      noTransactions: "No transactions yet",
      noBudgets: "No budgets set",
    },
    // Settings
    settings: {
      title: "Settings",
      subtitle: "Manage your preferences and account settings",
      general: "General",
      notifications: "Notifications",
      dangerZone: "Danger Zone",
      language: "Language",
      languageDesc: "Choose your preferred language",
      currency: "Default Currency",
      currencyDesc: "Set your default display currency",
      theme: "Theme",
      themeDesc: "Choose between light and dark mode",
      lightMode: "Light",
      darkMode: "Dark",
      systemMode: "System",
      emailAlerts: "Email Alerts",
      emailAlertsDesc: "Receive email notifications for important updates",
      monthlyReport: "Monthly Report",
      monthlyReportDesc: "Get a monthly summary of your subscriptions",
      billReminders: "Bill Reminders",
      billRemindersDesc: "Receive reminders before subscription renewals",
      deleteAccount: "Delete Account",
      deleteAccountDesc: "Permanently delete your account and all data",
      deleteConfirm: "Are you sure? This action cannot be undone.",
      delete: "Delete",
      cancel: "Cancel",
    },
    // Upgrade Page
    upgrade: {
      title: "Upgrade to Pro",
      subtitle: "Unlock all premium features with a one-time payment. No subscriptions, no recurring fees.",
      lifetimeAccess: "Lifetime Access",
      oneTimePayment: "One-time payment • Forever yours",
      features: {
        unlimited: "Unlimited subscriptions",
        advanced: "Advanced analytics & insights",
        support: "Priority customer support",
        updates: "All future updates included",
        currencies: "All currencies supported",
        export: "Export & data backup",
      },
      ctaButton: "Pay Securely with Stripe",
      securePayment: "Secure Payment",
      moneyBack: "30-day money-back guarantee",
      backToDashboard: "Back to Dashboard",
      alreadyPro: "You already have Pro access!",
      enjoyFeatures: "Enjoy all premium features without any limitations.",
    },
    // Payment Success
    paymentSuccess: {
      title: "Payment Successful! 🎉",
      subtitle: "Thank you for your purchase!",
      message: "Your Pro features will be activated shortly. You now have unlimited access to all premium features.",
      status: "Lifetime Pro Access Activated",
      cta: "Go to Dashboard",
    },
    // Payment Cancel
    paymentCancel: {
      title: "Payment Cancelled",
      message: "Your payment was not completed. No charges were made to your account.",
      whyTitle: "Why upgrade to Pro?",
      reason1: "Unlimited subscription tracking",
      reason2: "Advanced analytics and insights",
      reason3: "Priority support",
      reason4: "One-time payment, lifetime access",
      tryAgain: "Try Again",
      backToDashboard: "Back to Dashboard",
    },
    // Common
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
    },
    // Subscription card
    subscription: {
      nextPayment: "Next payment",
      daysLeft: "days left",
      today: "Today",
      manage: "Manage",
      perMonth: "per month",
      perYear: "per year",
    },
  },
  tr: {
    nav: {
      dashboard: "Panel",
      finance: "Finans",
      settings: "Ayarlar",
      adminPanel: "Admin Paneli",
      profile: "Profil",
      signOut: "Çıkış Yap",
      signIn: "Giriş Yap",
      getStarted: "Başla",
      account: "Hesap",
    },
    dashboard: {
      title: "Abonelikleriniz",
      subtitle: "Tüm düzenli ödemelerinizi yönetin ve takip edin",
      totalSubscriptions: "Toplam Abonelik",
      monthlyCost: "Aylık Maliyet",
      yearlyCost: "Yıllık Maliyet",
      addSubscription: "Abonelik Ekle",
      addFirstSubscription: "İlk Aboneliğinizi Ekleyin",
      noSubscriptions: "Henüz abonelik yok",
      noSubscriptionsDesc: "Düzenli ödemelerinizi takip etmeye başlamak için ilk aboneliğinizi ekleyin.",
      trialLimit: "Ücretsiz deneme limiti doldu",
      getLifetime: "Pro'ya Geç",
      auto: "Otomatik",
    },
    finance: {
      title: "Finans Paneli",
      subtitle: "Gelir, gider ve harcama alışkanlıklarınızı takip edin",
      income: "Gelir",
      expenses: "Giderler",
      subscriptions: "Abonelikler",
      balance: "Bakiye",
      addTransaction: "İşlem Ekle",
      addBudget: "Bütçe Ekle",
      transactions: "Son İşlemler",
      budgets: "Bütçeler",
      cashFlow: "Nakit Akışı",
      spendingByCategory: "Kategoriye Göre Harcama",
      noTransactions: "Henüz işlem yok",
      noBudgets: "Bütçe belirlenmedi",
    },
    settings: {
      title: "Ayarlar",
      subtitle: "Tercihlerinizi ve hesap ayarlarınızı yönetin",
      general: "Genel",
      notifications: "Bildirimler",
      dangerZone: "Tehlikeli Bölge",
      language: "Dil",
      languageDesc: "Tercih ettiğiniz dili seçin",
      currency: "Varsayılan Para Birimi",
      currencyDesc: "Varsayılan görüntüleme para birimini ayarlayın",
      theme: "Tema",
      themeDesc: "Açık ve koyu mod arasında seçim yapın",
      lightMode: "Açık",
      darkMode: "Koyu",
      systemMode: "Sistem",
      emailAlerts: "E-posta Uyarıları",
      emailAlertsDesc: "Önemli güncellemeler için e-posta bildirimleri alın",
      monthlyReport: "Aylık Rapor",
      monthlyReportDesc: "Aboneliklerinizin aylık özetini alın",
      billReminders: "Fatura Hatırlatıcıları",
      billRemindersDesc: "Abonelik yenilemeleri öncesinde hatırlatıcılar alın",
      deleteAccount: "Hesabı Sil",
      deleteAccountDesc: "Hesabınızı ve tüm verilerinizi kalıcı olarak silin",
      deleteConfirm: "Emin misiniz? Bu işlem geri alınamaz.",
      delete: "Sil",
      cancel: "İptal",
    },
    upgrade: {
      title: "Pro'ya Geç",
      subtitle: "Tek seferlik ödeme ile tüm premium özelliklerin kilidini açın. Abonelik yok, tekrarlayan ücret yok.",
      lifetimeAccess: "Ömür Boyu Erişim",
      oneTimePayment: "Tek seferlik ödeme • Sonsuza kadar sizin",
      features: {
        unlimited: "Sınırsız abonelik",
        advanced: "Gelişmiş analitik ve içgörüler",
        support: "Öncelikli müşteri desteği",
        updates: "Tüm gelecek güncellemeler dahil",
        currencies: "Tüm para birimleri desteklenir",
        export: "Dışa aktarma ve veri yedekleme",
      },
      ctaButton: "Stripe ile Güvenli Ödeme",
      securePayment: "Güvenli Ödeme",
      moneyBack: "30 gün para iade garantisi",
      backToDashboard: "Panele Dön",
      alreadyPro: "Zaten Pro erişiminiz var!",
      enjoyFeatures: "Tüm premium özelliklerden sınırsız yararlanın.",
    },
    paymentSuccess: {
      title: "Ödeme Başarılı! 🎉",
      subtitle: "Satın aldığınız için teşekkürler!",
      message: "Pro özellikleriniz kısa süre içinde aktif edilecek. Artık tüm premium özelliklere sınırsız erişiminiz var.",
      status: "Ömür Boyu Pro Erişim Aktif",
      cta: "Panele Git",
    },
    paymentCancel: {
      title: "Ödeme İptal Edildi",
      message: "Ödemeniz tamamlanmadı. Hesabınızdan herhangi bir ücret alınmadı.",
      whyTitle: "Neden Pro'ya geçmelisiniz?",
      reason1: "Sınırsız abonelik takibi",
      reason2: "Gelişmiş analitik ve içgörüler",
      reason3: "Öncelikli destek",
      reason4: "Tek seferlik ödeme, ömür boyu erişim",
      tryAgain: "Tekrar Dene",
      backToDashboard: "Panele Dön",
    },
    common: {
      save: "Kaydet",
      cancel: "İptal",
      delete: "Sil",
      edit: "Düzenle",
      loading: "Yükleniyor...",
      error: "Hata",
      success: "Başarılı",
      confirm: "Onayla",
    },
    subscription: {
      nextPayment: "Sonraki ödeme",
      daysLeft: "gün kaldı",
      today: "Bugün",
      manage: "Yönet",
      perMonth: "aylık",
      perYear: "yıllık",
    },
  },
  de: {
    nav: {
      dashboard: "Dashboard",
      finance: "Finanzen",
      settings: "Einstellungen",
      adminPanel: "Admin-Panel",
      profile: "Profil",
      signOut: "Abmelden",
      signIn: "Anmelden",
      getStarted: "Loslegen",
      account: "Konto",
    },
    dashboard: {
      title: "Ihre Abonnements",
      subtitle: "Verwalten und verfolgen Sie alle Ihre wiederkehrenden Zahlungen",
      totalSubscriptions: "Gesamtabonnements",
      monthlyCost: "Monatliche Kosten",
      yearlyCost: "Jährliche Kosten",
      addSubscription: "Abonnement hinzufügen",
      addFirstSubscription: "Erstes Abonnement hinzufügen",
      noSubscriptions: "Noch keine Abonnements",
      noSubscriptionsDesc: "Fügen Sie Ihr erstes Abonnement hinzu, um Ihre wiederkehrenden Zahlungen zu verfolgen.",
      trialLimit: "Testlimit erreicht",
      getLifetime: "Upgrade auf Pro",
      auto: "Auto",
    },
    finance: {
      title: "Finanz-Dashboard",
      subtitle: "Verfolgen Sie Ihre Einnahmen, Ausgaben und Ausgabegewohnheiten",
      income: "Einnahmen",
      expenses: "Ausgaben",
      subscriptions: "Abonnements",
      balance: "Saldo",
      addTransaction: "Transaktion hinzufügen",
      addBudget: "Budget hinzufügen",
      transactions: "Letzte Transaktionen",
      budgets: "Budgets",
      cashFlow: "Cashflow",
      spendingByCategory: "Ausgaben nach Kategorie",
      noTransactions: "Noch keine Transaktionen",
      noBudgets: "Keine Budgets festgelegt",
    },
    settings: {
      title: "Einstellungen",
      subtitle: "Verwalten Sie Ihre Präferenzen und Kontoeinstellungen",
      general: "Allgemein",
      notifications: "Benachrichtigungen",
      dangerZone: "Gefahrenzone",
      language: "Sprache",
      languageDesc: "Wählen Sie Ihre bevorzugte Sprache",
      currency: "Standardwährung",
      currencyDesc: "Legen Sie Ihre Standardanzeigewährung fest",
      theme: "Design",
      themeDesc: "Wählen Sie zwischen hellem und dunklem Modus",
      lightMode: "Hell",
      darkMode: "Dunkel",
      systemMode: "System",
      emailAlerts: "E-Mail-Benachrichtigungen",
      emailAlertsDesc: "Erhalten Sie E-Mail-Benachrichtigungen für wichtige Updates",
      monthlyReport: "Monatlicher Bericht",
      monthlyReportDesc: "Erhalten Sie eine monatliche Zusammenfassung Ihrer Abonnements",
      billReminders: "Rechnungserinnerungen",
      billRemindersDesc: "Erhalten Sie Erinnerungen vor Abonnementverlängerungen",
      deleteAccount: "Konto löschen",
      deleteAccountDesc: "Löschen Sie Ihr Konto und alle Daten dauerhaft",
      deleteConfirm: "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden.",
      delete: "Löschen",
      cancel: "Abbrechen",
    },
    upgrade: {
      title: "Auf Pro upgraden",
      subtitle: "Schalten Sie alle Premium-Funktionen mit einer einmaligen Zahlung frei. Keine Abonnements, keine wiederkehrenden Gebühren.",
      lifetimeAccess: "Lebenslanger Zugang",
      oneTimePayment: "Einmalige Zahlung • Für immer Ihres",
      features: {
        unlimited: "Unbegrenzte Abonnements",
        advanced: "Erweiterte Analysen & Einblicke",
        support: "Prioritäts-Kundensupport",
        updates: "Alle zukünftigen Updates inklusive",
        currencies: "Alle Währungen unterstützt",
        export: "Export & Datensicherung",
      },
      ctaButton: "Sicher mit Stripe bezahlen",
      securePayment: "Sichere Zahlung",
      moneyBack: "30-Tage-Geld-zurück-Garantie",
      backToDashboard: "Zurück zum Dashboard",
      alreadyPro: "Sie haben bereits Pro-Zugang!",
      enjoyFeatures: "Genießen Sie alle Premium-Funktionen ohne Einschränkungen.",
    },
    paymentSuccess: {
      title: "Zahlung erfolgreich! 🎉",
      subtitle: "Vielen Dank für Ihren Kauf!",
      message: "Ihre Pro-Funktionen werden in Kürze aktiviert. Sie haben jetzt unbegrenzten Zugang zu allen Premium-Funktionen.",
      status: "Lebenslanger Pro-Zugang aktiviert",
      cta: "Zum Dashboard",
    },
    paymentCancel: {
      title: "Zahlung abgebrochen",
      message: "Ihre Zahlung wurde nicht abgeschlossen. Ihrem Konto wurden keine Gebühren berechnet.",
      whyTitle: "Warum auf Pro upgraden?",
      reason1: "Unbegrenzte Abonnementverfolgung",
      reason2: "Erweiterte Analysen und Einblicke",
      reason3: "Prioritäts-Support",
      reason4: "Einmalige Zahlung, lebenslanger Zugang",
      tryAgain: "Erneut versuchen",
      backToDashboard: "Zurück zum Dashboard",
    },
    common: {
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      edit: "Bearbeiten",
      loading: "Laden...",
      error: "Fehler",
      success: "Erfolg",
      confirm: "Bestätigen",
    },
    subscription: {
      nextPayment: "Nächste Zahlung",
      daysLeft: "Tage übrig",
      today: "Heute",
      manage: "Verwalten",
      perMonth: "pro Monat",
      perYear: "pro Jahr",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      finance: "Finanzas",
      settings: "Configuración",
      adminPanel: "Panel de Admin",
      profile: "Perfil",
      signOut: "Cerrar Sesión",
      signIn: "Iniciar Sesión",
      getStarted: "Comenzar",
      account: "Cuenta",
    },
    dashboard: {
      title: "Tus Suscripciones",
      subtitle: "Administra y rastrea todos tus pagos recurrentes",
      totalSubscriptions: "Total de Suscripciones",
      monthlyCost: "Costo Mensual",
      yearlyCost: "Costo Anual",
      addSubscription: "Agregar Suscripción",
      addFirstSubscription: "Agrega Tu Primera Suscripción",
      noSubscriptions: "Aún no hay suscripciones",
      noSubscriptionsDesc: "Agrega tu primera suscripción para comenzar a rastrear tus pagos recurrentes.",
      trialLimit: "Límite de prueba alcanzado",
      getLifetime: "Actualizar a Pro",
      auto: "Auto",
    },
    finance: {
      title: "Panel de Finanzas",
      subtitle: "Rastrea tus ingresos, gastos y hábitos de gasto",
      income: "Ingresos",
      expenses: "Gastos",
      subscriptions: "Suscripciones",
      balance: "Balance",
      addTransaction: "Agregar Transacción",
      addBudget: "Agregar Presupuesto",
      transactions: "Transacciones Recientes",
      budgets: "Presupuestos",
      cashFlow: "Flujo de Caja",
      spendingByCategory: "Gastos por Categoría",
      noTransactions: "Aún no hay transacciones",
      noBudgets: "Sin presupuestos establecidos",
    },
    settings: {
      title: "Configuración",
      subtitle: "Administra tus preferencias y configuración de cuenta",
      general: "General",
      notifications: "Notificaciones",
      dangerZone: "Zona de Peligro",
      language: "Idioma",
      languageDesc: "Elige tu idioma preferido",
      currency: "Moneda Predeterminada",
      currencyDesc: "Establece tu moneda de visualización predeterminada",
      theme: "Tema",
      themeDesc: "Elige entre modo claro y oscuro",
      lightMode: "Claro",
      darkMode: "Oscuro",
      systemMode: "Sistema",
      emailAlerts: "Alertas por Email",
      emailAlertsDesc: "Recibe notificaciones por email para actualizaciones importantes",
      monthlyReport: "Reporte Mensual",
      monthlyReportDesc: "Recibe un resumen mensual de tus suscripciones",
      billReminders: "Recordatorios de Facturas",
      billRemindersDesc: "Recibe recordatorios antes de las renovaciones de suscripción",
      deleteAccount: "Eliminar Cuenta",
      deleteAccountDesc: "Elimina permanentemente tu cuenta y todos los datos",
      deleteConfirm: "¿Estás seguro? Esta acción no se puede deshacer.",
      delete: "Eliminar",
      cancel: "Cancelar",
    },
    upgrade: {
      title: "Actualizar a Pro",
      subtitle: "Desbloquea todas las funciones premium con un pago único. Sin suscripciones, sin cargos recurrentes.",
      lifetimeAccess: "Acceso de por Vida",
      oneTimePayment: "Pago único • Para siempre tuyo",
      features: {
        unlimited: "Suscripciones ilimitadas",
        advanced: "Análisis e información avanzada",
        support: "Soporte prioritario al cliente",
        updates: "Todas las actualizaciones futuras incluidas",
        currencies: "Todas las monedas soportadas",
        export: "Exportación y respaldo de datos",
      },
      ctaButton: "Pago Seguro",
      securePayment: "Pago Seguro",
      moneyBack: "Garantía de devolución de 30 días",
      backToDashboard: "Volver al Panel",
      alreadyPro: "¡Ya tienes acceso Pro!",
      enjoyFeatures: "Disfruta de todas las funciones premium sin limitaciones.",
    },
    paymentSuccess: {
      title: "¡Pago Exitoso! 🎉",
      subtitle: "¡Gracias por tu compra!",
      message: "Tus funciones Pro se activarán en breve. Ahora tienes acceso ilimitado a todas las funciones premium.",
      status: "Acceso Pro de por Vida Activado",
      cta: "Ir al Panel",
    },
    paymentCancel: {
      title: "Pago Cancelado",
      message: "Tu pago no se completó. No se realizaron cargos a tu cuenta.",
      whyTitle: "¿Por qué actualizar a Pro?",
      reason1: "Seguimiento ilimitado de suscripciones",
      reason2: "Análisis e información avanzada",
      reason3: "Soporte prioritario",
      reason4: "Pago único, acceso de por vida",
      tryAgain: "Intentar de Nuevo",
      backToDashboard: "Volver al Panel",
    },
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      confirm: "Confirmar",
    },
    subscription: {
      nextPayment: "Próximo pago",
      daysLeft: "días restantes",
      today: "Hoy",
      manage: "Administrar",
      perMonth: "por mes",
      perYear: "por año",
    },
  },
  fr: {
    nav: {
      dashboard: "Tableau de bord",
      finance: "Finances",
      settings: "Paramètres",
      adminPanel: "Panneau Admin",
      profile: "Profil",
      signOut: "Déconnexion",
      signIn: "Connexion",
      getStarted: "Commencer",
      account: "Compte",
    },
    dashboard: {
      title: "Vos Abonnements",
      subtitle: "Gérez et suivez tous vos paiements récurrents",
      totalSubscriptions: "Total des Abonnements",
      monthlyCost: "Coût Mensuel",
      yearlyCost: "Coût Annuel",
      addSubscription: "Ajouter un Abonnement",
      addFirstSubscription: "Ajoutez Votre Premier Abonnement",
      noSubscriptions: "Pas encore d'abonnements",
      noSubscriptionsDesc: "Ajoutez votre premier abonnement pour commencer à suivre vos paiements récurrents.",
      trialLimit: "Limite d'essai atteinte",
      getLifetime: "Passer à Pro",
      auto: "Auto",
    },
    finance: {
      title: "Tableau de Bord Financier",
      subtitle: "Suivez vos revenus, dépenses et habitudes de consommation",
      income: "Revenus",
      expenses: "Dépenses",
      subscriptions: "Abonnements",
      balance: "Solde",
      addTransaction: "Ajouter une Transaction",
      addBudget: "Ajouter un Budget",
      transactions: "Transactions Récentes",
      budgets: "Budgets",
      cashFlow: "Flux de Trésorerie",
      spendingByCategory: "Dépenses par Catégorie",
      noTransactions: "Pas encore de transactions",
      noBudgets: "Aucun budget défini",
    },
    settings: {
      title: "Paramètres",
      subtitle: "Gérez vos préférences et paramètres de compte",
      general: "Général",
      notifications: "Notifications",
      dangerZone: "Zone de Danger",
      language: "Langue",
      languageDesc: "Choisissez votre langue préférée",
      currency: "Devise par Défaut",
      currencyDesc: "Définissez votre devise d'affichage par défaut",
      theme: "Thème",
      themeDesc: "Choisissez entre le mode clair et sombre",
      lightMode: "Clair",
      darkMode: "Sombre",
      systemMode: "Système",
      emailAlerts: "Alertes Email",
      emailAlertsDesc: "Recevez des notifications par email pour les mises à jour importantes",
      monthlyReport: "Rapport Mensuel",
      monthlyReportDesc: "Recevez un résumé mensuel de vos abonnements",
      billReminders: "Rappels de Factures",
      billRemindersDesc: "Recevez des rappels avant les renouvellements d'abonnement",
      deleteAccount: "Supprimer le Compte",
      deleteAccountDesc: "Supprimez définitivement votre compte et toutes les données",
      deleteConfirm: "Êtes-vous sûr? Cette action est irréversible.",
      delete: "Supprimer",
      cancel: "Annuler",
    },
    upgrade: {
      title: "Passer à Pro",
      subtitle: "Débloquez toutes les fonctionnalités premium avec un paiement unique. Pas d'abonnements, pas de frais récurrents.",
      lifetimeAccess: "Accès à Vie",
      oneTimePayment: "Paiement unique • À vous pour toujours",
      features: {
        unlimited: "Abonnements illimités",
        advanced: "Analyses et insights avancés",
        support: "Support client prioritaire",
        updates: "Toutes les futures mises à jour incluses",
        currencies: "Toutes les devises supportées",
        export: "Export et sauvegarde des données",
      },
      ctaButton: "Payer en toute sécurité avec Stripe",
      securePayment: "Paiement Sécurisé",
      moneyBack: "Garantie de remboursement de 30 jours",
      backToDashboard: "Retour au Tableau de bord",
      alreadyPro: "Vous avez déjà l'accès Pro!",
      enjoyFeatures: "Profitez de toutes les fonctionnalités premium sans limitations.",
    },
    paymentSuccess: {
      title: "Paiement Réussi! 🎉",
      subtitle: "Merci pour votre achat!",
      message: "Vos fonctionnalités Pro seront activées sous peu. Vous avez maintenant un accès illimité à toutes les fonctionnalités premium.",
      status: "Accès Pro à Vie Activé",
      cta: "Aller au Tableau de bord",
    },
    paymentCancel: {
      title: "Paiement Annulé",
      message: "Votre paiement n'a pas été effectué. Aucun frais n'a été facturé à votre compte.",
      whyTitle: "Pourquoi passer à Pro?",
      reason1: "Suivi illimité des abonnements",
      reason2: "Analyses et insights avancés",
      reason3: "Support prioritaire",
      reason4: "Paiement unique, accès à vie",
      tryAgain: "Réessayer",
      backToDashboard: "Retour au Tableau de bord",
    },
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      confirm: "Confirmer",
    },
    subscription: {
      nextPayment: "Prochain paiement",
      daysLeft: "jours restants",
      today: "Aujourd'hui",
      manage: "Gérer",
      perMonth: "par mois",
      perYear: "par an",
    },
  },
} as const;

// Use a more flexible type for translations
export type Translations = {
  nav: {
    dashboard: string;
    finance: string;
    settings: string;
    adminPanel: string;
    profile: string;
    signOut: string;
    signIn: string;
    getStarted: string;
    account: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalSubscriptions: string;
    monthlyCost: string;
    yearlyCost: string;
    addSubscription: string;
    addFirstSubscription: string;
    noSubscriptions: string;
    noSubscriptionsDesc: string;
    trialLimit: string;
    getLifetime: string;
    auto: string;
  };
  finance: {
    title: string;
    subtitle: string;
    income: string;
    expenses: string;
    subscriptions: string;
    balance: string;
    addTransaction: string;
    addBudget: string;
    transactions: string;
    budgets: string;
    cashFlow: string;
    spendingByCategory: string;
    noTransactions: string;
    noBudgets: string;
  };
  settings: {
    title: string;
    subtitle: string;
    general: string;
    notifications: string;
    dangerZone: string;
    language: string;
    languageDesc: string;
    currency: string;
    currencyDesc: string;
    theme: string;
    themeDesc: string;
    lightMode: string;
    darkMode: string;
    systemMode: string;
    emailAlerts: string;
    emailAlertsDesc: string;
    monthlyReport: string;
    monthlyReportDesc: string;
    billReminders: string;
    billRemindersDesc: string;
    deleteAccount: string;
    deleteAccountDesc: string;
    deleteConfirm: string;
    delete: string;
    cancel: string;
  };
  upgrade: {
    title: string;
    subtitle: string;
    lifetimeAccess: string;
    oneTimePayment: string;
    features: {
      unlimited: string;
      advanced: string;
      support: string;
      updates: string;
      currencies: string;
      export: string;
    };
    ctaButton: string;
    securePayment: string;
    moneyBack: string;
    backToDashboard: string;
    alreadyPro: string;
    enjoyFeatures: string;
  };
  paymentSuccess: {
    title: string;
    subtitle: string;
    message: string;
    status: string;
    cta: string;
  };
  paymentCancel: {
    title: string;
    message: string;
    whyTitle: string;
    reason1: string;
    reason2: string;
    reason3: string;
    reason4: string;
    tryAgain: string;
    backToDashboard: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
  };
  subscription: {
    nextPayment: string;
    daysLeft: string;
    today: string;
    manage: string;
    perMonth: string;
    perYear: string;
  };
};
