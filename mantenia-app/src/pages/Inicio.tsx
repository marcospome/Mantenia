import { Link, useNavigate } from "react-router";
import { Bell, Box, Car, Phone, Zap } from "lucide-react";
import { useDashboard } from "../api/hooks";
import type { OrdenResumen } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EstadoOrdenLista } from "../components/badges";
import { ErrorCaja, Esqueleto, Fila, Pantalla, Seccion, Stat, Vacio } from "../components/ui";
import { fmtFechaRelativa, iniciales, unir } from "../lib/format";

export default function Inicio() {
  const { contexto, perfil, t } = useAuth();
  const { data, error, isPending, refetch } = useDashboard();
  const navigate = useNavigate();
  const taller = perfil === "taller";
  const Icono = taller ? Car : Box;
  const usuario = contexto?.usuario;

  const lista: OrdenResumen[] = data ? (taller ? [...data.enCurso, ...data.proximas].slice(0, 6) : data.proximas) : [];

  return (
    <Pantalla>
      <header className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-[12px] text-muted">
            {unir(`Hola, ${usuario?.nombre ?? ""}`.trim(), taller && contexto?.organizacion)}
          </p>
          <h1 className="text-[24px] font-bold tracking-tight">Inicio</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to={data?.alerta ? `/activos/${data.alerta.idActivo}` : "/ordenes"}
            className="relative grid size-10 place-items-center rounded-xl active:bg-canvas"
            aria-label="Alertas"
          >
            <Bell className="size-5" />
            {data?.alerta && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-brand ring-2 ring-white" />}
          </Link>
          <Link
            to="/perfil"
            className="grid size-9 place-items-center rounded-full bg-canvas text-[12px] font-semibold"
            aria-label="Mi perfil"
          >
            {iniciales(usuario?.nombre, usuario?.apellido)}
          </Link>
        </div>
      </header>

      {error && <ErrorCaja error={error} reintentar={() => refetch()} />}

      {/* Alerta predictiva */}
      {isPending ? (
        <Esqueleto className="mt-5 h-32" />
      ) : (
        data?.alerta && (
          <div
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/activos/${data.alerta!.idActivo}`)}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/activos/${data.alerta!.idActivo}`)}
            className="mt-5 block cursor-pointer rounded-2xl bg-ink p-4 text-white active:opacity-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.14em] text-brand">ALERTA PREDICTIVA</span>
              <Zap className="size-4 text-brand" />
            </div>
            <p className="mt-2 text-[16px] font-semibold">
              {taller && data.alerta.identificador ? `${data.alerta.nombre} · ${data.alerta.identificador}` : data.alerta.nombre}
            </p>
            <p className="mt-0.5 text-[12px] text-white/70">{data.alerta.mensaje}</p>

            {taller ? (
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="truncate text-[12px] text-white/70">{data.alerta.cliente && `Cliente: ${data.alerta.cliente}`}</span>
                {data.alerta.telefonoCliente && (
                  <a
                    href={`tel:${data.alerta.telefonoCliente}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[12px] font-semibold text-ink"
                  >
                    <Phone className="size-3.5" /> Avisar
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${data.alerta.probabilidad}%` }} />
                </div>
                <span className="text-[11px] font-semibold">{data.alerta.probabilidad}%</span>
              </div>
            )}
          </div>
        )
      )}

      {/* Resumen */}
      <Seccion titulo={t("resumen")}>
        {isPending ? (
          <div className="grid grid-cols-3 gap-2.5">
            <Esqueleto className="h-20" />
            <Esqueleto className="h-20" />
            <Esqueleto className="h-20" />
          </div>
        ) : (
          data && (
            <div className="grid grid-cols-3 gap-2.5">
              {taller ? (
                <>
                  <Stat valor={data.resumen.enTaller} etiqueta="En taller" />
                  <Stat valor={data.resumen.turnosHoy} etiqueta="Turnos hoy" />
                  <Stat valor={data.resumen.servicesVencidos} etiqueta="Services venc." />
                </>
              ) : (
                <>
                  <Stat valor={data.resumen.totalActivos} etiqueta={t("activos")} />
                  <Stat valor={data.resumen.ordenesAbiertas} etiqueta="OT abiertas" />
                  <Stat valor={`${data.resumen.disponibilidad}%`} etiqueta="Disponib." />
                </>
              )}
            </div>
          )
        )}
      </Seccion>

      {/* Próximas revisiones / Trabajos en curso */}
      <Seccion
        titulo={t("listaInicio")}
        accion={
          <Link to="/ordenes" className="text-[12px] font-semibold text-muted">
            Ver todo
          </Link>
        }
      >
        {isPending ? (
          <div className="space-y-2">
            <Esqueleto className="h-14" />
            <Esqueleto className="h-14" />
          </div>
        ) : lista.length === 0 ? (
          <Vacio icono={<Icono className="size-5" />} titulo="Nada pendiente" texto="No hay órdenes abiertas por ahora." />
        ) : (
          <div>
            {lista.map((o) => (
              <Fila
                key={o.idOrdenTrabajo}
                to={`/ordenes/${o.idOrdenTrabajo}`}
                icono={<Icono className="size-[18px]" />}
                titulo={taller && o.identificador ? `${o.activo} · ${o.identificador}` : o.activo}
                subtitulo={
                  taller
                    ? unir(o.tipoTrabajo, o.estado && /esper/i.test(o.estado) ? o.estado : null)
                    : unir(o.tipoTrabajo, fmtFechaRelativa(o.fechaProgramada ?? o.fechaCreacion))
                }
                derecha={<EstadoOrdenLista orden={o} perfil={perfil} />}
              />
            ))}
          </div>
        )}
      </Seccion>
    </Pantalla>
  );
}
