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
  rol: 'ADMIN' | 'EMPLEADO' | 'CAJERO';
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

export function generateSeedBusiness(): SeedBusinessData {
  const ts = Date.now().toString(36);
  return {
    negocioNombre: `Lavanderia E2E ${ts}`,
    usuarioNombre: `Admin E2E ${ts}`,
    email: `admin_${ts}@e2etest.com`,
    password: 'Password123!',
    telefono: '1144556677'
  };
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { nombre: 'Lavado Diario', descripcion: 'Servicios de lavandería común por kilo y prenda', icono: 'WashingMachine', color: '#3B82F6' },
  { nombre: 'Planchado', descripcion: 'Servicio profesional de planchado de camisas y trajes', icono: 'Shirt', color: '#10B981' },
  { nombre: 'Tintorería Especial', descripcion: 'Tratamiento delicado de abrigos, vestidos y prendas de cuero', icono: 'Sparkles', color: '#8B5CF6' },
  { nombre: 'Artículos de Hogar', descripcion: 'Lavado y secado de edredones, frazadas, sábanas y cortinas', icono: 'Home', color: '#F59E0B' }
];

export const SEED_SERVICES: SeedService[] = [
  { nombre: 'Lavado por Kilo (Hasta 5kg)', categoriaNombre: 'Lavado Diario', precio: 3500, tiempoEstimadoMinutos: 180, unidadMedida: 'kilo', descripcion: 'Lavado y secado estándar de prendas diarias' },
  { nombre: 'Lavado por Kilo Adicional', categoriaNombre: 'Lavado Diario', precio: 800, tiempoEstimadoMinutos: 30, unidadMedida: 'kilo', descripcion: 'Kilo excedente de ropa diaria' },
  { nombre: 'Lavado Camisas (x5)', categoriaNombre: 'Lavado Diario', precio: 4200, tiempoEstimadoMinutos: 120, unidadMedida: 'pack', descripcion: 'Lavado delicado de 5 camisas' },
  { nombre: 'Planchado de Camisa', categoriaNombre: 'Planchado', precio: 1200, tiempoEstimadoMinutos: 20, unidadMedida: 'unidad', descripcion: 'Planchado a vapor y colgado en percha' },
  { nombre: 'Planchado de Traje Completo', categoriaNombre: 'Planchado', precio: 3200, tiempoEstimadoMinutos: 45, unidadMedida: 'unidad', descripcion: 'Planchado de saco y pantalón de vestir' },
  { nombre: 'Planchado de Pantalón', categoriaNombre: 'Planchado', precio: 1000, tiempoEstimadoMinutos: 15, unidadMedida: 'unidad', descripcion: 'Planchado con raya marcada' },
  { nombre: 'Tintorería Abrigo / Tapado', categoriaNombre: 'Tintorería Especial', precio: 7500, tiempoEstimadoMinutos: 1440, unidadMedida: 'unidad', descripcion: 'Limpieza a seco de abrigos de lana o paño' },
  { nombre: 'Tintorería Vestido de Fiesta', categoriaNombre: 'Tintorería Especial', precio: 9500, tiempoEstimadoMinutos: 1440, unidadMedida: 'unidad', descripcion: 'Tratamiento especial de pedrería y telas delicadas' },
  { nombre: 'Tintorería Campera de Cuero', categoriaNombre: 'Tintorería Especial', precio: 12000, tiempoEstimadoMinutos: 2880, unidadMedida: 'unidad', descripcion: 'Limpieza y nutrición de cuero sintético o vacuno' },
  { nombre: 'Lavado de Edredón 2 Plazas', categoriaNombre: 'Artículos de Hogar', precio: 8500, tiempoEstimadoMinutos: 360, unidadMedida: 'unidad', descripcion: 'Lavado profundo y secado a temperatura controlada' },
  { nombre: 'Lavado de Frazada / Manta', categoriaNombre: 'Artículos de Hogar', precio: 6200, tiempoEstimadoMinutos: 240, unidadMedida: 'unidad', descripcion: 'Lavado con suavizante premium anti-alérgico' },
  { nombre: 'Lavado de Cortinas por Paño', categoriaNombre: 'Artículos de Hogar', precio: 4800, tiempoEstimadoMinutos: 360, unidadMedida: 'unidad', descripcion: 'Desmanchado y lavado delicado de cortinas' }
];

export function generateSeedEmployees(): SeedEmployee[] {
  const ts = uniqueId('emp');
  return [
    { nombre: 'Carlos Cajero', email: `${ts}_caja@e2etest.com`, password: 'Password123!', rol: 'CAJERO', telefono: generateRandomPhone() },
    { nombre: 'Marta Lavandería', email: `${ts}_taller@e2etest.com`, password: 'Password123!', rol: 'EMPLEADO', telefono: generateRandomPhone() },
    { nombre: 'Roberto Encargado', email: `${ts}_encargado@e2etest.com`, password: 'Password123!', rol: 'ADMIN', telefono: generateRandomPhone() }
  ];
}

export function generateSeedClients(count = 15): SeedClient[] {
  const nombres = ['Juan', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Sofia', 'Gonzalo', 'Lucia', 'Agustin', 'Camila', 'Mateo', 'Valentina', 'Diego', 'Martina', 'Joaquin', 'Elena'];
  const apellidos = ['Perez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Gomez', 'Diaz', 'Alvarez', 'Romero', 'Sosa', 'Torres', 'Ruiz'];
  const calles = ['Av. Corrientes', 'Calle Florida', 'Av. Santa Fe', 'Av. Cabildo', 'Av. Rivadavia', 'Belgrano', 'San Martin', 'Mitre', 'Urquiza', 'Sarmiento'];

  const clients: SeedClient[] = [];
  for (let i = 0; i < count; i++) {
    const nom = nombres[i % nombres.length];
    const ape = apellidos[i % apellidos.length];
    const calle = calles[i % calles.length];
    const num = Math.floor(100 + Math.random() * 8900);
    const ts = uniqueId(`cli_${i}`);

    clients.push({
      nombre: nom,
      apellido: `${ape}_${i + 1}`,
      telefono: generateRandomPhone(),
      email: `${ts}@cliente.test`,
      direccion: `${calle} ${num}`,
      notas: i % 2 === 0 ? 'Cliente frecuente preferencial' : 'Entregar solo en horario vespertino'
    });
  }

  return clients;
}
