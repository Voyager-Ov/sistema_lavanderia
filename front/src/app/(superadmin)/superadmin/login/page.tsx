"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyIcon, MailIcon, ShieldAlertIcon } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("octavio.velo2022@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();

  const getApiUrl = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/superadmin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Error al iniciar sesión");
      }

      const token = data.token || (data.data && data.data.token);
      if (!token) {
        throw new Error("No se pudo obtener un token válido del servidor.");
      }

      localStorage.setItem("superadmin_token", token);
      toast.success("¡Bienvenido al panel Super Admin!");
      router.push("/superadmin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    const targetEmail = email.trim() || "octavio.velo2022@gmail.com";
    if (!targetEmail) {
      toast.error("Por favor ingresa tu correo de SuperAdmin.");
      return;
    }

    setSendingReset(true);
    setResetSuccess(false);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (res.ok) {
        setResetSuccess(true);
        toast.success(`📧 Enlace enviado a ${targetEmail}`, {
          description: "Revisa tu bandeja de entrada o spam para establecer tu nueva contraseña."
        });
      } else {
        toast.error("No se pudo enviar el correo", { description: data.message || "Intenta nuevamente." });
      }
    } catch (err: any) {
      toast.error("Error de conexión al solicitar restablecimiento");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <ShieldAlertIcon className="w-7 h-7 text-blue-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">Super Admin Console</h1>
          <p className="text-zinc-400 text-xs font-medium">Acceso exclusivo a la gestión central del sistema</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {resetSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
            ✉️ Te enviamos un correo a <strong>{email}</strong> con el enlace seguro para cambiar tu contraseña.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Correo SuperAdmin</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all pl-10 font-medium"
                placeholder="octavio.velo2022@gmail.com"
                required
              />
              <MailIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Contraseña</label>
              <button
                type="button"
                onClick={handleRequestPasswordReset}
                disabled={sendingReset}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
              >
                <KeyIcon className="w-3 h-3" />
                {sendingReset ? "Enviando..." : "¿Olvidaste la clave?"}
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-4 py-3 text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Ingresar al Portal SuperAdmin"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={handleRequestPasswordReset}
            disabled={sendingReset}
            className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <KeyIcon className="w-4 h-4 text-amber-400" />
            {sendingReset ? "Generando Enlace con Token..." : "Enviar enlace para cambiar contraseña por Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
