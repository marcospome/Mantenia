import { useState } from "react";
import { Navigate } from "react-router";
import { ChevronDown, Pencil, Settings2, Trash2 } from "lucide-react";
import { useAjustes, useOperacionAjustes } from "../api/hooks";
import type { CategoriaAjuste, Item, TipoTrabajoAjuste } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { AgregarEnLinea, ListaEditable } from "../components/ListaEditable";
import { Barra, Cargando, cx, ErrorCaja, Pantalla, Seccion } from "../components/ui";
import { colorEstado } from "../lib/estados";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function Ajustes() {
  const { contexto, t } = useAuth();
  const { data, error, isPending, refetch } = useAjustes();
  const op = useOperacionAjustes();
  const [abierta, setAbierta] = useState<number | null>(null);

  if (contexto && !contexto.puedeAjustes) return <Navigate to="/perfil" replace />;
  if (isPending) return <Cargando />;

  const activoMin = t("activo").toLowerCase();
  const activosMin = t("activos").toLowerCase();

  return (
    <Pantalla>
      <Barra volverA="/perfil" titulo="Ajustes" />

      {error ? (
        <ErrorCaja error={error} reintentar={() => refetch()} />
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-canvas p-4 text-[13px] leading-snug">
            <Settings2 className="mt-0.5 size-4 shrink-0" />
            <p>
              Catálogos propios de <span className="font-semibold">{data.organizacion ?? "tu organización"}</span>. Cada categoría de{" "}
              {activoMin} tiene sus estados y tipos de trabajo. Lo general (estados de orden, prioridades) lo define Sistemas.
            </p>
          </div>

          {op.error && <ErrorCaja error={op.error} />}

          <Seccion titulo={`Categorías de ${activosMin}`}>
            <div className="space-y-2.5">
              {data.categorias.map((c) => (
                <TarjetaCategoria
                  key={c.id}
                  categoria={c}
                  estadosOrden={data.estadosOrden}
                  abierta={abierta === c.id}
                  onAlternar={() => setAbierta(abierta === c.id ? null : c.id)}
                  op={op}
                  activoMin={activoMin}
                  activosMin={activosMin}
                />
              ))}
            </div>

            {data.categorias.length === 0 && <p className="mb-2 text-[13px] text-muted">Creá tu primera categoría para empezar.</p>}
            <div className="mt-2.5 rounded-2xl border border-dashed border-line p-3">
              <AgregarEnLinea
                placeholder="Nueva categoría (ej. Autos, Compresores)"
                ocupado={op.isPending}
                onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: "/categorias", body: { descripcion } })}
              />
            </div>
          </Seccion>

          <Seccion titulo="Generales (los define Sistemas)">
            <p className="mb-2 text-[12px] text-muted">Estados de {activoMin} disponibles en todas las categorías:</p>
            <Chips items={data.estadosActivoGenerales} conColor />
            <p className="mt-4 mb-2 text-[12px] text-muted">Estados de orden de trabajo:</p>
            <Chips items={data.estadosOrden} conColor />
          </Seccion>
        </>
      )}
    </Pantalla>
  );
}

function TarjetaCategoria({
  categoria: c,
  estadosOrden,
  abierta,
  onAlternar,
  op,
  activoMin,
  activosMin,
}: {
  categoria: CategoriaAjuste;
  estadosOrden: Item[];
  abierta: boolean;
  onAlternar: () => void;
  op: ReturnType<typeof useOperacionAjustes>;
  activoMin: string;
  activosMin: string;
}) {
  function renombrar() {
    const descripcion = prompt("Nuevo nombre de la categoría", c.descripcion)?.trim();
    if (descripcion && descripcion !== c.descripcion) {
      void op.mutateAsync({ metodo: "PUT", ruta: `/categorias/${c.id}`, body: { descripcion } }).catch(() => undefined);
    }
  }

  function eliminar() {
    if (!confirm(`¿Borrar la categoría “${c.descripcion}” con sus estados y tipos de trabajo?`)) return;
    void op.mutateAsync({ metodo: "DELETE", ruta: `/categorias/${c.id}` }).catch(() => undefined);
  }

  function guardarTipo(tipo: TipoTrabajoAjuste, cambios: { descripcion?: string; idsEstadoOrden?: number[] }) {
    return op.mutateAsync({
      metodo: "PUT",
      ruta: `/tipos-trabajo/${tipo.id}`,
      body: { descripcion: cambios.descripcion ?? tipo.descripcion, idsEstadoOrden: cambios.idsEstadoOrden ?? tipo.idsEstadoOrden },
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <button type="button" onClick={onAlternar} aria-expanded={abierta} className="flex w-full items-center gap-3 p-4 text-left active:bg-canvas/60">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{c.descripcion}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {plural(c.estados.length, "estado", "estados")} · {plural(c.tiposTrabajo.length, "tipo de trabajo", "tipos de trabajo")} ·{" "}
            {plural(c.activos, activoMin, activosMin)}
          </p>
        </div>
        <ChevronDown className={cx("size-5 shrink-0 text-muted transition", abierta && "rotate-180")} />
      </button>

      {abierta && (
        <div className="border-t border-line bg-canvas/40 px-4 pt-3 pb-4">
          <div className="flex gap-2">
            <button type="button" onClick={renombrar} disabled={op.isPending} className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold active:bg-canvas">
              <Pencil className="size-3.5" /> Renombrar
            </button>
            <button
              type="button"
              onClick={eliminar}
              disabled={op.isPending || c.activos > 0}
              title={c.activos > 0 ? `Tiene ${activosMin} asignados` : undefined}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-bad active:bg-canvas disabled:opacity-40"
            >
              <Trash2 className="size-3.5" /> Borrar categoría
            </button>
          </div>

          <p className="label mt-4">Estados</p>
          <ListaEditable
            items={c.estados}
            placeholder="Nuevo estado (ej. Operativo, En reparación)"
            ocupado={op.isPending}
            punto={(e) => colorEstado(e.descripcion).punto}
            textoUsos={(n) => `En uso por ${plural(n, activoMin, activosMin)}`}
            vacio="Sin estados propios: se usan solo los generales."
            onAgregar={(descripcion) => op.mutateAsync({ metodo: "POST", ruta: `/categorias/${c.id}/estados`, body: { descripcion } })}
            onRenombrar={(e, descripcion) => op.mutateAsync({ metodo: "PUT", ruta: `/estados/${e.id}`, body: { descripcion } })}
            onEliminar={(e) => op.mutateAsync({ metodo: "DELETE", ruta: `/estados/${e.id}` })}
          />
          <p className="mt-1.5 text-[11px] text-muted">El color sale del nombre: operativo → verde, reparación/taller → ámbar, detenido/vencido → rojo, programado → azul.</p>

          <p className="label mt-5">Tipos de trabajo</p>
          <ListaEditable
            items={c.tiposTrabajo}
            placeholder="Nuevo tipo (ej. Service, Cambio de aceite)"
            ocupado={op.isPending}
            textoUsos={(n) => `Usado en ${plural(n, "orden", "órdenes")}`}
            vacio="Sin tipos de trabajo."
            onAgregar={(descripcion) =>
              op.mutateAsync({ metodo: "POST", ruta: `/categorias/${c.id}/tipos-trabajo`, body: { descripcion, idsEstadoOrden: [] } })
            }
            onRenombrar={(tipo, descripcion) => guardarTipo(tipo, { descripcion })}
            onEliminar={(tipo) => op.mutateAsync({ metodo: "DELETE", ruta: `/tipos-trabajo/${tipo.id}` })}
            extra={(tipo) => (
              <div className="mt-2">
                <p className="mb-1.5 text-[11px] text-muted">
                  Estados por los que pasa {tipo.idsEstadoOrden.length === 0 && <span className="font-semibold">(todos)</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {estadosOrden.map((e) => {
                    const elegido = tipo.idsEstadoOrden.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        disabled={op.isPending}
                        aria-pressed={elegido}
                        onClick={() => {
                          const ids = elegido ? tipo.idsEstadoOrden.filter((id) => id !== e.id) : [...tipo.idsEstadoOrden, e.id];
                          void guardarTipo(tipo, { idsEstadoOrden: ids }).catch(() => undefined);
                        }}
                        className={cx(
                          "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition disabled:opacity-60",
                          elegido ? colorEstado(e.descripcion).pill : "border-line bg-white text-muted",
                        )}
                      >
                        <span className={cx("size-1.5 rounded-full", colorEstado(e.descripcion).punto)} />
                        {e.descripcion}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

function Chips({ items, conColor = false }: { items: Item[]; conColor?: boolean }) {
  if (items.length === 0) return <p className="text-[13px] text-muted">Ninguno.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i.id}
          className={cx(
            "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold",
            conColor ? colorEstado(i.descripcion).pill : "border-line bg-white",
          )}
        >
          {conColor && <span className={cx("size-1.5 rounded-full", colorEstado(i.descripcion).punto)} />}
          {i.descripcion}
          {i.extra === "final" && <span className="font-normal opacity-70">· final</span>}
        </span>
      ))}
    </div>
  );
}
