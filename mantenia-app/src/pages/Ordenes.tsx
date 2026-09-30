import { Link, useSearchParams } from "react-router";
import { Plus, TriangleAlert, Wrench } from "lucide-react";
import { useOrdenes } from "../api/hooks";
import { useAuth } from "../auth/AuthContext";
import { EstadoOrdenLista } from "../components/badges";
import { Chip, ErrorCaja, Esqueleto, Fila, Pantalla, Vacio } from "../components/ui";
import { fmtFechaRelativa, unir } from "../lib/format";

type Estado = "abiertas" | "cerradas" | "todas";

export default function Ordenes() {
  const { perfil, t, puede } = useAuth();
  const [params, setParams] = useSearchParams();
  const estado = (params.get("estado") as Estado | null) ?? "abiertas";
  const { data, error, isPending, isFetching, refetch } = useOrdenes(estado);

  const cambiar = (nuevo: Estado) => setParams(nuevo === "abiertas" ? {} : { estado: nuevo }, { replace: true });

  return (
    <Pantalla>
      <header className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold tracking-tight">{t("ordenes")}</h1>
        {puede("ordenes.crear") && (
        <Link
          to="/ordenes/nueva"
          className="grid size-10 place-items-center rounded-xl bg-ink text-brand active:bg-ink-soft"
          aria-label="Nueva orden"
        >
          <Plus className="size-5" />
        </Link>
        )}
      </header>

      <div className="mt-5 flex gap-2">
        <Chip activo={estado === "abiertas"} onClick={() => cambiar("abiertas")}>
          Abiertas
        </Chip>
        <Chip activo={estado === "cerradas"} onClick={() => cambiar("cerradas")}>
          Cerradas
        </Chip>
        <Chip activo={estado === "todas"} onClick={() => cambiar("todas")}>
          Todas
        </Chip>
      </div>

      {error && <ErrorCaja error={error} reintentar={() => refetch()} />}

      <div className={isFetching && !isPending ? "opacity-60" : undefined}>
        {isPending ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Esqueleto key={i} className="h-14" />
            ))}
          </div>
        ) : data && data.length === 0 ? (
          <Vacio
            icono={<Wrench className="size-5" />}
            titulo={estado === "abiertas" ? "No hay órdenes abiertas" : "No hay órdenes"}
            texto="Creá una desde la ficha o escaneando el QR."
          />
        ) : (
          <div className="mt-2">
            {data?.map((o) => (
              <Fila
                key={o.idOrdenTrabajo}
                to={`/ordenes/${o.idOrdenTrabajo}`}
                icono={o.esFalla ? <TriangleAlert className="size-[18px]" /> : <Wrench className="size-[18px]" />}
                titulo={perfil === "taller" && o.identificador ? `${o.activo} · ${o.identificador}` : o.activo}
                subtitulo={unir(
                  `#${o.idOrdenTrabajo}`,
                  o.tipoTrabajo,
                  fmtFechaRelativa(o.abierta ? (o.fechaProgramada ?? o.fechaCreacion) : (o.fechaCierre ?? o.fechaCreacion)),
                )}
                derecha={<EstadoOrdenLista orden={o} perfil={perfil} />}
              />
            ))}
          </div>
        )}
      </div>
    </Pantalla>
  );
}
