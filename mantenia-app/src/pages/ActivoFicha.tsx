import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronRight, Ellipsis, Pencil, Phone, Plus, QrCode, ScanLine, Trash2, TriangleAlert, User, Wrench, Zap } from "lucide-react";
import { useEliminarActivo, useFicha } from "../api/hooks";
import type { OrdenResumen } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EstadoPill } from "../components/badges";
import { QrActivo } from "../components/QrActivo";
import { Barra, Boton, Cargando, ErrorCaja, Pantalla, Pill, Seccion, Stat, Vacio } from "../components/ui";
import { fmtDecimal, fmtFechaLarga, fmtNumero, horasEntre, unir } from "../lib/format";

export default function ActivoFicha() {
  const id = Number(useParams().id);
  const [params] = useSearchParams();
  const desdeQr = params.get("origen") === "qr";
  const { perfil, t, contexto, puede } = useAuth();
  const taller = perfil === "taller";
  const navigate = useNavigate();

  const { data, error, isPending, refetch } = useFicha(id);
  const eliminar = useEliminarActivo();
  const [menu, setMenu] = useState(false);
  const [verQr, setVerQr] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<unknown>(null);

  if (isPending) return <Cargando />;
  if (error || !data) {
    return (
      <Pantalla>
        <Barra volverA="/activos" />
        <ErrorCaja error={error ?? new Error("No encontrado")} reintentar={() => refetch()} />
      </Pantalla>
    );
  }

  const { activo, historial } = data;
  const s = activo.salud;

  async function borrar() {
    if (!confirm(`¿Eliminar "${activo.nombre ?? activo.identificador}"? Esta acción no se puede deshacer.`)) return;
    setErrorEliminar(null);
    try {
      await eliminar.mutateAsync(activo.idActivo);
      navigate("/activos", { replace: true });
    } catch (e) {
      setErrorEliminar(e);
      setMenu(false);
    }
  }

  const badge =
    taller && s.kmExcedido != null && s.kmExcedido > 0 ? (
      <Pill tono="negro">Service vencido</Pill>
    ) : s.nivel === "riesgo" ? (
      <Pill tono="negro">{t("badgeRiesgo")}</Pill>
    ) : s.detenido ? (
      <Pill tono="gris">{t("badgeDetenido")}</Pill>
    ) : s.nivel === "revisar" ? (
      <Pill tono="suave">{t("badgeRevisar")}</Pill>
    ) : null;

  const nuevaOrden = `/ordenes/nueva?activo=${activo.idActivo}${desdeQr ? "&origen=qr" : ""}`;

  return (
    <Pantalla>
      <Barra
        volverA="/activos"
        titulo={<span className="text-[12px] font-normal text-muted">{taller ? activo.identificador : unir("ID", activo.identificador)}</span>}
        derecha={
          puede("activos.gestionar") && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              className="grid size-10 place-items-center rounded-xl active:bg-canvas"
              aria-label="Más opciones"
              aria-expanded={menu}
            >
              <Ellipsis className="size-5" />
            </button>
            {menu && (
              <div className="absolute top-11 right-0 z-20 w-44 overflow-hidden rounded-xl border border-line bg-white text-[14px] shadow-lg">
                <Link to={`/activos/${activo.idActivo}/editar`} className="flex items-center gap-2 px-4 py-3 active:bg-canvas">
                  <Pencil className="size-4" /> Editar
                </Link>
                <button type="button" onClick={borrar} className="flex w-full items-center gap-2 px-4 py-3 text-bad active:bg-canvas">
                  <Trash2 className="size-4" /> Eliminar
                </button>
              </div>
            )}
          </div>
          )
        }
      />

      {errorEliminar !== null && <ErrorCaja error={errorEliminar} />}

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-[24px] leading-tight font-bold tracking-tight">{activo.nombre ?? activo.identificador}</h1>
        <div className="flex flex-col items-end gap-1.5 pt-1">
          {badge}
          <EstadoPill estado={activo.estado} />
        </div>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        {unir(taller ? activo.categoria : (activo.ubicacion ?? activo.categoria), [activo.marca, activo.modelo].filter(Boolean).join(" "))}
      </p>

      {activo.cliente || activo.telefonoCliente ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
            <User className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Cliente</p>
            <p className="truncate text-[15px] font-semibold">{activo.cliente ?? "Sin nombre"}</p>
            <p className="truncate text-[13px] text-muted">{activo.telefonoCliente ?? "Sin teléfono"}</p>
          </div>
          {activo.telefonoCliente && (
            <a
              href={`tel:${activo.telefonoCliente}`}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-brand active:bg-ink-soft"
              aria-label={`Llamar a ${activo.cliente ?? "cliente"}`}
            >
              <Phone className="size-5" />
            </a>
          )}
        </div>
      ) : puede("activos.gestionar") ? (
        <Link
          to={`/activos/${activo.idActivo}/editar`}
          className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-line p-3.5 text-[13px] text-muted active:bg-canvas"
        >
          <User className="size-4" /> Sin cliente asignado · <span className="font-semibold text-ink">Asignar</span>
        </Link>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-line p-3.5 text-[13px] text-muted">
          <User className="size-4" /> Sin cliente asignado
        </p>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {taller ? (
          <>
            <Stat valor={fmtNumero(s.kmActual)} etiqueta="Km actuales" />
            <Stat
              valor={s.kmExcedido == null ? "—" : s.kmExcedido > 0 ? `+${fmtNumero(s.kmExcedido)}` : fmtNumero(-s.kmExcedido)}
              etiqueta={s.kmExcedido != null && s.kmExcedido > 0 ? "Km vencido" : "Km al service"}
            />
            <Stat valor={s.cantidadOrdenes} etiqueta="Visitas" />
          </>
        ) : (
          <>
            <Stat valor={s.mtbfDias == null ? "—" : `${Math.round(s.mtbfDias)} d`} etiqueta="MTBF" />
            <Stat valor={s.diasProximaFalla == null ? "—" : `${s.diasProximaFalla} d`} etiqueta="Próx. falla" />
            <Stat valor={s.cantidadOrdenes} etiqueta="Órdenes" />
          </>
        )}
      </div>

      {s.sugerencia && (
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-brand p-4 text-[13px] leading-snug">
          <Zap className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">Sugerencia:</span> {s.sugerencia}
          </p>
        </div>
      )}

      <Seccion titulo={t("historial")}>
        {historial.length === 0 ? (
          <Vacio icono={<Wrench className="size-5" />} titulo="Sin órdenes todavía" />
        ) : (
          historial.slice(0, 20).map((o) => <ItemHistorial key={o.idOrdenTrabajo} orden={o} taller={taller} />)
        )}
      </Seccion>

      <div className="mt-6 space-y-2.5">
        {puede("ordenes.crear") && (
          <Boton onClick={() => navigate(nuevaOrden)}>
            {taller ? <Plus className="size-5 text-brand" /> : <TriangleAlert className="size-5 text-brand" />}
            {t("accionNuevaOrden")}
          </Boton>
        )}
        {activo.identificador ? (
          <Boton variante="secundario" onClick={() => setVerQr(true)}>
            <QrCode className="size-5" /> Generar código QR
          </Boton>
        ) : (
          <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-muted">
            <ScanLine className="size-3.5" /> Cargale un {t("identificador").toLowerCase()} para poder generar su QR.
          </p>
        )}
      </div>

      {verQr && activo.identificador && (
        <QrActivo
          codigo={activo.identificador}
          titulo={activo.nombre ?? activo.identificador}
          organizacion={contexto?.organizacion ?? null}
          logo={contexto?.logo ?? null}
          onCerrar={() => setVerQr(false)}
        />
      )}
    </Pantalla>
  );
}

function tituloHistorial(o: OrdenResumen, taller: boolean) {
  const tipo = o.tipoTrabajo ?? "Orden de trabajo";
  return o.esFalla && !taller ? `Falla: ${tipo.toLowerCase()}` : tipo;
}

/** Orden del historial: estado, quién y cuándo la cargó, y cierre o turno según corresponda. */
function ItemHistorial({ orden: o, taller }: { orden: OrdenResumen; taller: boolean }) {
  const horas = !taller && o.esFalla ? horasEntre(o.fechaInicio, o.fechaCierre) : null;
  return (
    <Link
      to={`/ordenes/${o.idOrdenTrabajo}`}
      className="flex w-full items-start gap-3 border-b border-line py-3 text-left last:border-b-0 active:bg-canvas/60"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-ink">
        {o.esFalla ? <TriangleAlert className="size-[18px]" /> : <Wrench className="size-[18px]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate pt-0.5 text-[14px] font-semibold">{tituloHistorial(o, taller)}</p>
          <EstadoPill estado={o.estado ?? (o.abierta ? "Abierta" : "Finalizada")} />
        </div>
        <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[12px]">
          <dt className="text-muted">Cargada</dt>
          <dd className="truncate">{unir(fmtFechaLarga(o.fechaCreacion), o.usuario ?? "Usuario desconocido")}</dd>
          {o.abierta ? (
            <>
              <dt className="text-muted">Turno</dt>
              <dd className={o.fechaProgramada ? "font-semibold" : "text-muted"}>
                {o.fechaProgramada ? fmtFechaLarga(o.fechaProgramada) : "Sin turno asignado"}
              </dd>
            </>
          ) : (
            <>
              <dt className="text-muted">Finalizada</dt>
              <dd>{unir(fmtFechaLarga(o.fechaCierre), horas != null && horas > 0 && `${fmtDecimal(horas)} h detenido`)}</dd>
            </>
          )}
          {taller && o.kilometraje != null && (
            <>
              <dt className="text-muted">Km</dt>
              <dd>{fmtNumero(o.kilometraje)}</dd>
            </>
          )}
        </dl>
      </div>
      <ChevronRight className="mt-3 size-4 shrink-0 text-muted" />
    </Link>
  );
}
