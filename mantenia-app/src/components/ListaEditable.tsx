import { useState, type FormEvent, type ReactNode } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { cx } from "./ui";

export interface ItemEditable {
  id: number;
  descripcion: string;
  usos?: number;
}

/**
 * Lista de un catálogo con alta, renombrado y baja en línea.
 * Los elementos en uso (usos > 0) no se pueden borrar: el botón queda deshabilitado con el motivo.
 */
export function ListaEditable<T extends ItemEditable>({
  items,
  placeholder,
  ocupado,
  textoUsos,
  punto,
  extra,
  vacio = "Todavía no hay ninguno.",
  onAgregar,
  onRenombrar,
  onEliminar,
}: {
  items: T[];
  placeholder: string;
  ocupado: boolean;
  /** Ej. (n) => `${n} activos` */
  textoUsos?: (usos: number) => string;
  /** Clase del puntito de color a la izquierda */
  punto?: (item: T) => string;
  /** Contenido adicional debajo de cada fila (ej. estados de orden de un tipo de trabajo) */
  extra?: (item: T) => ReactNode;
  vacio?: string;
  onAgregar: (descripcion: string) => Promise<unknown>;
  onRenombrar: (item: T, descripcion: string) => Promise<unknown>;
  onEliminar: (item: T) => Promise<unknown>;
}) {
  const [editando, setEditando] = useState<{ id: number; texto: string } | null>(null);

  async function guardar(item: T) {
    const texto = editando?.texto.trim();
    if (!texto || texto === item.descripcion) {
      setEditando(null);
      return;
    }
    const ok = await onRenombrar(item, texto).then(
      () => true,
      () => false,
    );
    if (ok) setEditando(null);
  }

  function eliminar(item: T) {
    if (!confirm(`¿Borrar “${item.descripcion}”?`)) return;
    void onEliminar(item).catch(() => undefined);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {items.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">{vacio}</p>}

      {items.map((item) => {
        const enUso = (item.usos ?? 0) > 0;
        const esEdicion = editando?.id === item.id;
        return (
          <div key={item.id} className="border-b border-line px-4 py-2.5 last:border-b-0">
            {esEdicion ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void guardar(item);
                }}
              >
                <input
                  className="field h-10 py-2"
                  autoFocus
                  maxLength={100}
                  value={editando.texto}
                  onChange={(e) => setEditando({ id: item.id, texto: e.target.value })}
                  onKeyDown={(e) => e.key === "Escape" && setEditando(null)}
                />
                <BotonChico etiqueta="Guardar" type="submit" disabled={ocupado}>
                  {ocupado ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                </BotonChico>
                <BotonChico etiqueta="Cancelar" onClick={() => setEditando(null)}>
                  <X className="size-4" />
                </BotonChico>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                {punto && <span className={cx("size-2.5 shrink-0 rounded-full", punto(item))} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{item.descripcion || "Sin nombre"}</p>
                  {textoUsos && enUso && <p className="text-[11px] text-muted">{textoUsos(item.usos ?? 0)}</p>}
                </div>
                <BotonChico etiqueta="Renombrar" disabled={ocupado} onClick={() => setEditando({ id: item.id, texto: item.descripcion })}>
                  <Pencil className="size-4" />
                </BotonChico>
                <BotonChico
                  etiqueta={enUso ? "En uso: no se puede borrar" : "Borrar"}
                  disabled={ocupado || enUso}
                  onClick={() => eliminar(item)}
                  className="text-bad"
                >
                  <Trash2 className="size-4" />
                </BotonChico>
              </div>
            )}
            {extra && !esEdicion && extra(item)}
          </div>
        );
      })}

      <div className="border-t border-line bg-canvas/50 px-3 py-2.5">
        <AgregarEnLinea placeholder={placeholder} ocupado={ocupado} onAgregar={onAgregar} />
      </div>
    </div>
  );
}

/** Campo + botón para dar de alta un elemento. Se vacía solo si el alta salió bien. */
export function AgregarEnLinea({
  placeholder,
  ocupado,
  onAgregar,
}: {
  placeholder: string;
  ocupado: boolean;
  onAgregar: (descripcion: string) => Promise<unknown>;
}) {
  const [nuevo, setNuevo] = useState("");

  async function agregar(e: FormEvent) {
    e.preventDefault();
    const texto = nuevo.trim();
    if (!texto) return;
    const ok = await onAgregar(texto).then(
      () => true,
      () => false,
    );
    if (ok) setNuevo("");
  }

  return (
    <form onSubmit={agregar} className="flex items-center gap-2">
      <input className="field h-10 py-2" placeholder={placeholder} maxLength={100} value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
      <BotonChico etiqueta="Agregar" type="submit" disabled={ocupado || !nuevo.trim()} className="bg-ink text-brand disabled:opacity-40">
        <Plus className="size-4" />
      </BotonChico>
    </form>
  );
}

function BotonChico({
  etiqueta,
  children,
  className,
  type = "button",
  ...props
}: {
  etiqueta: string;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      {...props}
      type={type}
      aria-label={etiqueta}
      title={etiqueta}
      className={cx("grid size-9 shrink-0 place-items-center rounded-lg active:bg-canvas disabled:opacity-30", className)}
    >
      {children}
    </button>
  );
}
