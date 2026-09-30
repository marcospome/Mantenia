// Color de cada estado de activo. Los estados vienen de la tabla EstadoActivo (texto libre),
// así que se reconocen por palabras clave; lo que no coincide queda en gris.

export interface ColorEstado {
  /** Punto / borde fuerte */
  punto: string;
  /** Fondo y texto para pills y chips seleccionados */
  pill: string;
}

const reglas: { patron: RegExp; color: ColorEstado }[] = [
  {
    patron: /program|agend|period/i,
    color: { punto: "bg-sky-500", pill: "bg-sky-100 text-sky-800 border-sky-500" },
  },
  {
    patron: /venc|riesgo|detenid|fuera de servicio|baja|roto|averi|inactiv|parad/i,
    color: { punto: "bg-red-500", pill: "bg-red-100 text-red-800 border-red-500" },
  },
  {
    patron: /en curso|proceso|trabajando/i,
    color: { punto: "bg-violet-500", pill: "bg-violet-100 text-violet-800 border-violet-500" },
  },
  {
    patron: /manten|repar|taller|revis|esper|diagn|pendient/i,
    color: { punto: "bg-amber-500", pill: "bg-amber-100 text-amber-800 border-amber-500" },
  },
  {
    patron: /operativ|activ|funcion|disponib|servicio|ok|listo|entregad|finaliz|cerrad|complet|termin|resuelt/i,
    color: { punto: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800 border-emerald-500" },
  },
];

const neutro: ColorEstado = { punto: "bg-muted", pill: "bg-canvas text-ink-soft border-ink" };

export function colorEstado(descripcion: string | null | undefined): ColorEstado {
  if (!descripcion) return neutro;
  return reglas.find((r) => r.patron.test(descripcion))?.color ?? neutro;
}
