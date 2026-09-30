const locale = "es-AR";

const numero = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const numeroDecimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
const pesos = new Intl.NumberFormat(locale, { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const pesosCompacto = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "ARS",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const fmtNumero = (n: number | null | undefined) => (n == null ? "—" : numero.format(n));
export const fmtDecimal = (n: number | null | undefined) => (n == null ? "—" : numeroDecimal.format(n));
export const fmtPesos = (n: number | null | undefined) => (n == null ? "—" : pesos.format(n));
export const fmtPesosCorto = (n: number | null | undefined) =>
  n == null ? "—" : Math.abs(n) >= 100_000 ? pesosCompacto.format(n) : pesos.format(n);

function aFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inicioDelDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Diferencia en días calendario entre la fecha y hoy (0 = hoy, 1 = mañana, -1 = ayer). */
export function diasDesdeHoy(valor: string | null | undefined): number | null {
  const d = aFecha(valor);
  if (!d) return null;
  return Math.round((inicioDelDia(d).getTime() - inicioDelDia(new Date()).getTime()) / 86_400_000);
}

export function fmtFecha(valor: string | null | undefined): string {
  const d = aFecha(valor);
  if (!d) return "—";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

export function fmtFechaLarga(valor: string | null | undefined): string {
  const d = aFecha(valor);
  if (!d) return "—";
  return d.toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtHora(valor: string | null | undefined): string {
  const d = aFecha(valor);
  if (!d) return "—";
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

/** "Hoy", "Mañana", "Ayer" o dd/mm. */
export function fmtFechaRelativa(valor: string | null | undefined): string {
  const dias = diasDesdeHoy(valor);
  if (dias === null) return "—";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Ayer";
  return fmtFecha(valor);
}

export function horasEntre(desde: string | null, hasta: string | null): number | null {
  const a = aFecha(desde);
  if (!a) return null;
  const b = aFecha(hasta) ?? new Date();
  return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}

/** Valor para <input type="datetime-local"> → ISO local sin zona (la API guarda datetime local). */
export function isoLocal(valor: string): string | null {
  return valor ? `${valor}:00` : null;
}

/**
 * Convierte un importe escrito a mano en número, en formato argentino o no:
 * "1.500" → 1500, "1.500,50" → 1500.5, "1500,5" → 1500.5, "12.5" → 12.5. Vacío → null.
 */
export function aImporte(texto: string): number | null {
  const t = texto.trim().replace(/\s|\$/g, "");
  if (!t) return null;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

export const unir =(...partes: (string | null | undefined | false)[]) => partes.filter(Boolean).join(" · ");

export function iniciales(nombre?: string | null, apellido?: string | null) {
  return `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase() || "?";
}
