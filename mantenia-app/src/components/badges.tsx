import type { ActivoResumen, OrdenResumen, Perfil } from "../api/types";
import type { Traductor } from "../lib/labels";
import { colorEstado } from "../lib/estados";
import { diasDesdeHoy, fmtHora } from "../lib/format";
import { cx, Pill } from "./ui";

export function BadgeActivo({ activo, t }: { activo: ActivoResumen; t: Traductor }) {
  const { salud } = activo;
  if (salud.nivel === "riesgo") return <Pill tono="negro">{t("badgeRiesgo")}</Pill>;
  if (salud.detenido) return <Pill tono="gris">{t("badgeDetenido")}</Pill>;
  if (salud.nivel === "revisar") return <Pill tono="suave">{t("badgeRevisar")}</Pill>;
  return <Pill tono="gris">{t("badgeOk")}</Pill>;
}

/** Estado del activo (tabla EstadoActivo) con su color. */
export function EstadoPill({ estado }: { estado: string | null | undefined }) {
  if (!estado) return null;
  const color = colorEstado(estado);
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        color.pill,
      )}
    >
      <span className={cx("size-1.5 rounded-full", color.punto)} />
      {estado}
    </span>
  );
}

/** Para listas de activos: estado con color y, si hace falta, la alerta de salud (riesgo, detenido, revisar). */
export function EstadoActivoLista({ activo, t }: { activo: ActivoResumen; t: Traductor }) {
  if (!activo.estado) return <BadgeActivo activo={activo} t={t} />;
  const { salud } = activo;
  const alerta = salud.nivel !== "ok" || salud.detenido;
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <EstadoPill estado={activo.estado} />
      {alerta && <BadgeActivo activo={activo} t={t} />}
    </div>
  );
}

/** Para listas de órdenes: estado con color y, si está abierta sin empezar, cuándo toca (atrasada, hoy, mañana). */
export function EstadoOrdenLista({ orden, perfil }: { orden: OrdenResumen; perfil: Perfil }) {
  const estado = orden.estado ?? (orden.abierta ? "Abierta" : "Finalizada");
  let cuando: { texto: string; urgente: boolean } | null = null;
  if (orden.abierta && !orden.fechaInicio && orden.fechaProgramada) {
    const dias = diasDesdeHoy(orden.fechaProgramada);
    if (dias !== null && dias < 0) cuando = { texto: "Atrasada", urgente: true };
    else if (dias === 0) cuando = { texto: perfil === "taller" ? `Hoy ${fmtHora(orden.fechaProgramada)}` : "Hoy", urgente: true };
    else if (dias === 1) cuando = { texto: "Mañana", urgente: false };
  }
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <EstadoPill estado={estado} />
      {cuando && <span className={cx("text-[11px] font-semibold", cuando.urgente ? "text-bad" : "text-muted")}>{cuando.texto}</span>}
    </div>
  );
}

/** Texto descriptivo del activo para listas y encabezados. */
export function tituloActivo(a: Pick<ActivoResumen, "nombre" | "identificador">, perfil: Perfil) {
  if (perfil === "taller" && a.identificador) return `${a.identificador} · ${a.nombre ?? ""}`.replace(/ · $/, "");
  return a.nombre ?? a.identificador ?? "Sin nombre";
}
