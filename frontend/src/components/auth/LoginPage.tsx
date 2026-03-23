import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, LayoutGrid, Calendar, BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const TAGLINES = [
  'Convierte el caos en flujo.',
  'Tu sistema de pensamiento externo.',
  'El trabajo que importa, primero.',
  'Claridad sobre todo lo demás.',
];

export const LoginPage: React.FC<{ onSwitchAction: () => void }> = ({ onSwitchAction }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    // ── Validación manual — un mensaje claro a la vez ──
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El correo no tiene un formato válido.');
      return;
    }
    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      login(data.user, data.access_token);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Credenciales incorrectas. Verifica tu correo y contraseña.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Panel izquierdo ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-16 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 0% 50%, rgba(99,102,241,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 100% 100%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-0 w-64 h-64 rounded-full bg-emerald-500/8 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 2V16M2.5 6L15.5 12M15.5 6L2.5 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">AirFlow</span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-px w-10 bg-gradient-to-r from-indigo-400 to-transparent" />
            <span className="text-indigo-400 text-xs font-mono uppercase tracking-widest">Flow OS</span>
          </div>
          <h2 className="text-5xl font-light text-white/90 leading-[1.15] mb-6" style={{ fontFamily: "'Georgia', serif" }}>
            Tu sistema de<br />
            <span className="italic text-white">productividad personal.</span>
          </h2>
          <div className="h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIdx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4 }}
                className="text-white/35 text-lg font-light"
              >
                {TAGLINES[taglineIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Tablero Kanban', icon: <LayoutGrid className="w-4 h-4" /> },
            { label: 'Calendario', icon: <Calendar className="w-4 h-4" /> },
            { label: 'Analíticas', icon: <BarChart3 className="w-4 h-4" /> },
          ].map((f) => (
            <div key={f.label} className="px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur">
              <span className="text-white/30 text-lg block mb-1">{f.icon}</span>
              <span className="text-white/50 text-[11px] font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Panel derecho: Formulario ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-indigo-500/[0.02] to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-white font-semibold">AirFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-1.5 tracking-tight">Bienvenido de vuelta</h1>
            <p className="text-white/40 text-sm">Inicia sesión para continuar tu flujo</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="group">
              <label className="block text-xs font-medium text-white/50 mb-1.5 ml-0.5 tracking-wide uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-indigo-400 transition-colors duration-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500/60 focus:bg-indigo-500/[0.04] rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-medium text-white/50 mb-1.5 ml-0.5 tracking-wide uppercase">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-indigo-400 transition-colors duration-200" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500/60 focus:bg-indigo-500/[0.04] rounded-xl py-3 pl-10 pr-10 text-white text-sm placeholder:text-white/20 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-500/[0.08] border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.01 } : {}}
              whileTap={!isLoading ? { scale: 0.99 } : {}}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-xl shadow-indigo-600/25 group mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Entrar al flujo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-white/35 text-sm">
              ¿Primera vez?{' '}
              <button
                type="button"
                onClick={onSwitchAction}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Crea tu cuenta
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};