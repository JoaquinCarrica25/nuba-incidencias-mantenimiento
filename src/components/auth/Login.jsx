// ============================================================
// NUBA INCIDENCIAS — Login
// ============================================================
import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [pass, setPass]         = useState("");
  const [recordar, setRecordar] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 400));
    const ok = login(email, pass, recordar);
    if (!ok) setError("Email o contraseña incorrectos.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-nuba-blue to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-nuba-cyan flex items-center justify-center shadow-2xl shadow-nuba-cyan/30 mb-4">
            <span className="text-white font-black text-xl tracking-tight">N</span>
          </div>
          <h1 className="text-white font-bold text-2xl tracking-tight">NUBA</h1>
          <p className="text-white/50 text-sm mt-1">Sistema de Incidencias</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-nuba-cyan focus:ring-2 focus:ring-nuba-cyan/20 transition"
              />
            </div>
            <div>
              <label className="text-white/70 text-xs font-semibold uppercase tracking-wider block mb-1.5">Contraseña</label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-nuba-cyan focus:ring-2 focus:ring-nuba-cyan/20 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recordar"
                checked={recordar}
                onChange={e => setRecordar(e.target.checked)}
                className="w-4 h-4 rounded accent-nuba-cyan cursor-pointer"
              />
              <label htmlFor="recordar" className="text-white/60 text-sm cursor-pointer">Recordar sesión</label>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 rounded-xl px-4 py-2.5 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nuba-cyan text-white font-semibold py-3 rounded-xl text-sm transition hover:bg-nuba-cyan/90 active:scale-95 disabled:opacity-60 shadow-lg shadow-nuba-cyan/20 mt-2"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
