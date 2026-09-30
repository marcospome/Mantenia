import { useState } from "react";
import { Link } from "react-router";
import { ChartColumn, FileDown, Phone } from "lucide-react";
import { useReporte } from "../api/hooks";
import type { Reporte } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Boton, ErrorCaja, Esqueleto, Fila, Pantalla, Pill, Seccion, Vacio, cx } from "../components/ui";
import { fmtDecimal, fmtNumero, fmtPesosCorto } from "../lib/format";

const OPCIONES_MESES = [3, 6, 12];

export default function Reportes() {
  const { perfil, t, contexto, puede } = useAuth();
  const taller = perfil === "taller";
  const [meses, setMeses] = useState(6);
  const { data, error, isPending, isFetching, refetch } = useReporte(meses);

  const siguientePeriodo = () => setMeses((m) => OPCIONES_MESES[(OPCIONES_MESES.indexOf(m) + 1) % OPCIONES_MESES.length]);

  return (
    <Pantalla>
      <header className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold tracking-tight">Reportes</h1>
        <button
          type="button"
          onClick={siguientePeriodo}
          className="no-print rounded-full bg-canvas px-3 py-1.5 text-[12px] font-semibold active:bg-line"
          aria-label="Cambiar período"
        >
          Últimos {meses} meses
        </button>
      </header>
      <p className="hidden text-[12px] text-muted print:block">
        {contexto?.organizacion} · últimos {meses} meses · {new Date().toLocaleDateString("es-AR")}
      </p>

      {error && <ErrorCaja error={error} reintentar={() => refetch()} />}

      {isPending ? (
        <>
          <Esqueleto className="mt-5 h-64" />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Esqueleto className="h-20" />
            <Esqueleto className="h-20" />
          </div>
        </>
      ) : (
        data && (
          <div className={cx("transition-opacity", isFetching && "opacity-60")}>
            <Grafico data={data} taller={taller} titulo={t("reporteSerie")} />

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Kpi etiqueta={t("reporteCosto")} valor={fmtPesosCorto(data.costoTotal)} />
              {taller ? (
                <Kpi
                  etiqueta={t("reporteSegundo")}
                  valor={data.porcentajeClientesRecurrentes == null ? "—" : `${data.porcentajeClientesRecurrentes}%`}
                />
              ) : (
                <Kpi etiqueta={t("reporteSegundo")} valor={fmtNumero(data.ordenesCerradas)} />
              )}
            </div>

            <Seccion titulo={t("reporteLista")}>
              {taller ? (
                data.contactar.length === 0 ? (
                  <Vacio titulo="Nadie para contactar" texto="Todos los vehículos están al día." />
                ) : (
                  data.contactar.map((c) => (
                    <Fila
                      key={c.idActivo}
                      titulo={
                        <Link to={`/activos/${c.idActivo}`} className="underline-offset-2 hover:underline">
                          {[c.cliente, c.activo].filter(Boolean).join(" · ")}
                        </Link>
                      }
                      subtitulo={c.motivo.charAt(0).toUpperCase() + c.motivo.slice(1)}
                      derecha={
                        c.telefono ? (
                          <a
                            href={`tel:${c.telefono}`}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink"
                          >
                            <Phone className="size-3" /> Llamar
                          </a>
                        ) : (
                          <Pill>Sin teléfono</Pill>
                        )
                      }
                    />
                  ))
                )
              ) : data.criticos.length === 0 ? (
                <Vacio titulo="Sin fallas en el período" />
              ) : (
                data.criticos.map((c) => (
                  <Fila
                    key={c.idActivo}
                    to={`/activos/${c.idActivo}`}
                    titulo={c.nombre}
                    subtitulo={`${c.fallas} ${c.fallas === 1 ? "falla" : "fallas"} · ${fmtDecimal(c.horasDetenido)} h detenido`}
                    derecha={<Pill tono={c.fallas >= 3 ? "suave" : "gris"}>{c.accion}</Pill>}
                  />
                ))
              )}
            </Seccion>

            {puede("reportes.exportar") && (
              <Boton variante="secundario" className="no-print mt-6" onClick={() => window.print()}>
                <FileDown className="size-5" /> Exportar PDF
              </Boton>
            )}
          </div>
        )
      )}
    </Pantalla>
  );
}

function Kpi({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-line p-3.5">
      <p className="text-[11px] text-muted">{etiqueta}</p>
      <p className="mt-1 text-[22px] font-bold tracking-tight">{valor}</p>
    </div>
  );
}

function Grafico({ data, taller, titulo }: { data: Reporte; taller: boolean; titulo: string }) {
  const valores = data.serie.map((p) => (taller ? p.ordenesCerradas : p.horasDetenido));
  const maximo = Math.max(...valores, 1);
  const actual = taller ? data.ordenesUltimoMes : data.horasDetenidoUltimoMes;
  const variacion = taller ? data.variacionOrdenes : data.variacionHoras;
  // Downtime: bajar es bueno. Trabajos: subir es bueno.
  const bueno = variacion == null ? null : taller ? variacion >= 0 : variacion <= 0;

  if (valores.every((v) => v === 0)) {
    return (
      <div className="mt-5 rounded-2xl border border-line">
        <Vacio icono={<ChartColumn className="size-5" />} titulo="Todavía no hay datos" texto="El gráfico se completa con las órdenes cerradas." />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-line p-4">
      <p className="text-[13px] text-muted">{titulo}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[28px] font-bold tracking-tight">{taller ? fmtNumero(actual) : `${fmtDecimal(actual)} h`}</span>
        {variacion != null && (
          <span className={cx("text-[11px] font-semibold", bueno ? "text-ok" : "text-bad")}>
            {variacion >= 0 ? "▲" : "▼"} {Math.abs(variacion)}% vs. mes ant.
          </span>
        )}
      </div>

      <div className="mt-4 flex h-36 items-end gap-3" role="img" aria-label={`${titulo} por mes`}>
        {data.serie.map((p, i) => {
          const valor = valores[i];
          const ultimo = i === data.serie.length - 1;
          return (
            <div key={p.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div
                className={cx("w-full max-w-7 rounded-md", ultimo ? "bg-brand" : "bg-ink")}
                style={{ height: `${Math.max(4, (valor / maximo) * 100)}%` }}
                title={`${p.etiqueta}: ${taller ? valor : `${fmtDecimal(valor)} h`}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line pt-2">
        {data.serie.map((p) => (
          <span key={p.mes} className="flex-1 text-center text-[10px] text-muted">
            {p.etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
}
