import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRepuestos, type RepuestoInput } from "../api/hooks";
import type { OrdenDetalle, Repuesto } from "../api/types";
import { aImporte, fmtPesos } from "../lib/format";
import { cx, ErrorCaja } from "./ui";

interface Borrador {
  repuesto: string;
  cantidad: string;
  costo: string;
}

const vacio: Borrador = { repuesto: "", cantidad: "1", costo: "" };

const aInput = (b: Borrador): RepuestoInput => ({
  repuesto: b.repuesto.trim(),
  cantidad: Math.max(1, Number(b.cantidad.replace(/\D/g, "")) || 1),
  costo: aImporte(b.costo),
});

/** Detalle de la orden: repuestos/materiales editables, mano de obra y total. */
export function RepuestosOrden({ detalle, taller, editable }: { detalle: OrdenDetalle; taller: boolean; editable: boolean }) {
  const op = useRepuestos(detalle.orden.idOrdenTrabajo);
  const [nuevo, setNuevo] = useState<Borrador>(vacio);
  const [editando, setEditando] = useState<{ id: number; borrador: Borrador } | null>(null);

  const total = (detalle.importe ?? 0) + detalle.costoRepuestos;

  async function agregar(e: FormEvent) {
    e.preventDefault();
    if (!nuevo.repuesto.trim()) return;
    const ok = await op.mutateAsync({ accion: "agregar", dto: aInput(nuevo) }).then(
      () => true,
      () => false,
    );
    if (ok) setNuevo(vacio);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!editando || !editando.borrador.repuesto.trim()) return;
    const ok = await op.mutateAsync({ accion: "guardar", id: editando.id, dto: aInput(editando.borrador) }).then(
      () => true,
      () => false,
    );
    if (ok) setEditando(null);
  }

  function borrar(r: Repuesto) {
    if (!confirm(`¿Quitar “${r.repuesto ?? "repuesto"}” de la orden?`)) return;
    void op.mutateAsync({ accion: "borrar", id: r.idOrdenTrabajoDetalle }).catch(() => undefined);
  }

  return (
    <div>
      {op.error && <ErrorCaja error={op.error} />}
      <div className="overflow-hidden rounded-2xl border border-line">
        {detalle.repuestos.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-muted">Sin {taller ? "repuestos" : "repuestos ni materiales"} cargados.</p>
        )}

        {detalle.repuestos.map((r) =>
          editando?.id === r.idOrdenTrabajoDetalle ? (
            <form key={r.idOrdenTrabajoDetalle} onSubmit={guardar} className="border-b border-line bg-canvas/50 p-3">
              <CamposRepuesto
                borrador={editando.borrador}
                onChange={(borrador) => setEditando({ id: r.idOrdenTrabajoDetalle, borrador })}
                autoFocus
              />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditando(null)} className="flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] text-muted active:bg-canvas">
                  <X className="size-4" /> Cancelar
                </button>
                <button
                  type="submit"
                  disabled={op.isPending || !editando.borrador.repuesto.trim()}
                  className="flex h-9 items-center gap-1 rounded-lg bg-ink px-3 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  <Check className="size-4 text-brand" /> Guardar
                </button>
              </div>
            </form>
          ) : (
            <div key={r.idOrdenTrabajoDetalle} className={cx("flex items-center gap-2 border-b border-line py-2 pl-4 text-[13px]", editable ? "pr-2" : "pr-4")}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.repuesto}</p>
                <p className="text-[12px] text-muted">
                  {r.cantidad ?? 1} × {r.costo != null ? fmtPesos(r.costo) : "sin costo"}
                </p>
              </div>
              {r.costo != null && <span className="shrink-0 font-semibold">{fmtPesos(r.costo * (r.cantidad ?? 1))}</span>}
              {editable && (
              <>
              <button
                type="button"
                aria-label="Editar repuesto"
                disabled={op.isPending}
                onClick={() =>
                  setEditando({
                    id: r.idOrdenTrabajoDetalle,
                    borrador: { repuesto: r.repuesto ?? "", cantidad: String(r.cantidad ?? 1), costo: r.costo != null ? String(r.costo).replace(".", ",") : "" },
                  })
                }
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted active:bg-canvas disabled:opacity-30"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Quitar repuesto"
                disabled={op.isPending}
                onClick={() => borrar(r)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-bad active:bg-canvas disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
              </>
              )}
            </div>
          ),
        )}

        {editable && (
        <form onSubmit={agregar} className="border-b border-line bg-canvas/50 p-3">
          <CamposRepuesto borrador={nuevo} onChange={setNuevo} placeholder={taller ? "Repuesto (ej. Filtro de aceite)" : "Repuesto o material"} />
          <button
            type="submit"
            disabled={op.isPending || !nuevo.repuesto.trim()}
            className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white text-[14px] font-semibold active:bg-canvas disabled:opacity-40"
          >
            <Plus className="size-4" /> Agregar
          </button>
        </form>
        )}

        {detalle.importe != null && (
          <div className="flex justify-between border-b border-line px-4 py-2.5 text-[13px]">
            <span>{taller ? "Mano de obra / importe" : "Costo de la reparación"}</span>
            <span className="text-muted">{fmtPesos(detalle.importe)}</span>
          </div>
        )}
        <div className="flex justify-between px-4 py-3 text-[14px] font-semibold">
          <span>Total</span>
          <span>{fmtPesos(total)}</span>
        </div>
      </div>
    </div>
  );
}

function CamposRepuesto({
  borrador,
  onChange,
  placeholder = "Repuesto",
  autoFocus = false,
}: {
  borrador: Borrador;
  onChange: (b: Borrador) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_4rem_6.5rem] gap-2">
      <input
        className="field h-10 px-3 py-2"
        aria-label="Repuesto"
        placeholder={placeholder}
        maxLength={150}
        autoFocus={autoFocus}
        value={borrador.repuesto}
        onChange={(e) => onChange({ ...borrador, repuesto: e.target.value })}
      />
      <input
        className="field h-10 px-2 py-2 text-center"
        aria-label="Cantidad"
        inputMode="numeric"
        value={borrador.cantidad}
        onChange={(e) => onChange({ ...borrador, cantidad: e.target.value.replace(/\D/g, "") })}
      />
      <input
        className="field h-10 px-2 py-2 text-right"
        aria-label="Costo unitario"
        inputMode="decimal"
        placeholder="$ c/u"
        value={borrador.costo}
        onChange={(e) => onChange({ ...borrador, costo: e.target.value.replace(/[^\d.,]/g, "") })}
      />
    </div>
  );
}
