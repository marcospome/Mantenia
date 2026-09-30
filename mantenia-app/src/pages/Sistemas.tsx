import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { Check, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useOperacionSistemas, useSistemas } from "../api/hooks";
import type { LabelTipo, Sistemas as SistemasDatos, TipoOrganizacionSistemas } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { AgregarEnLinea, ListaEditable } from "../components/ListaEditable";
import { Barra, Boton, Cargando, cx, ErrorCaja, Pantalla, Seccion } from "../components/ui";
import { colorEstado } from "../lib/estados";

type Op = ReturnType<typeof useOperacionSistemas>;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function Sistemas() {
  const { contexto } = useAuth();
  const { data, error, isPending, refetch } = useSistemas();
  const op = useOperacionSistemas();
  const [idTipo, setIdTipo] = useState<number | null>(null);

  if (contexto && !contexto.esSistemas) return <Navigate to="/perfil" replace />;
  if (isPending) return <Cargando />;

  const tipo = data?.tiposOrganizacion.find((t) => t.id === idTipo) ?? data?.tiposOrganizacion[0] ?? null;

  return (
    <Pantalla>
      <Barra volverA="/perfil" titulo="Sistemas" />

      {error ? (
        <ErrorCaja error={error} reintentar={() => refetch()} />
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-ink p-4 text-[13px] leading-snug text-white">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
            <p>Configuración general del negocio. Lo que cambies acá afecta a todas las organizaciones del tipo elegido, o a todas si es global.</p>
          </div>

          {op.error && <ErrorCaja error={op.error} />}

          <Seccion titulo="Tipos de organización">
            <div className="flex flex-wrap gap-2">
              {data.tiposOrganizacion.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tipo?.id === t.id}
                  onClick={() => setIdTipo(t.id)}
                  className={cx(
                    "h-10 rounded-full border px-4 text-[13px] font-semibold transition",
                    tipo?.id === t.id ? "border-ink bg-ink text-brand" : "border-line bg-white text-ink-soft active:bg-canvas",
                    !t.activo && "opacity-50",
                  )}
                >
                  {t.descripcion}
                </button>
              ))}
            </div>
            <div className="mt-2.5 rounded-2xl border border-dashed border-line p-3">
              <AgregarEnLinea
                placeholder="Nuevo tipo (ej. Flota de transporte)"
                ocupado={op.isPending}
                onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: "/tipos-organizacion", body: { descripcion, activo: true } })}
              />
            </div>

            {tipo && <DetalleTipo key={tipo.id} tipo={tipo} datos={data} op={op} />}
          </Seccion>

          <Seccion titulo="Roles y permisos">
            <RolesYPermisos datos={data} op={op} />
          </Seccion>

          <Seccion titulo="Estados de orden (global)">
            <ListaEditable
              items={data.estadosOrden}
              placeholder="Nuevo estado (ej. Esperando repuesto)"
              ocupado={op.isPending}
              punto={(e) => colorEstado(e.descripcion).punto}
              textoUsos={(n) => `${plural(n, "orden", "órdenes")} en este estado`}
              onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: "/estados-orden", body: { descripcion, esFinal: false } })}
              onRenombrar={(e, descripcion) =>
                op.mutateAsync({ metodo: "PUT", ruta: `/estados-orden/${e.id}`, body: { descripcion, esFinal: e.esFinal } })
              }
              onEliminar={(e) => op.mutateAsync({ metodo: "DELETE", ruta: `/estados-orden/${e.id}` })}
              extra={(e) => (
                <label className="mt-1.5 inline-flex items-center gap-2 text-[12px] text-muted">
                  <input
                    type="checkbox"
                    className="size-4 accent-ink"
                    checked={e.esFinal}
                    disabled={op.isPending}
                    onChange={(ev) =>
                      void op
                        .mutateAsync({ metodo: "PUT", ruta: `/estados-orden/${e.id}`, body: { descripcion: e.descripcion, esFinal: ev.target.checked } })
                        .catch(() => undefined)
                    }
                  />
                  Estado final (cierra la orden)
                </label>
              )}
            />
          </Seccion>

          <Seccion titulo="Prioridades (global)">
            <ListaEditable
              items={data.prioridades}
              placeholder="Nueva prioridad (ej. Urgente)"
              ocupado={op.isPending}
              textoUsos={(n) => `Usada en ${plural(n, "orden", "órdenes")}`}
              onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: "/prioridades", body: { descripcion } })}
              onRenombrar={(p, descripcion) => op.mutateAsync({ metodo: "PUT", ruta: `/prioridades/${p.id}`, body: { descripcion } })}
              onEliminar={(p) => op.mutateAsync({ metodo: "DELETE", ruta: `/prioridades/${p.id}` })}
            />
          </Seccion>

          <Seccion titulo="Estados de activo generales">
            <p className="mb-2 text-[12px] text-muted">Aparecen en todas las categorías de todas las organizaciones (ej. Programado).</p>
            <ListaEditable
              items={data.estadosActivoGenerales}
              placeholder="Nuevo estado general"
              ocupado={op.isPending}
              punto={(e) => colorEstado(e.descripcion).punto}
              textoUsos={(n) => `En uso por ${plural(n, "activo", "activos")}`}
              onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: "/estados-activo", body: { descripcion } })}
              onRenombrar={(e, descripcion) => op.mutateAsync({ metodo: "PUT", ruta: `/estados-activo/${e.id}`, body: { descripcion } })}
              onEliminar={(e) => op.mutateAsync({ metodo: "DELETE", ruta: `/estados-activo/${e.id}` })}
            />
          </Seccion>
        </>
      )}
    </Pantalla>
  );
}

/** Roles globales y la matriz de permisos: qué acciones de cada módulo tiene cada rol (tabla RolAccion). */
function RolesYPermisos({ datos, op }: { datos: SistemasDatos; op: Op }) {
  const [idRol, setIdRol] = useState<number | null>(null);
  const rol = datos.roles.find((r) => r.id === idRol) ?? datos.roles[0] ?? null;
  const asignadas = new Set(rol?.idsAccion ?? []);

  function renombrar() {
    if (!rol) return;
    const descripcion = prompt("Nuevo nombre del rol", rol.descripcion)?.trim();
    if (descripcion && descripcion !== rol.descripcion) {
      void op.mutateAsync({ metodo: "PUT", ruta: `/roles/${rol.id}`, body: { descripcion } }).catch(() => undefined);
    }
  }

  function eliminar() {
    if (!rol || !confirm(`¿Borrar el rol “${rol.descripcion}”?`)) return;
    void op
      .mutateAsync({ metodo: "DELETE", ruta: `/roles/${rol.id}` })
      .then(() => setIdRol(null))
      .catch(() => undefined);
  }

  function alternar(idAccion: number) {
    if (!rol) return;
    const ids = asignadas.has(idAccion) ? [...asignadas].filter((id) => id !== idAccion) : [...asignadas, idAccion];
    void op.mutateAsync({ metodo: "PUT", ruta: `/roles/${rol.id}/permisos`, body: { idsAccion: ids } }).catch(() => undefined);
  }

  const modulos = datos.modulos.filter((m) => datos.acciones.some((a) => a.idModulo === m.id));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {datos.roles.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={rol?.id === r.id}
            onClick={() => setIdRol(r.id)}
            className={cx(
              "flex h-10 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition",
              rol?.id === r.id ? "border-ink bg-ink text-brand" : "border-line bg-white text-ink-soft active:bg-canvas",
            )}
          >
            {r.descripcion}
            <span className={cx("text-[11px] font-normal", rol?.id === r.id ? "text-white/70" : "text-muted")}>{r.usuarios}</span>
          </button>
        ))}
      </div>
      <div className="mt-2.5 rounded-2xl border border-dashed border-line p-3">
        <AgregarEnLinea
          placeholder="Nuevo rol (ej. Supervisor)"
          ocupado={op.isPending}
          onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: "/roles", body: { descripcion } })}
        />
      </div>

      {rol && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-bold">{rol.descripcion}</p>
              <p className="text-[12px] text-muted">{plural(rol.usuarios, "usuario", "usuarios")}</p>
            </div>
            {!rol.protegido && (
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={renombrar}
                  disabled={op.isPending}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12px] font-semibold active:bg-canvas"
                >
                  <Pencil className="size-3.5" /> Renombrar
                </button>
                <button
                  type="button"
                  onClick={eliminar}
                  disabled={op.isPending || rol.usuarios > 0}
                  title={rol.usuarios > 0 ? "Tiene usuarios asignados" : undefined}
                  aria-label="Borrar rol"
                  className="grid size-9 place-items-center rounded-lg border border-line text-bad active:bg-canvas disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>

          {rol.protegido && (
            <p className="mt-2 text-[12px] text-muted">
              Rol del sistema: no se puede renombrar ni borrar.
              {rol.todosLosPermisos ? " Tiene todos los permisos siempre." : " Además configura los catálogos de su organización."}
            </p>
          )}

          <p className="label mt-4">Permisos por módulo</p>
          <div className="overflow-hidden rounded-xl border border-line">
            {modulos.map((m) => (
              <div key={m.id} className="border-b border-line last:border-b-0">
                <p className="bg-canvas/60 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{m.descripcion}</p>
                {datos.acciones
                  .filter((a) => a.idModulo === m.id)
                  .map((a) => {
                    const tiene = rol.todosLosPermisos || asignadas.has(a.id);
                    return (
                      <label key={a.id} className="flex items-center gap-3 px-3 py-2.5 text-[14px]">
                        <input
                          type="checkbox"
                          className="size-4 accent-ink"
                          checked={tiene}
                          disabled={rol.todosLosPermisos || op.isPending}
                          onChange={() => alternar(a.id)}
                        />
                        <span className="min-w-0 flex-1">{a.descripcion}</span>
                        {a.clave && <span className="shrink-0 font-mono text-[10px] text-muted">{a.clave}</span>}
                      </label>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DetalleTipo({ tipo, datos, op }: { tipo: TipoOrganizacionSistemas; datos: SistemasDatos; op: Op }) {
  const habilitados = new Set(tipo.modulos.map((m) => m.idModulo));
  const nombreModulo = (id: number) => datos.modulos.find((m) => m.id === id)?.descripcion ?? `Módulo ${id}`;

  function guardarTipo(cambios: { descripcion?: string; activo?: boolean }) {
    void op
      .mutateAsync({
        metodo: "PUT",
        ruta: `/tipos-organizacion/${tipo.id}`,
        body: { descripcion: cambios.descripcion ?? tipo.descripcion, activo: cambios.activo ?? tipo.activo },
      })
      .catch(() => undefined);
  }

  function renombrar() {
    const descripcion = prompt("Nuevo nombre del tipo de organización", tipo.descripcion)?.trim();
    if (descripcion && descripcion !== tipo.descripcion) guardarTipo({ descripcion });
  }

  function alternarModulo(idModulo: number) {
    const quitar = habilitados.has(idModulo);
    const textos = tipo.labels.filter((l) => l.idModulo === idModulo).length;
    if (quitar && textos > 0 && !confirm(`Al quitar “${nombreModulo(idModulo)}” se borran sus ${textos} texto(s). ¿Seguir?`)) return;
    const ids = quitar ? [...habilitados].filter((id) => id !== idModulo) : [...habilitados, idModulo];
    void op.mutateAsync({ metodo: "PUT", ruta: `/tipos-organizacion/${tipo.id}/modulos`, body: { idsModulo: ids } }).catch(() => undefined);
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold">{tipo.descripcion}</p>
          <p className="text-[12px] text-muted">{plural(tipo.organizaciones, "organización", "organizaciones")}</p>
        </div>
        <button
          type="button"
          onClick={renombrar}
          disabled={op.isPending}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 text-[12px] font-semibold active:bg-canvas"
        >
          <Pencil className="size-3.5" /> Renombrar
        </button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-[13px]">
        <input type="checkbox" className="size-4 accent-ink" checked={tipo.activo} disabled={op.isPending} onChange={(e) => guardarTipo({ activo: e.target.checked })} />
        Activo (disponible para nuevas organizaciones)
      </label>

      <p className="label mt-5">Módulos habilitados</p>
      <div className="flex flex-wrap gap-2">
        {datos.modulos.map((m) => {
          const on = habilitados.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              disabled={op.isPending}
              onClick={() => alternarModulo(m.id)}
              className={cx(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition",
                on ? "border-ok bg-ok/10 text-ok" : "border-line bg-white text-muted",
              )}
            >
              {on && <Check className="size-3.5" />}
              {m.descripcion}
            </button>
          );
        })}
      </div>

      <p className="label mt-5">Textos de la app</p>
      <p className="-mt-1 mb-2 text-[12px] text-muted">
        Cambian cómo se llaman las cosas para este tipo (ej. LBL_TAB_ACTIVO = Vehículos). La clave <span className="font-mono">perfil</span> acepta
        “taller” o “planta”.
      </p>
      <div className="overflow-hidden rounded-xl border border-line">
        {tipo.labels.length === 0 && <p className="px-3 py-2.5 text-[13px] text-muted">Sin textos personalizados.</p>}
        {tipo.labels.map((l) => (
          <FilaLabel key={l.id} label={l} modulo={nombreModulo(l.idModulo)} op={op} />
        ))}
        <NuevoLabel tipo={tipo} modulos={datos.modulos.filter((m) => habilitados.has(m.id))} op={op} />
      </div>
    </div>
  );
}

function FilaLabel({ label, modulo, op }: { label: LabelTipo; modulo: string; op: Op }) {
  const [clave, setClave] = useState(label.clave);
  const [valor, setValor] = useState(label.valor);
  const cambiado = clave.trim() !== label.clave || valor.trim() !== label.valor;

  function guardar(e: FormEvent) {
    e.preventDefault();
    void op.mutateAsync({ metodo: "PUT", ruta: `/labels/${label.id}`, body: { clave, valor } }).catch(() => undefined);
  }

  return (
    <form onSubmit={guardar} className="border-b border-line p-3">
      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{modulo}</p>
      <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-1.5">
        <input className="field h-10 px-3 py-2 font-mono text-[13px]" aria-label="Clave" value={clave} onChange={(e) => setClave(e.target.value)} />
        <input className="field h-10 px-3 py-2" aria-label="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <button type="submit" disabled={!cambiado || op.isPending} aria-label="Guardar" className="grid size-9 place-items-center rounded-lg active:bg-canvas disabled:opacity-30">
          <Check className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Borrar"
          disabled={op.isPending}
          onClick={() => {
            if (confirm(`¿Borrar el texto “${label.clave}”?`)) {
              void op.mutateAsync({ metodo: "DELETE", ruta: `/labels/${label.id}` }).catch(() => undefined);
            }
          }}
          className="grid size-9 place-items-center rounded-lg text-bad active:bg-canvas disabled:opacity-30"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </form>
  );
}

function NuevoLabel({ tipo, modulos, op }: { tipo: TipoOrganizacionSistemas; modulos: { id: number; descripcion: string }[]; op: Op }) {
  const [idModulo, setIdModulo] = useState<number | "">(modulos[0]?.id ?? "");
  const [clave, setClave] = useState("");
  const [valor, setValor] = useState("");

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (idModulo === "" || !clave.trim()) return;
    const ok = await op
      .mutateAsync({ metodo: "POST", ruta: `/tipos-organizacion/${tipo.id}/labels`, body: { idModulo, clave, valor } })
      .then(
        () => true,
        () => false,
      );
    if (ok) {
      setClave("");
      setValor("");
    }
  }

  if (modulos.length === 0) return <p className="bg-canvas/50 px-3 py-2.5 text-[12px] text-muted">Habilitá un módulo para agregar textos.</p>;

  return (
    <form onSubmit={agregar} className="grid gap-2 bg-canvas/50 p-3">
      <select className="field h-10 py-2" value={idModulo} onChange={(e) => setIdModulo(Number(e.target.value))} aria-label="Módulo">
        {modulos.map((m) => (
          <option key={m.id} value={m.id}>
            {m.descripcion}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input className="field h-10 px-3 py-2 font-mono text-[13px]" placeholder="Clave" value={clave} onChange={(e) => setClave(e.target.value)} />
        <input className="field h-10 px-3 py-2" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>
      <Boton type="submit" variante="secundario" className="h-10" disabled={!clave.trim() || op.isPending}>
        Agregar texto
      </Boton>
    </form>
  );
}
