import { useState } from "react";
import { Link, useParams } from "react-router";
import { Box, Car, ChevronRight } from "lucide-react";
import { useCambiarEstado, useOrden } from "../api/hooks";
import { useAuth } from "../auth/AuthContext";
import { EstadoPill } from "../components/badges";
import { RepuestosOrden } from "../components/RepuestosOrden";
import { Barra, Boton, Cargando, Chip, ErrorCaja, Pantalla, Pill, Seccion } from "../components/ui";
import { aImporte, fmtDecimal, fmtFechaLarga, fmtNumero, horasEntre } from "../lib/format";

export default function OrdenDetalle() {
  const id = Number(useParams().id);
  const { perfil, puede } = useAuth();
  const taller = perfil === "taller";
  const { data, error, isPending, refetch } = useOrden(id);
  const cambiar = useCambiarEstado(id);

  const [estadoElegido, setEstadoElegido] = useState<number | null>(null);
  const [importe, setImporte] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  if (isPending) return <Cargando />;
  if (error || !data) {
    return (
      <Pantalla>
        <Barra volverA="/ordenes" />
        <ErrorCaja error={error ?? new Error("No encontrada")} reintentar={() => refetch()} />
      </Pantalla>
    );
  }

  const { orden } = data;
  const Icono = taller ? Car : Box;
  const elegido = data.estadosDisponibles.find((e) => e.id === estadoElegido) ?? null;
  const esFinal = elegido?.extra === "final";
  const horas = orden.esFalla ? horasEntre(orden.fechaInicio, orden.fechaCierre) : null;

  async function confirmarEstado() {
    if (!elegido) return;
    const ok = await cambiar
      .mutateAsync({
        idEstadoOrden: elegido.id,
        importe: aImporte(importe),
        diagnostico: diagnostico.trim() || null,
      })
      .catch(() => null);
    if (ok) {
      setEstadoElegido(null);
      setImporte("");
      setDiagnostico("");
    }
  }

  const filas: [string, string | null][] = [
    ["Tipo", orden.tipoTrabajo],
    ["Prioridad", orden.prioridad],
    ["Creada", orden.fechaCreacion && fmtFechaLarga(orden.fechaCreacion)],
    ["Programada", orden.fechaProgramada && fmtFechaLarga(orden.fechaProgramada)],
    ["Inicio", orden.fechaInicio && fmtFechaLarga(orden.fechaInicio)],
    ["Cierre", orden.fechaCierre && fmtFechaLarga(orden.fechaCierre)],
    ["Kilometraje", orden.kilometraje != null ? `${fmtNumero(orden.kilometraje)} km` : null],
    ["Tiempo detenido", horas != null && horas > 0 ? `${fmtDecimal(horas)} h` : null],
    ["Cargada por", orden.usuario],
  ];

  return (
    <Pantalla>
      <Barra volverA="/ordenes" titulo={`Orden #${orden.idOrdenTrabajo}`} />

      {orden.idActivo && (
        <Link
          to={`/activos/${orden.idActivo}`}
          className="flex items-center gap-3 rounded-2xl border border-line p-3 active:bg-canvas"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-canvas">
            <Icono className="size-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">
              {taller && orden.identificador ? `${orden.activo} · ${orden.identificador}` : orden.activo}
            </p>
            <p className="truncate text-[12px] text-muted">{orden.cliente ?? orden.identificador ?? ""}</p>
          </div>
          <ChevronRight className="size-4 text-muted" />
        </Link>
      )}

      <div className="mt-4 flex items-center gap-2">
        <EstadoPill estado={orden.estado ?? (orden.abierta ? "Abierta" : "Finalizada")} />
        {orden.esFalla && <Pill tono="negro">Falla</Pill>}
      </div>

      <dl className="mt-4 divide-y divide-line rounded-2xl border border-line px-4">
        {filas
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-[13px]">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
      </dl>

      {orden.descripcion && (
        <Seccion titulo="Descripción">
          <p className="text-[14px] whitespace-pre-line">{orden.descripcion}</p>
        </Seccion>
      )}
      {data.diagnostico && (
        <Seccion titulo="Diagnóstico">
          <p className="text-[14px] whitespace-pre-line">{data.diagnostico}</p>
        </Seccion>
      )}

      <Seccion titulo={taller ? "Repuestos y costos" : "Repuestos, materiales y costos"}>
        <RepuestosOrden detalle={data} taller={taller} editable={puede("ordenes.gestionar")} />
      </Seccion>

      {puede("ordenes.gestionar") && data.estadosDisponibles.length > 0 && (
        <Seccion titulo="Cambiar estado">
          <div className="flex flex-wrap gap-2">
            {data.estadosDisponibles.map((e) => (
              <Chip
                key={e.id}
                activo={estadoElegido === e.id}
                onClick={() => setEstadoElegido(estadoElegido === e.id ? null : e.id)}
              >
                {e.descripcion}
                {e.id === orden.idEstadoOrden ? " (actual)" : ""}
              </Chip>
            ))}
          </div>

          {elegido && (
            <div className="mt-4 rounded-2xl bg-canvas p-4">
              {esFinal && (
                <>
                  <label className="block">
                    <span className="label">{taller ? "Importe cobrado" : "Costo de la reparación"} (opcional)</span>
                    <input
                      className="field"
                      inputMode="decimal"
                      placeholder={data.importe != null ? String(data.importe) : "0"}
                      value={importe}
                      onChange={(e) => setImporte(e.target.value.replace(/[^\d.,]/g, ""))}
                    />
                  </label>
                  <label className="mt-3 block">
                    <span className="label">Diagnóstico / cierre (opcional)</span>
                    <textarea
                      className="field min-h-20"
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                    />
                  </label>
                </>
              )}
              {cambiar.error && <ErrorCaja error={cambiar.error} />}
              <Boton className={esFinal ? "mt-4" : undefined} cargando={cambiar.isPending} onClick={confirmarEstado}>
                Pasar a “{elegido.descripcion}”
              </Boton>
            </div>
          )}
        </Seccion>
      )}
    </Pantalla>
  );
}
