/**
 * Dataset Masivo de Fixtures para Auditoría E2E 100% UI:
 * POS Multirrol, Cajas Chicas, Gastos, Cuenta Corriente y Resiliencia Financiera.
 */

export interface SeedPOSCategory {
  nombre: string;
  descripcion: string;
}

export interface SeedPOSService {
  nombre: string;
  categoriaNombre: string;
  precioActual: number;
  tiempoEstimadoHoras: number;
}

export interface SeedPOSEmployee {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'EMPLEADO';
  telefono: string;
}

export interface SeedPOSClient {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
}

export interface SeedPOSOrderItem {
  serviceName: string;
  qty: number;
  expectedPrice: number;
}

export interface SeedPOSPaymentConfig {
  method: 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADOPAGO' | 'DEBITO' | 'CREDITO';
  amountPaid: number;
  leaveCredit?: boolean;
  applyCredit?: boolean;
}

export interface SeedPOSOrderDef {
  idAlias: string;
  clientIndex: number;
  items: SeedPOSOrderItem[];
  expectedTotal: number;
  targetStatus: 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';
  shouldPay: boolean;
  paymentConfig?: SeedPOSPaymentConfig;
  accountingImpact: 'COBRADO' | 'DEUDA_EXIGIBLE' | 'MONTO_EN_TALLER' | 'NINGUNO';
  shift: 1 | 2;
}

export interface SeedPOSExpense {
  descripcion: string;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA';
  categoria: string;
}

// ─── 5 CATEGORÍAS ───
export const SEED_POS_CATEGORIES: SeedPOSCategory[] = [
  { nombre: 'Lavado Diario', descripcion: 'Servicios de lavandería por kilo y prendas de uso cotidiano' },
  { nombre: 'Planchado Premium', descripcion: 'Servicio profesional de secado y planchado a vapor' },
  { nombre: 'Tintorería Fina', descripcion: 'Tratamiento delicado y lavado en seco de trajes y vestidos' },
  { nombre: 'Artículos de Hogar', descripcion: 'Lavado especializado de edredones, mantas, cortinas y alfombras' },
  { nombre: 'Especializado & Cuero', descripcion: 'Tratamiento de camperas de cuero, ante y prendas técnicas' }
];

// ─── 15 SERVICIOS ───
export const SEED_POS_SERVICES: SeedPOSService[] = [
  { nombre: 'Lavado por Kilo (Hasta 5kg)', categoriaNombre: 'Lavado Diario', precioActual: 3500, tiempoEstimadoHoras: 24 },
  { nombre: 'Lavado de Camisas (x5)', categoriaNombre: 'Lavado Diario', precioActual: 4200, tiempoEstimadoHoras: 24 },
  { nombre: 'Lavado Frazada / Manta', categoriaNombre: 'Lavado Diario', precioActual: 6200, tiempoEstimadoHoras: 48 },
  { nombre: 'Planchado de Camisa', categoriaNombre: 'Planchado Premium', precioActual: 1200, tiempoEstimadoHoras: 12 },
  { nombre: 'Planchado Traje Completo', categoriaNombre: 'Planchado Premium', precioActual: 3200, tiempoEstimadoHoras: 24 },
  { nombre: 'Planchado de Pantalón', categoriaNombre: 'Planchado Premium', precioActual: 1000, tiempoEstimadoHoras: 12 },
  { nombre: 'Tintorería Tapado / Abrigo', categoriaNombre: 'Tintorería Fina', precioActual: 7500, tiempoEstimadoHoras: 48 },
  { nombre: 'Tintorería Vestido Fiesta', categoriaNombre: 'Tintorería Fina', precioActual: 9500, tiempoEstimadoHoras: 72 },
  { nombre: 'Tintorería Traje de Novio', categoriaNombre: 'Tintorería Fina', precioActual: 14000, tiempoEstimadoHoras: 72 },
  { nombre: 'Lavado Edredón 2 Plazas', categoriaNombre: 'Artículos de Hogar', precioActual: 8500, tiempoEstimadoHoras: 48 },
  { nombre: 'Lavado Cortinas por Paño', categoriaNombre: 'Artículos de Hogar', precioActual: 4800, tiempoEstimadoHoras: 48 },
  { nombre: 'Lavado Alfombra Mediana', categoriaNombre: 'Artículos de Hogar', precioActual: 11000, tiempoEstimadoHoras: 72 },
  { nombre: 'Tintorería Campera Cuero', categoriaNombre: 'Especializado & Cuero', precioActual: 12000, tiempoEstimadoHoras: 96 },
  { nombre: 'Tratamiento Antimanchas Cuero', categoriaNombre: 'Especializado & Cuero', precioActual: 5500, tiempoEstimadoHoras: 48 },
  { nombre: 'Restauración de Gamuza', categoriaNombre: 'Especializado & Cuero', precioActual: 8800, tiempoEstimadoHoras: 96 }
];

export function uniquePOSId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

export function generatePOSBusiness() {
  const ts = uniquePOSId('biz');
  return {
    negocioNombre: `Lavanderia POS Audit ${ts}`,
    nombreAdministrador: 'Administrador POS Principal',
    email: `admin_${ts}@lavanderiapos.com`,
    password: 'Password123!',
    telefono: '1144556677'
  };
}

export function generatePOSEmployees(): SeedPOSEmployee[] {
  const ts = uniquePOSId('emp');
  return [
    { nombre: 'Carlos Cajero Mañana', email: `cajero_manana_${ts}@lavanderiapos.com`, password: 'Password123!', rol: 'EMPLEADO', telefono: '1199887766' },
    { nombre: 'Marta Taller', email: `taller_${ts}@lavanderiapos.com`, password: 'Password123!', rol: 'EMPLEADO', telefono: '1199887755' },
    { nombre: 'Roberto Cajero Tarde', email: `cajero_tarde_${ts}@lavanderiapos.com`, password: 'Password123!', rol: 'EMPLEADO', telefono: '1199887744' }
  ];
}

export function generatePOSClients(count = 25): SeedPOSClient[] {
  const clients: SeedPOSClient[] = [];
  const nombres = ['Juan', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Sofia', 'Gonzalo', 'Lucia', 'Agustin', 'Camila', 'Federico', 'Valentina', 'Diego', 'Martina', 'Nicolas', 'Julieta', 'Joaquin', 'Delfina', 'Tomas', 'Elena', 'Gabriel', 'Victoria', 'Mateo', 'Isabella', 'Benjamin'];
  const apellidos = ['Perez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Gomez', 'Diaz', 'Alvarez', 'Romero', 'Sosa', 'Torres', 'Ruiz', 'Ramirez', 'Flores', 'Benitez', 'Acosta', 'Medina', 'Herrera', 'Aguirre', 'Castro', 'Gimenez', 'Gutiérrez', 'Mendoza'];

  for (let i = 0; i < count; i++) {
    const nom = nombres[i % nombres.length];
    const ape = apellidos[i % apellidos.length];
    clients.push({
      nombre: nom,
      apellido: ape,
      telefono: `11220000${(i + 1).toString().padStart(2, '0')}`,
      email: `${nom.toLowerCase()}.${ape.toLowerCase()}@testpos.com`,
      direccion: `Calle POS Audit ${i + 100}`,
      notas: i % 2 === 0 ? 'Cliente Frecuente con Cuenta Corriente' : 'Entrega preferencial en turno tarde'
    });
  }

  return clients;
}

// ─── 25 PEDIDOS REPARTIDOS EN 2 TURNOS ───
export const SEED_POS_ORDERS_SUITE: SeedPOSOrderDef[] = [
  // --- TURNO 1 (12 Pedidos - Portal Admin) ---
  {
    idAlias: 'P01', clientIndex: 0, shift: 1,
    items: [
      { serviceName: 'Lavado por Kilo (Hasta 5kg)', qty: 1, expectedPrice: 3500 },
      { serviceName: 'Planchado de Camisa', qty: 1, expectedPrice: 1200 }
    ],
    expectedTotal: 4700, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 5000, leaveCredit: true },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P02', clientIndex: 1, shift: 1,
    items: [{ serviceName: 'Lavado Edredón 2 Plazas', qty: 1, expectedPrice: 8500 }],
    expectedTotal: 8500, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'TRANSFERENCIA', amountPaid: 8500 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P03', clientIndex: 2, shift: 1,
    items: [
      { serviceName: 'Tintorería Tapado / Abrigo', qty: 1, expectedPrice: 7500 },
      { serviceName: 'Planchado Traje Completo', qty: 1, expectedPrice: 3200 }
    ],
    expectedTotal: 10700, targetStatus: 'ENTREGADO', shouldPay: false,
    accountingImpact: 'DEUDA_EXIGIBLE'
  },
  {
    idAlias: 'P04', clientIndex: 3, shift: 1,
    items: [{ serviceName: 'Tintorería Vestido Fiesta', qty: 1, expectedPrice: 9500 }],
    expectedTotal: 9500, targetStatus: 'ENTREGADO', shouldPay: false,
    accountingImpact: 'DEUDA_EXIGIBLE'
  },
  {
    idAlias: 'P05', clientIndex: 4, shift: 1,
    items: [
      { serviceName: 'Lavado de Camisas (x5)', qty: 1, expectedPrice: 4200 },
      { serviceName: 'Planchado de Camisa', qty: 2, expectedPrice: 2400 }
    ],
    expectedTotal: 6600, targetStatus: 'LISTO', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P06', clientIndex: 5, shift: 1,
    items: [{ serviceName: 'Lavado Frazada / Manta', qty: 1, expectedPrice: 6200 }],
    expectedTotal: 6200, targetStatus: 'EN_PROCESO', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P07', clientIndex: 6, shift: 1,
    items: [{ serviceName: 'Lavado por Kilo (Hasta 5kg)', qty: 1, expectedPrice: 3500 }],
    expectedTotal: 3500, targetStatus: 'EN_PROCESO', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P08', clientIndex: 7, shift: 1,
    items: [{ serviceName: 'Tintorería Campera Cuero', qty: 1, expectedPrice: 12000 }],
    expectedTotal: 12000, targetStatus: 'PENDIENTE', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P09', clientIndex: 0, shift: 1,
    items: [{ serviceName: 'Planchado de Pantalón', qty: 1, expectedPrice: 1000 }],
    expectedTotal: 1000, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 700, applyCredit: true },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P10', clientIndex: 8, shift: 1,
    items: [{ serviceName: 'Lavado Cortinas por Paño', qty: 1, expectedPrice: 4800 }],
    expectedTotal: 4800, targetStatus: 'CANCELADO', shouldPay: false,
    accountingImpact: 'NINGUNO'
  },
  {
    idAlias: 'P11', clientIndex: 9, shift: 1,
    items: [{ serviceName: 'Tratamiento Antimanchas Cuero', qty: 1, expectedPrice: 5500 }],
    expectedTotal: 5500, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 5500 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P12', clientIndex: 10, shift: 1,
    items: [{ serviceName: 'Tintorería Traje de Novio', qty: 1, expectedPrice: 14000 }],
    expectedTotal: 14000, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'TRANSFERENCIA', amountPaid: 14000 },
    accountingImpact: 'COBRADO'
  },

  // --- TURNO 2 (13 Pedidos - Portal Empleado Cajero Tarde) ---
  {
    idAlias: 'P13', clientIndex: 11, shift: 2,
    items: [{ serviceName: 'Lavado Alfombra Mediana', qty: 1, expectedPrice: 11000 }],
    expectedTotal: 11000, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'TRANSFERENCIA', amountPaid: 11000 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P14', clientIndex: 12, shift: 2,
    items: [{ serviceName: 'Restauración de Gamuza', qty: 1, expectedPrice: 8800 }],
    expectedTotal: 8800, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'TRANSFERENCIA', amountPaid: 8800 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P15', clientIndex: 13, shift: 2,
    items: [{ serviceName: 'Tintorería Tapado / Abrigo', qty: 1, expectedPrice: 7500 }],
    expectedTotal: 7500, targetStatus: 'ENTREGADO', shouldPay: false,
    accountingImpact: 'DEUDA_EXIGIBLE'
  },
  {
    idAlias: 'P16', clientIndex: 14, shift: 2,
    items: [{ serviceName: 'Tratamiento Antimanchas Cuero', qty: 1, expectedPrice: 5500 }],
    expectedTotal: 5500, targetStatus: 'ENTREGADO', shouldPay: false,
    accountingImpact: 'DEUDA_EXIGIBLE'
  },
  {
    idAlias: 'P17', clientIndex: 15, shift: 2,
    items: [{ serviceName: 'Lavado de Camisas (x5)', qty: 1, expectedPrice: 4200 }],
    expectedTotal: 4200, targetStatus: 'LISTO', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P18', clientIndex: 16, shift: 2,
    items: [{ serviceName: 'Planchado Traje Completo', qty: 1, expectedPrice: 3200 }],
    expectedTotal: 3200, targetStatus: 'EN_PROCESO', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P19', clientIndex: 17, shift: 2,
    items: [{ serviceName: 'Planchado de Camisa', qty: 1, expectedPrice: 1200 }],
    expectedTotal: 1200, targetStatus: 'PENDIENTE', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P20', clientIndex: 18, shift: 2,
    items: [{ serviceName: 'Tintorería Traje de Novio', qty: 1, expectedPrice: 14000 }],
    expectedTotal: 14000, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 14000 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P21', clientIndex: 19, shift: 2,
    items: [{ serviceName: 'Lavado por Kilo (Hasta 5kg)', qty: 1, expectedPrice: 3500 }],
    expectedTotal: 3500, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 3500 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P22', clientIndex: 20, shift: 2,
    items: [{ serviceName: 'Lavado Frazada / Manta', qty: 1, expectedPrice: 6200 }],
    expectedTotal: 6200, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'EFECTIVO', amountPaid: 6200 },
    accountingImpact: 'COBRADO'
  },
  {
    idAlias: 'P23', clientIndex: 21, shift: 2,
    items: [{ serviceName: 'Tintorería Vestido Fiesta', qty: 1, expectedPrice: 9500 }],
    expectedTotal: 9500, targetStatus: 'LISTO', shouldPay: false,
    accountingImpact: 'MONTO_EN_TALLER'
  },
  {
    idAlias: 'P24', clientIndex: 22, shift: 2,
    items: [{ serviceName: 'Tintorería Campera Cuero', qty: 1, expectedPrice: 12000 }],
    expectedTotal: 12000, targetStatus: 'CANCELADO', shouldPay: false,
    accountingImpact: 'NINGUNO'
  },
  {
    idAlias: 'P25', clientIndex: 23, shift: 2,
    items: [{ serviceName: 'Lavado Edredón 2 Plazas', qty: 1, expectedPrice: 8500 }],
    expectedTotal: 8500, targetStatus: 'ENTREGADO', shouldPay: true,
    paymentConfig: { method: 'TRANSFERENCIA', amountPaid: 8500 },
    accountingImpact: 'COBRADO'
  }
];

// ─── 2 GASTOS OPERATIVOS TURNO MAÑANA ───
export const SEED_POS_EXPENSES: SeedPOSExpense[] = [
  { descripcion: 'Compra Insumo Detergente Industrial', monto: 3500, metodoPago: 'EFECTIVO', categoria: 'Insumos' },
  { descripcion: 'Compra Bolsas Plásticas Transparentes', monto: 1500, metodoPago: 'EFECTIVO', categoria: 'Materiales' }
];

// ─── ECUACIONES Y MÉTRICAS ESPERADAS DE AUDITORÍA 1:1 ───
export const EXPECTED_POS_AUDIT_METRICS = {
  totalGrossSales: 165200,        // Suma de pedidos no cancelados
  totalCollected: 86000,          // Suma de todos los ingresos de cobros abonados
  exigibleDebt: 33200,            // P03(10.700) + P04(9.500) + P15(7.500) + P16(5.500)
  workshopAmount: 46100,          // P05(6.600) + P06(6.200) + P07(3.500) + P08(12.000) + P17(4.200) + P18(3.200) + P19(1.200) + P23(9.500)
  totalExpenses: 5000,            // Gasto1(3.500) + Gasto2(1.500)
  shift1InitialCash: 20000,
  shift1CashCollected: 11200,     // P01(5.000) + P09(700) + P11(5.500) = 11.200
  shift1ExpensesCash: 5000,
  shift1ExpectedTheoreticalCash: 26200, // 20.000 + 11.200 - 5.000 = 26.200
  shift1DeclaredPhysicalCash: 26000,    // Discrepancia -$200 Faltante
  shift2InitialCash: 15000,
  shift2CashCollected: 23700,     // P20(14.000) + P21(3.500) + P22(6.200) = 23.700
  shift2ExpectedTheoreticalCash: 38700, // 15.000 + 23.700 = 38.700
  shift2DeclaredPhysicalCash: 38700     // Discrepancia $0
};
