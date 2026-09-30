import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Box, Car, Plus, Search } from "lucide-react";
import { useActivos } from "../api/hooks";
import type { ActivoResumen } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EstadoActivoLista, tituloActivo } from "../components/badges";
import { Chip, ErrorCaja, Esqueleto, Fila, Pantalla, Vacio } from "../components/ui";
import { fmtNumero, unir } from "../lib/format";

type Filtro = "todos" | "riesgo" | "revisar" | "detenidos";

export default function Activos() {
  const { perfil, t, puede } = useAuth();
  const taller = perfil === "taller";
  const Icono = taller ? Car : Box;

  const [params, setParams] = useSearchParams();
  const filtro = (params.get("filtro") as Filtro | null) ?? "todos";
  const [texto, setTexto] = useState(params.get("q") ?? "");
  const [buscar, setBuscar] = useState(texto);

  // Espera a que el usuario deje de escribir antes de consultar
  useEffect(() => {
    const id = setTimeout(() => setBuscar(texto.trim()), 300);
    return () => clearTimeout(id);
  }, [texto]);

  const { data, error, isPending, isFetching, refetch } = useActivos(buscar, filtro);

  function cambiarFiltro(nuevo: Filtro) {
    const siguiente = new URLSearchParams(params);
    if (nuevo === "todos") siguiente.delete("filtro");
    else siguiente.set("filtro", nuevo);
    setParams(siguiente, { replace: true });
  }

  function subtitulo(a: ActivoResumen) {
    if (taller) {
      return unir(a.cliente, a.salud.kmActual != null && `${fmtNumero(a.salud.kmActual)} km`) || a.categoria || "";
    }
    return unir(a.ubicacion ?? a.categoria, a.salud.mtbfDias != null && `MTBF ${Math.round(a.salud.mtbfDias)} d`);
  }

  return (
    <Pantalla>
      <header className="flex items-center justify-between">
        <h1 className="text-[24px] font-bold tracking-tight">{t("activos")}</h1>
        {puede("activos.gestionar") && (
        <Link
          to="/activos/nuevo"
          className="grid size-10 place-items-center rounded-xl bg-ink text-brand active:bg-ink-soft"
          aria-label={`Nuevo ${t("activo").toLowerCase()}`}
        >
          <Plus className="size-5" />
        </Link>
        )}
      </header>

      <div className="relative mt-5">
        <input
          className="field pr-11"
          type="search"
          placeholder={t("buscarActivos")}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Search className="pointer-events-none absolute top-1/2 right-4 size-[18px] -translate-y-1/2 text-muted" />
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        <Chip activo={filtro === "todos"} onClick={() => cambiarFiltro("todos")}>
          Todos {data?.total ?? ""}
        </Chip>
        <Chip activo={filtro === "riesgo"} onClick={() => cambiarFiltro("riesgo")}>
          {t("filtroRiesgo")} {data?.enRiesgo ?? ""}
        </Chip>
        <Chip activo={filtro === "revisar"} onClick={() => cambiarFiltro("revisar")}>
          {t("badgeRevisar")} {data?.revisar ?? ""}
        </Chip>
        <Chip activo={filtro === "detenidos"} onClick={() => cambiarFiltro("detenidos")}>
          {t("filtroDetenidos")} {data?.detenidos ?? ""}
        </Chip>
      </div>

      {error && <ErrorCaja error={error} reintentar={() => refetch()} />}

      <div className={isFetching && !isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {isPending ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Esqueleto key={i} className="h-14" />
            ))}
          </div>
        ) : data && data.items.length === 0 ? (
          <Vacio
            icono={<Icono className="size-5" />}
            titulo={buscar || filtro !== "todos" ? "Sin resultados" : `Todavía no hay ${t("activos").toLowerCase()}`}
            texto={buscar || filtro !== "todos" ? "Probá con otra búsqueda o filtro." : "Cargá el primero con el botón +."}
          />
        ) : (
          <div className="mt-2">
            {data?.items.map((a) => (
              <Fila
                key={a.idActivo}
                to={`/activos/${a.idActivo}`}
                icono={<Icono className="size-[18px]" />}
                titulo={tituloActivo(a, perfil)}
                subtitulo={subtitulo(a)}
                derecha={<EstadoActivoLista activo={a} t={t} />}
              />
            ))}
          </div>
        )}
      </div>
    </Pantalla>
  );
}
