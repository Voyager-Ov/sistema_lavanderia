import { generateRandomEmail, generateRandomPhone, uniqueId } from './test-data';

export interface SeedBusinessData {
  negocioNombre: string;
  usuarioNombre: string;
  email: string;
  password: string;
  telefono: string;
}

export interface SeedCategory {
  nombre: string;
  descripcion: string;
  icono?: string;
  color?: string;
}

export interface SeedService {
  nombre: string;
  categoriaNombre: string;
  precio: number;
  tiempoEstimadoMinutos: number;
  unidadMedida: string;
  descripcion: string;
}

export interface SeedEmployee {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'EMPLEADO';
  telefono: string;
}

export interface SeedClient {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  notas?: string;
}

export interface SeedOrderItem {
  serviceName: string;
  qty: number;
  expectedPrice: number;
}

export interface SeedOrderDef {
  idAlias: string;
  clientIndex: number; // Index in seed clients array
  items: SeedOrderItem[];
  expectedTotal: number;
  targetStatus: 'PENDIENTE' | 'EN_LAVADO' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  shouldPay: boolean;
  paymentConfig?: {
    method: 'EFECTIVO' | 'TRANSFERENCIA';
    amountPaid: number;
    leaveCredit?: boolean;
    applyCredit?: boolean;
  };
  accountingImpact: 'COBRADO' | 'DEUDA_EXIGIBLE' | 'MONTO_EN_TALLER' | 'NINGUNO';
}

export function generateSeedBusiness(): SeedBusinessData {
  const ts = Date.now().toString(36);
  return {
    negocioNombre: `Lavanderia Express E2E ${ts}`,
    usuarioNombre: `Gonzalo Admin ${ts}`,
    email: `admin_${ts}@lavanderiaexpress.com`,
    password: 'Password123!',
    telefono: '1133445566'
  };
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { nombre: 'Lavado Diario', descripcion: 'Servicios de lavandería común por kilo y prenda', icono: 'WashingMachine', color: '#3B82F6' },
  { nombre: 'Planchado Premium', descripcion: 'Servicio profesional de planchado de camisas y trajes', icono: 'Shirt', color: '#10B981' },
  { nombre: 'Tintorería Fina', descripcion: 'Tratamiento delicado de abrigos, vestidos y prendas de cuero', icono: 'Sparkles', color: '#8B5CF6' },
  { nombre: 'Artículos de Hogar', descripcion: 'Lavado y secado de edredones, frazadas, sábanas y cortinas', icono: 'Home', color: '#F59E0B' }
];

export const SEED_SERVICES: SeedService[] = [
  { nombre: 'Lavado por Kilo (Hasta 5kg)', categoriaNombre: 'Lavado Diario', precio: 3500, tiempoEstimadoMinutos: 180, unidadMedida: 'kilo', descripcion: 'Lavado y secado estándar de prendas diarias' },
  { nombre: 'Lavado por Kilo Adicional', categoriaNombre: 'Lavado Diario', precio: 800, tiempoEstimadoMinutos: 30, unidadMedida: 'kilo', descripcion: 'Kilo excedente de ropa diaria' },
  { nombre: 'Lavado de Camisas (x5)', categoriaNombre: 'Lavado Diario', precio: 4200, tiempoEstimadoMinutos: 120, unidadMedida: 'pack', descripcion: 'Lavado delicado de 5 camisas' },
  { nombre: 'Planchado de Camisa', categoriaNombre: 'Planchado Premium', precio: 1200, tiempoEstimadoMinutos: 20, unidadMedida: 'unidad', descripcion: 'Planchado a vapor y colgado en percha' },
  { nombre: 'Planchado Traje Completo', categoriaNombre: 'Planchado Premium', precio: 3200, tiempoEstimadoMinutos: 45, unidadMedida: 'unidad', descripcion: 'Planchado de saco y pantalón de vestir' },
  { nombre: 'Planchado de Pantalón', categoriaNombre: 'Planchado Premium', precio: 1000, tiempoEstimadoMinutos: 15, unidadMedida: 'unidad', descripcion: 'Planchado con raya marcada' },
  { nombre: 'Tintorería Tapado / Abrigo', categoriaNombre: 'Tintorería Fina', precio: 7500, tiempoEstimadoMinutos: 1440, unidadMedida: 'unidad', descripcion: 'Limpieza a seco de abrigos de lana o paño' },
  { nombre: 'Tintorería Vestido Fiesta', categoriaNombre: 'Tintorería Fina', precio: 9500, tiempoEstimadoMinutos: 1440, unidadMedida: 'unidad', descripcion: 'Tratamiento especial de pedrería y telas delicadas' },
  { nombre: 'Tintorería Campera Cuero', categoriaNombre: 'Tintorería Fina', precio: 12000, tiempoEstimadoMinutos: 2880, unidadMedida: 'unidad', descripcion: 'Limpieza y nutrición de cuero sintético o vacuno' },
  { nombre: 'Lavado Edredón 2 Plazas', categoriaNombre: 'Artículos de Hogar', precio: 8500, tiempoEstimadoMinutos: 360, unidadMedida: 'unidad', descripcion: 'Lavado profundo y secado a temperatura controlada' },
  { nombre: 'Lavado Frazada / Manta', categoriaNombre: 'Artículos de Hogar', precio: 6200, tiempoEstimadoMinutos: 240, unidadMedida: 'unidad', descripcion: 'Lavado con suavizante premium anti-alérgico' },
  { nombre: 'Lavado Cortinas por Paño', categoriaNombre: 'Artículos de Hogar', precio: 4800, tiempoEstimadoMinutos: 360, unidadMedida: 'unidad', descripcion: 'Desmanchado y lavado delicado de cortinas' }
];

export function generateSeedEmployees(): SeedEmployee[] {
  const ts = uniqueId('emp');
  return [
    { nombre: 'Carlos Cajero', email: `cajero_${ts}@lavanderiaexpress.com`, password: 'Password123!', rol: 'EMPLEADO', telefono: generateRandomPhone() },
    { nombre: 'Marta Taller', email: `taller_${ts}@lavanderiaexpress.com`, password: 'Password123!', rol: 'EMPLEADO', telefono: generateRandomPhone() },
    { nombre: 'Roberto Encargado', email: `encargado_${ts}@lavanderiaexpress.com`, password: 'Password123!', rol: 'ADMIN', telefono: generateRandomPhone() }
  ];
}

export function generateSeedClients(count = 15): SeedClient[] {
  const nombres = ['Juan', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Sofia', 'Gonzalo', 'Lucia', 'Agustin', 'Camila', 'Mateo', 'Valentina', 'Diego', 'Martina', 'Joaquin'];
  const apellidos = ['Perez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Gomez', 'Diaz', 'Alvarez', 'Romero', 'Sosa', 'Torres', 'Ruiz', 'Castro'];
  const calles = ['Av. Corrientes', 'Calle Florida', 'Av. Santa Fe', 'Av. Cabildo', 'Av. Rivadavia', 'Belgrano', 'San Martin', 'Mitre', 'Urquiza', 'Sarmiento', 'Lavalle', 'Callao', 'Pueyrredon', 'Jujuy', 'Boedo'];

  const clients: SeedClient[] = [];
  for (let i = 0; i < count; i++) {
    const nom = nombres[i % nombres.length];
    const ape = apellidos[i % apellidos.length];
    const calle = calles[i % calles.length];
    const num = (i + 1) * 120;

    clients.push({
      nombre: nom,
      apellido: ape,
      telefono: `11110000${(i + 1).toString().padStart(2, '0')}`,
      email: `${nom.toLowerCase()}.${ape.toLowerCase()}@test.com`,
      direccion: `${calle} ${num}`,
      notas: i % 2 === 0 ? 'Cliente frecuente preferencial' : 'Entregar solo en horario vespertino'
    });
  }

  return clients;
}

export const SEED_ORDERS_SUITE: SeedOrderDef[] = [
  {
    idAlias: 'P01',
    clientIndex: 0, // Juan Perez
    items: [
      { serviceName: 'Lavado por Kilo (Hasta 5kg)', qty: 1, expectedPrice: 3500 },
      { serviceName: 'Planchado de Camisa', qty: 1, expectedPrice: 1200 }
    ],
    expectedTotal: 4700,
    targetStatus: 'ENTREGADO',
    shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 5000, leaveCredit: true },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P02',
    clientIndex: 1, // Maria Gonzalez
    items: [
      { serviceName: 'Lavado Edredón 2 Plazas', qty: 1, expectedPrice: 8500 }
    ],
    expectedTotal: 8500,
    targetStatus: 'ENTREGADO',
    shouldPay: true,
    paymentConfig: { method: 'TRANSFERENCIA', amountPaid: 8500 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P03',
    clientIndex: 2, // Pedro Rodriguez
    items: [
      { serviceName: 'Tintorería Tapado / Abrigo', qty: 1, expectedPrice: 7500 },
      { serviceName: 'Planchado Traje Completo', qty: 1, expectedPrice: 3200 }
    ],
    expectedTotal: 10700,
    targetStatus: 'ENTREGADO',
    shouldPay: false,
    accountingImpact: 'DEUDA_EXIGIBLE'
  },
  {
    idAlias: 'P04',
    clientIndex: 3, // Ana Fernandez
    items: [
      { serviceName: 'Tintorería Vestido Fiesta', qty: 1, expectedPrice: 9500 }
    ],
    expectedTotal: 9500,
    targetStatus: 'ENTREGADO',
    shouldPay: false,
    accountingImpact: 'DEUDA_EXIGIBLE'
  },
  {
    idAlias: 'P05',
    clientIndex: 4, // Lucas Lopez
    items: [
      { serviceName: 'Lavado de Camisas (x5)', qty: 1, expectedPrice: 4200 },
      { serviceName: 'Planchado de Camisa', qty: 2, expectedPrice: 2400 }
    ],
    expectedTotal: 6600,
    targetStatus: 'LISTO',
    shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P06',
    clientIndex: 5, // Sofia Martinez
    items: [
      { serviceName: 'Lavado Frazada / Manta', qty: 1, expectedPrice: 6200 }
    ],
    expectedTotal: 6200,
    targetStatus: 'EN_PROCESO',
    shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P07',
    clientIndex: 6, // Gonzalo Sanchez
    items: [
      { serviceName: 'Lavado por Kilo (Hasta 5kg)', qty: 1, expectedPrice: 3500 }
    ],
    expectedTotal: 3500,
    targetStatus: 'EN_PROCESO',
    shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P08',
    clientIndex: 7, // Lucia Gomez
    items: [
      { serviceName: 'Tintorería Campera Cuero', qty: 1, expectedPrice: 12000 }
    ],
    expectedTotal: 12000,
    targetStatus: 'PENDIENTE',
    shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P09',
    clientIndex: 0, // Juan Perez
    items: [
      { serviceName: 'Planchado de Pantalón', qty: 1, expectedPrice: 1000 }
    ],
    expectedTotal: 1000,
    targetStatus: 'ENTREGADO',
    shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 700, applyCredit: true },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P10',
    clientIndex: 8, // Agustin Diaz
    items: [
      { serviceName: 'Lavado Cortinas por Paño', qty: 1, expectedPrice: 4800 }
    ],
    expectedTotal: 4800,
    targetStatus: 'CANCELADO',
    shouldPay: false,
    accountingImpact: 'NINGUNO'
  }
];

export const EXPECTED_AUDIT_METRICS = {
  totalVentasBrutas: 62700,
  totalCobrosIngresados: 14200,
  deudaExigible: 20200,
  montoEnTaller: 28300,
  saldoTeoricoCaja: 25700
};
