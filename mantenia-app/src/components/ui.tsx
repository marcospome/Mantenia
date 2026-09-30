import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, LoaderCircle, TriangleAlert } from "lucide-react";

export function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- botones

type Variante = "primario" | "secundario" | "marca" | "fantasma";

export function Boton({
  variante = "primario",
  cargando = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; cargando?: boolean }) {
  const estilos: Record<Variante, string> = {
    primario: "bg-ink text-white active:bg-ink-soft",
    secundario: "border border-ink/15 bg-white text-ink active:bg-canvas",
    marca: "bg-brand text-ink active:brightness-95",
    fantasma: "text-ink active:bg-canvas",
  };
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={cx(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition disabled:opacity-50",
        estilos[variante],
        className,
      )}
    >
      {cargando ? <LoaderCircle className="size-5 animate-spin" /> : children}
    </button>
  );
}

export function BotonIcono({
  className,
  children,
  etiqueta,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { etiqueta: string }) {
  return (
    <button
      {...props}
      aria-label={etiqueta}
      title={etiqueta}
      className={cx("grid size-10 place-items-center rounded-xl text-ink transition active:bg-canvas", className)}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- estructura

export function Pantalla({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]", className)}>{children}</div>;
}

/** Encabezado con botón volver y título centrado (pantallas secundarias). */
export function Barra({
  titulo,
  volverA,
  onVolver,
  derecha,
  oscuro = false,
}: {
  titulo?: ReactNode;
  volverA?: string;
  onVolver?: () => void;
  derecha?: ReactNode;
  oscuro?: boolean;
}) {
  const navigate = useNavigate();
  const clase = cx("grid size-10 place-items-center rounded-xl -ml-2", oscuro ? "text-white active:bg-white/10" : "active:bg-canvas");
  return (
    <div className="mb-4 flex h-10 items-center justify-between gap-2">
      {volverA ? (
        <Link to={volverA} className={clase} aria-label="Volver">
          <ChevronLeft className="size-6" />
        </Link>
      ) : (
        <button type="button" onClick={onVolver ?? (() => navigate(-1))} className={clase} aria-label="Volver">
          <ChevronLeft className="size-6" />
        </button>
      )}
      <div className={cx("min-w-0 flex-1 truncate text-center text-[15px] font-semibold", oscuro ? "text-white" : "text-ink")}>
        {titulo}
      </div>
      <div className="-mr-2 flex min-w-10 justify-end">{derecha}</div>
    </div>
  );
}

export function Seccion({ titulo, children, accion }: { titulo: ReactNode; children: ReactNode; accion?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- datos

export function Stat({ valor, etiqueta }: { valor: ReactNode; etiqueta: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white px-3 py-3">
      <div className="truncate text-[22px] leading-tight font-bold tracking-tight">{valor}</div>
      <div className="mt-1 text-[11px] leading-tight text-muted">{etiqueta}</div>
    </div>
  );
}

type Tono = "negro" | "marca" | "suave" | "gris";

export function Pill({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  const estilos: Record<Tono, string> = {
    negro: "bg-ink text-brand",
    marca: "bg-brand text-ink",
    suave: "bg-brand-soft text-brand-ink",
    gris: "bg-canvas text-ink-soft",
  };
  return (
    <span className={cx("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap", estilos[tono])}>
      {children}
    </span>
  );
}

export function Chip({
  activo,
  children,
  onClick,
}: {
  activo: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cx(
        "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition",
        activo ? "border-ink bg-ink text-white" : "border-line bg-white text-ink active:bg-canvas",
      )}
    >
      {children}
    </button>
  );
}

/** Fila de lista con ícono, título, subtítulo y algo a la derecha. */
export function Fila({
  icono,
  titulo,
  subtitulo,
  derecha,
  to,
  onClick,
  flecha = false,
}: {
  icono?: ReactNode;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  derecha?: ReactNode;
  to?: string;
  onClick?: () => void;
  flecha?: boolean;
}) {
  const contenido = (
    <>
      {icono && <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-ink">{icono}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">{titulo}</div>
        {subtitulo && <div className="mt-0.5 truncate text-[12px] text-muted">{subtitulo}</div>}
      </div>
      {derecha}
      {flecha && <ChevronRight className="size-4 shrink-0 text-muted" />}
    </>
  );
  const clase = "flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0";
  if (to) {
    return (
      <Link to={to} className={cx(clase, "active:bg-canvas/60")}>
        {contenido}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx(clase, "active:bg-canvas/60")}>
        {contenido}
      </button>
    );
  }
  return <div className={clase}>{contenido}</div>;
}

// ---------------------------------------------------------------- estados

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <LoaderCircle className="size-7 animate-spin" />
      <span className="text-[13px]">{texto}</span>
    </div>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-canvas", className)} />;
}

export function ErrorCaja({ error, reintentar }: { error: unknown; reintentar?: () => void }) {
  const mensaje = error instanceof Error ? error.message : "Ocurrió un error.";
  return (
    <div className="my-4 flex items-start gap-3 rounded-2xl border border-bad/20 bg-bad/5 p-4 text-[13px] text-bad">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">
        <p>{mensaje}</p>
        {reintentar && (
          <button type="button" onClick={reintentar} className="mt-2 font-semibold underline">
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function Vacio({ icono, titulo, texto, accion }: { icono?: ReactNode; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icono && <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-canvas text-muted">{icono}</div>}
      <p className="text-[14px] font-semibold">{titulo}</p>
      {texto && <p className="mt-1 text-[13px] text-muted">{texto}</p>}
      {accion && <div className="mt-4 w-full max-w-60">{accion}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- formularios

export function Campo({
  etiqueta,
  children,
  ayuda,
  error,
}: {
  etiqueta: string;
  children: ReactNode;
  ayuda?: string;
  error?: string;
}) {
  return (
    <label className="mt-5 block first:mt-0">
      <span className="label">{etiqueta}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[12px] text-bad">{error}</span>
      ) : (
        ayuda && <span className="mt-1.5 block text-[12px] text-muted">{ayuda}</span>
      )}
    </label>
  );
}

export function Segmentado<T extends string | number>({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T | null;
  onChange: (valor: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-line bg-white" role="radiogroup">
      {opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cx(
            "h-11 flex-1 border-r border-line text-[14px] transition last:border-r-0",
            valor === o.valor ? "bg-brand font-semibold text-ink" : "text-muted active:bg-canvas",
          )}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
