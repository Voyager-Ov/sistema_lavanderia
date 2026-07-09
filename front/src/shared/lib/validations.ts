import { z } from "zod";

// Validaciones Genéricas Reutilizables

export const emailSchema = z
  .string({ message: "El correo electrónico es requerido." })
  .email("Formato de correo inválido.")
  .min(1, "El correo electrónico no puede estar vacío.");

export const passwordSchema = z
  .string({ message: "La contraseña es requerida." })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(50, "La contraseña es demasiado larga.");

// Esquema de Login Base (Como ejemplo y para reutilizar)
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
