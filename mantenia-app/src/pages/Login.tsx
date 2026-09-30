import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Wrench } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Boton, ErrorCaja } from "../components/ui";

export default function Login() {
  const { autenticado, ingresar, t } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { desde?: string } | null)?.desde ?? "/";

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const [ayuda, setAyuda] = useState(false);

  if (autenticado) return <Navigate to={destino} replace />;

  let plan = "";
  try {
    plan = localStorage.getItem("mantenia.plan") ?? "";
  } catch {
    /* ignorar */
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await ingresar(email.trim(), clave);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mt-12">
        <div className="grid size-14 place-items-center rounded-2xl bg-ink text-brand">
          <Wrench className="size-6" />
        </div>
        <h1 className="mt-6 text-[30px] font-bold tracking-tight">MantenIA</h1>
        <p className="mt-1 text-[14px] text-muted">{t("appSubtitulo")}</p>
      </div>

      <form onSubmit={onSubmit} className="mt-12" noValidate>
        <label className="block">
          <span className="label">Usuario o email</span>
          <input
            className="field"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="operario@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="mt-5 block">
          <span className="label">Contraseña</span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </label>

        <div className="mt-3 text-right">
          <button type="button" onClick={() => setAyuda((v) => !v)} className="text-[12px] text-muted underline-offset-2 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        {ayuda && (
          <p className="mt-2 rounded-xl bg-canvas p-3 text-[12px] text-ink-soft">
            Pedile al administrador de tu organización que te genere una clave nueva. Una vez adentro podés cambiarla desde tu perfil.
          </p>
        )}

        {error !== null && <ErrorCaja error={error} />}

        <Boton type="submit" className="mt-8" cargando={enviando} disabled={!email || !clave}>
          Ingresar
        </Boton>
      </form>

      <p className="mt-auto pt-10 text-center text-[11px] text-muted">v1.0{plan ? ` · ${plan}` : ""}</p>
    </div>
  );
}
