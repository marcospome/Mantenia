import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Box, Car, Plus, Trash2 } from "lucide-react";
import { useActivos, useCatalogos, useCrearOrden, useFicha } from "../api/hooks";
import { useAuth } from "../auth/AuthContext";
import { tituloActivo } from "../components/badges";
import { Barra, Boton, Campo, Cargando, Chip, ErrorCaja, Pantalla, Pill, Segmentado } from "../components/ui";
import { aImporte, fmtPesos, isoLocal } from "../lib/format";

interface RepuestoForm {
  repuesto: string;
  cantidad: number;
  costo: string;
}

const esPreventivo = (texto: string) =>
  /prevent|servic|inspecc|lubric|revisi|aceite|filtro|alinea|balanceo|control|calibr|limpieza|rutina/i.test(texto);

export default function NuevaOrden() {
  const { perfil, t } = useAuth();
  const taller = perfil === "taller";
  const Icono = taller ? Car : Box;
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const [idActivo, setIdActivo] = useState<number | null>(params.get("activo") ? Number(params.get("activo")) : null);
  const desdeQr = params.get("origen") === "qr";

  const catalogos = useCatalogos();
  const ficha = useFicha(idActivo ?? 0);
  const listado = useActivos("", "todos");
  const crear = useCrearOrden();

  const [idTipo, setIdTipo] = useState<number | null>(null);
  const [idPrioridad, setIdPrioridad] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [km, setKm] = useState("");
  const [turno, setTurno] = useState("");
  const [repuestos, setRepuestos] = useState<RepuestoForm[]>([]);
  const [nuevoRepuesto, setNuevoRepuesto] = useState("");

  const activo = ficha.data?.activo;

  // Tipos de trabajo de la categoría del activo (o generales). En planta primero las fallas.
  const tipos = useMemo(() => {
    const todos = (catalogos.data?.tiposTrabajo ?? []).filter(
      (tt) => tt.idPadre === null || !activo?.idCategoriaActivo || tt.idPadre === activo.idCategoriaActivo,
    );
    return taller ? todos : [...todos.filter((x) => !esPreventivo(x.descripcion)), ...todos.filter((x) => esPreventivo(x.descripcion))];
  }, [catalogos.data, activo?.idCategoriaActivo, taller]);

  // Prioridad por defecto: la del medio (Baja / Media / Alta → Media)
  useEffect(() => {
    const lista = catalogos.data?.prioridades ?? [];
    if (idPrioridad === null && lista.length > 0) setIdPrioridad(lista[Math.floor((lista.length - 1) / 2)].id);
  }, [catalogos.data, idPrioridad]);

  // Taller: precarga el último kilometraje conocido
  useEffect(() => {
    if (taller && activo?.salud.kmActual != null && km === "") setKm(String(activo.salud.kmActual));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taller, activo?.idActivo]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idActivo) return;

    const pendiente = nuevoRepuesto.trim();
    const lista = pendiente ? [...repuestos, { repuesto: pendiente, cantidad: 1, costo: "" }] : repuestos;

    const creada = await crear
      .mutateAsync({
        idActivo,
        idTipoTrabajo: idTipo,
        idPrioridad,
        descripcion: taller ? null : texto.trim() || null,
        diagnostico: taller ? texto.trim() || null : null,
        kilometraje: km ? Number(km.replace(/\D/g, "")) : null,
        fechaProgramada: isoLocal(turno),
        repuestos: lista.map((r) => ({
          repuesto: r.repuesto,
          cantidad: r.cantidad,
          costo: aImporte(r.costo),
        })),
      })
      .catch(() => null);

    if (creada) navigate(`/ordenes/${creada.orden.idOrdenTrabajo}`, { replace: true });
  }

  function agregarRepuesto() {
    const nombre = nuevoRepuesto.trim();
    if (!nombre) return;
    setRepuestos((r) => [...r, { repuesto: nombre, cantidad: 1, costo: "" }]);
    setNuevoRepuesto("");
  }

  const totalRepuestos = repuestos.reduce((suma, r) => suma + (aImporte(r.costo) ?? 0) * r.cantidad, 0);

  const actualizarRepuesto = (i: number, cambios: Partial<RepuestoForm>) =>
    setRepuestos((lista) => lista.map((r, j) => (j === i ? { ...r, ...cambios } : r)));

  if (catalogos.isPending) return <Cargando />;

  const prioridades = catalogos.data?.prioridades ?? [];
  const puedeEnviar = idActivo !== null && (texto.trim() !== "" || idTipo !== null);

  return (
    <Pantalla>
      <Barra titulo="Nueva orden de trabajo" volverA={idActivo ? `/activos/${idActivo}` : "/ordenes"} />

      <form onSubmit={onSubmit} noValidate>
        {/* Activo */}
        {idActivo && activo ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
            <div className="grid size-10 place-items-center rounded-xl bg-canvas">
              <Icono className="size-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{tituloActivo(activo, perfil)}</p>
              <p className="truncate text-[12px] text-muted">{taller ? activo.cliente : (activo.ubicacion ?? activo.categoria)}</p>
            </div>
            {desdeQr ? (
              <Pill>Auto · QR</Pill>
            ) : (
              <button type="button" onClick={() => setIdActivo(null)} className="text-[12px] font-semibold text-muted">
                Cambiar
              </button>
            )}
          </div>
        ) : idActivo && ficha.isPending ? (
          <div className="h-16 animate-pulse rounded-2xl bg-canvas" />
        ) : (
          <Campo etiqueta={t("activo")}>
            <select className="field" value="" onChange={(e) => setIdActivo(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Elegí un {t("activo").toLowerCase()}…</option>
              {listado.data?.items.map((a) => (
                <option key={a.idActivo} value={a.idActivo}>
                  {tituloActivo(a, perfil)}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {taller && (
          <Campo etiqueta="Kilometraje de ingreso">
            <input
              className="field"
              inputMode="numeric"
              placeholder="128.400"
              value={km}
              onChange={(e) => setKm(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Campo>
        )}

        {tipos.length > 0 && (
          <div className="mt-5">
            <span className="label">{t("tipoTrabajo")}</span>
            <div className="flex flex-wrap gap-2">
              {tipos.map((tt) => (
                <Chip key={tt.id} activo={idTipo === tt.id} onClick={() => setIdTipo(idTipo === tt.id ? null : tt.id)}>
                  {tt.descripcion}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {prioridades.length > 0 && (
          <div className="mt-5">
            <span className="label">Prioridad</span>
            <Segmentado
              opciones={prioridades.map((p) => ({ valor: p.id, texto: p.descripcion }))}
              valor={idPrioridad}
              onChange={setIdPrioridad}
            />
          </div>
        )}

        <Campo etiqueta={t("descripcion")}>
          <textarea
            className="field min-h-24 resize-none"
            placeholder={t("descripcionPlaceholder")}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </Campo>

        <div className="mt-5">
          <span className="label">{taller ? "Repuestos" : "Repuestos y materiales"}</span>
          <div className="rounded-xl border border-line px-3">
            {repuestos.map((r, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-line py-2.5">
                <span className="min-w-0 flex-1 truncate text-[14px]">{r.repuesto}</span>
                <input
                  aria-label="Costo unitario"
                  className="w-24 rounded-lg border border-line px-2 py-1 text-right text-[14px]"
                  inputMode="decimal"
                  placeholder="$ costo"
                  value={r.costo}
                  onChange={(e) => actualizarRepuesto(i, { costo: e.target.value.replace(/[^\d.,]/g, "") })}
                />
                <input
                  aria-label="Cantidad"
                  className="w-12 rounded-lg border border-line px-2 py-1 text-center text-[14px]"
                  inputMode="numeric"
                  value={r.cantidad}
                  onChange={(e) => actualizarRepuesto(i, { cantidad: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) })}
                />
                <button
                  type="button"
                  onClick={() => setRepuestos((l) => l.filter((_, j) => j !== i))}
                  className="text-muted"
                  aria-label="Quitar repuesto"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 py-2">
              <Plus className="size-4 text-muted" />
              <input
                className="min-w-0 flex-1 py-1.5 text-[14px] outline-none placeholder:text-muted"
                placeholder="Agregar repuesto"
                value={nuevoRepuesto}
                onChange={(e) => setNuevoRepuesto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarRepuesto();
                  }
                }}
              />
              {nuevoRepuesto.trim() && (
                <button type="button" onClick={agregarRepuesto} className="text-[13px] font-semibold">
                  Agregar
                </button>
              )}
            </div>
          </div>
          {totalRepuestos > 0 && (
            <p className="mt-1.5 text-right text-[12px] text-muted">
              Total repuestos: <span className="font-semibold text-ink">{fmtPesos(totalRepuestos)}</span>
            </p>
          )}
        </div>

        <Campo etiqueta={taller ? "Turno (opcional)" : "Programar para (opcional)"}>
          <input className="field" type="datetime-local" value={turno} onChange={(e) => setTurno(e.target.value)} />
        </Campo>

        {crear.error && <ErrorCaja error={crear.error} />}

        <Boton type="submit" className="mt-8" cargando={crear.isPending} disabled={!puedeEnviar}>
          {t("enviarOrden")}
        </Boton>
        {!puedeEnviar && idActivo !== null && (
          <p className="mt-2 text-center text-[12px] text-muted">Elegí un tipo o escribí una descripción.</p>
        )}
      </form>
    </Pantalla>
  );
}
