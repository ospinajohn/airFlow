import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, ArrowRight, Loader2, User } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC<{ onSwitchAction: () => void }> = ({ onSwitchAction }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Registrar usuario
      await apiClient.post('/auth/register', { email, password, name });
      
      // 2. Iniciar sesión automáticamente
      const { data } = await apiClient.post('/auth/login', { email, password });
      login(data.user, data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass p-8 rounded-3xl z-10 border border-white/10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/30">
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Crea tu cuenta</h1>
          <p className="text-white/50 text-center">Únete a AirFlow y eleva tu productividad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 ml-1">Nombre Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 ml-1">Correo Electrónico</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="nombre@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70 ml-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Unirse a AirFlow
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/50 text-sm">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchAction}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
