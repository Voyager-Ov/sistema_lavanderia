import { create } from 'zustand';

export type ConfigTab = 'business' | 'notifications' | 'hardware' | 'appearance' | 'payments' | 'arca';

export interface BusinessConfig {
  razonSocial: string | null;
  cuit: string | null;
  direccion: string | null;
  telefonoContacto: string | null;
  simboloMoneda: string;
}


export interface NotificationsConfig {
  whatsappEnabled: boolean;
  whatsappTemplate: string;
  whatsappMensajeManual: string;
  emailEnabled: boolean;
}

export interface HardwareConfig {
  imprimirTicketAutomatico: boolean;
  mensajeTicket: string;
  showQr: boolean;
}

export interface AppearanceConfig {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
}

export type PaymentType = 'cash' | 'card' | 'transfer' | 'digital_wallet';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentType;
  enabled: boolean;
  alias?: string;
  cbu?: string;
}

export interface PaymentsConfig {
  methods: PaymentMethod[];
}

export interface CashRegisterConfig {
  autoCloseEnabled: boolean;
  autoCloseTime: string;
}

export interface ArcaConfig {
  afipActivo: boolean;
  afipModoFacturacion: 'AUTOMATICO' | 'MANUAL' | 'DESACTIVADO';
  afipPuntoVenta: number | null;
  afipCertificado?: string | null;
}

interface ConfigState {
  activeTab: ConfigTab;
  setActiveTab: (tab: ConfigTab) => void;
  
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  pendingTabChange: ConfigTab | null;
  setPendingTabChange: (tab: ConfigTab | null) => void;
  
  businessConfig: BusinessConfig;
  setBusinessConfig: (config: BusinessConfig) => void;

  notificationsConfig: NotificationsConfig;
  setNotificationsConfig: (config: NotificationsConfig) => void;

  hardwareConfig: HardwareConfig;
  setHardwareConfig: (config: HardwareConfig) => void;

  appearanceConfig: AppearanceConfig;
  setAppearanceConfig: (config: AppearanceConfig) => void;

  paymentsConfig: PaymentsConfig;
  setPaymentsConfig: (config: PaymentsConfig) => void;

  arcaConfig: ArcaConfig;
  setArcaConfig: (config: ArcaConfig) => void;

  setAllConfig: (data: any) => void;

  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  activeTab: 'business',
  setActiveTab: (tab) => set({ activeTab: tab, isDirty: false }),

  isDirty: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  
  pendingTabChange: null,
  setPendingTabChange: (tab) => set({ pendingTabChange: tab }),

  isLoaded: false,
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),

  businessConfig: {
    razonSocial: '',
    cuit: '',
    direccion: '',
    telefonoContacto: '',
    simboloMoneda: '$',
  },
  setBusinessConfig: (config) => set({ businessConfig: config }),

  notificationsConfig: {
    whatsappEnabled: false,
    whatsappTemplate: '',
    whatsappMensajeManual: '',
    emailEnabled: false,
  },
  setNotificationsConfig: (config) => set({ notificationsConfig: config }),

  hardwareConfig: {
    imprimirTicketAutomatico: false,
    mensajeTicket: '',
    showQr: true,
  },
  setHardwareConfig: (config) => set({ hardwareConfig: config }),

  appearanceConfig: {
    theme: 'light',
    primaryColor: '#4285F4',
  },
  setAppearanceConfig: (config) => set({ appearanceConfig: config }),

  paymentsConfig: {
    methods: [
      { id: '1', name: 'Efectivo', type: 'cash', enabled: true },
      { id: '2', name: 'Débito / Crédito', type: 'card', enabled: true },
      { id: '3', name: 'Transferencia', type: 'transfer', enabled: true, alias: 'burbujas.mp', cbu: '0000000000000000000000' },
    ],
  },
  setPaymentsConfig: (config) => set({ paymentsConfig: config }),

  arcaConfig: {
    afipActivo: false,
    afipModoFacturacion: 'AUTOMATICO',
    afipPuntoVenta: null,
  },
  setArcaConfig: (config) => set({ arcaConfig: config }),

  setAllConfig: (data: any) => set((state) => ({
    businessConfig: {
      ...state.businessConfig,
      razonSocial: data.razonSocial ?? state.businessConfig.razonSocial,
      cuit: data.cuit ?? state.businessConfig.cuit,
      direccion: data.direccion ?? state.businessConfig.direccion,
      telefonoContacto: data.telefonoContacto ?? state.businessConfig.telefonoContacto,
      simboloMoneda: data.simboloMoneda ?? state.businessConfig.simboloMoneda,
    },
    hardwareConfig: {
      ...state.hardwareConfig,
      imprimirTicketAutomatico: data.imprimirTicketAutomatico ?? state.hardwareConfig.imprimirTicketAutomatico,
      mensajeTicket: data.mensajeTicket ?? state.hardwareConfig.mensajeTicket,
      showQr: data.mostrarQrTicket ?? state.hardwareConfig.showQr,
    },
    arcaConfig: {
      ...state.arcaConfig,
      afipActivo: data.afipActivo ?? state.arcaConfig.afipActivo,
      afipModoFacturacion: data.afipModoFacturacion ?? state.arcaConfig.afipModoFacturacion,
      afipPuntoVenta: data.afipPuntoVenta ?? state.arcaConfig.afipPuntoVenta,
      afipCertificado: data.afipCertificado ?? state.arcaConfig.afipCertificado,
    },
    notificationsConfig: {
      ...state.notificationsConfig,
      whatsappEnabled: data.whatsappActivo ?? state.notificationsConfig.whatsappEnabled,
      whatsappTemplate: data.whatsappMensajeListo ?? state.notificationsConfig.whatsappTemplate,
      whatsappMensajeManual: data.whatsappMensajeManual ?? state.notificationsConfig.whatsappMensajeManual,
    }
  })),
}));
