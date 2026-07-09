import { apiClient } from "@/shared/lib/api-client";
import { User } from "@/shared/store/useAuthStore";

interface AuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    usuario: User;
  };
}

export const AuthApi = {
  login: (data: any) => apiClient.post<AuthResponse>("/auth/login", data),
  
  register: (data: any) => apiClient.post<AuthResponse>("/auth/register", data),
  
  googleLogin: (token: string) => apiClient.post<AuthResponse>("/auth/google", { token }),
  
  verifyEmail: (data: { email: string; code: string }) => apiClient.post<{status: string, message: string}>("/auth/verify-email", data),
  
  resendVerification: (email: string) => apiClient.post<{status: string, message: string}>("/auth/resend-verification", { email }),

  forgotPassword: (email: string) => apiClient.post<{status: string, message: string}>("/auth/forgot-password", { email }),
  
  resetPassword: (data: any) => apiClient.post<{status: string, message: string}>("/auth/reset-password", data),
};
