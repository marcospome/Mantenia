import { useState, type FormEvent } from "react";
import { LogOut, Settings2, ShieldCheck } from "lucide-react";
import { cambiarClave } from "../api/hooks";
import { useAuth } from "../auth/AuthContext";
import { Barra, Boton, Campo, ErrorCaja, Fila, Pantalla, Seccion } from "../components/ui";
import { iniciales } from "../lib/format";

export default function Perfil() {
  const { contexto, salir, perfil } = useAuth();
  const usuario = contexto?.usuario;

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setEnviando(true);
    try {
      await cambiarClave(actual, nueva);
      setOk(true);
      setActual("");
      setNueva("");
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  const datos: [string, string | null | undefined][] = [
    ["Email", usuario?.email],
    ["Teléfono", usuario?.telefono],
    ["Rol", contexto?.rol],
    ["Organización", contexto?.organizacion],
    ["Tipo", contexto?.tipoOrganizacion ?? (perfil === "taller" ? "Taller" : "Planta")],
    ["Plan", contexto?.plan],
  ];

  return (
    <Pantalla>
      <Barra volverA="/" titulo="Mi perfil" />

      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-ink text-[18px] font-semibold text-brand">
          {iniciales(usuario?.nombre, usuario?.apellido)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold">{[usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ")}</p>
          <p className="truncate text-[13px] text-muted">{contexto?.organizacion}</p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line px-4">
        {datos
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-[13px]">
              <dt className="text-muted">{k}</dt>
              <dd className="truncate text-right font-medium">{v}</dd>
            </div>
          ))}
      </dl>

      {(contexto?.puedeAjustes || contexto?.esSistemas) && (
        <Seccion titulo="Configuración">
          <div className="rounded-2xl border border-line px-4">
            {contexto.puedeAjustes && (
              <Fila
                to="/ajustes"
                flecha
                icono={<Settings2 className="size-[18px]" />}
                titulo="Ajustes de la organización"
                subtitulo="Categorías, estados y tipos de trabajo"
              />
            )}
            {contexto.esSistemas && (
              <Fila
                to="/sistemas"
                flecha
                icono={<ShieldCheck className="size-[18px]" />}
                titulo="Sistemas"
                subtitulo="Tipos de organización, módulos, textos y catálogos globales"
              />
            )}
          </div>
        </Seccion>
      )}

      <Seccion titulo="Cambiar contraseña">
        <form onSubmit={onSubmit} noValidate>
          <Campo etiqueta="Contraseña actual">
            <input className="field" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
          </Campo>
          <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 8 caracteres.">
            <input className="field" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
          </Campo>
          {error !== null && <ErrorCaja error={error} />}
          {ok && <p className="mt-3 text-[13px] font-medium text-ok">Listo, tu contraseña se actualizó.</p>}
          <Boton type="submit" variante="marca" className="mt-5" cargando={enviando} disabled={!actual || nueva.length < 8}>
            Actualizar contraseña
          </Boton>
        </form>
      </Seccion>

      <Boton variante="secundario" className="mt-8" onClick={salir}>
        <LogOut className="size-5" /> Cerrar sesión
      </Boton>
    </Pantalla>
  );
}
