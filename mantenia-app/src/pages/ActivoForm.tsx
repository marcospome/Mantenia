import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Check, Phone, Search, UserPlus, X } from "lucide-react";
import { useActivoCrud, useCatalogos, useCrearCliente, useGuardarActivo } from "../api/hooks";
import type { ActivoInput } from "../api/types";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Barra, Boton, Campo, Cargando, cx, ErrorCaja, Pantalla } from "../components/ui";
import { colorEstado } from "../lib/estados";

const vacio: ActivoInput = {
  idCategoriaActivo: null,
  idCliente: null,
  idUbicacion: null,
  idEstadoActivo: null,
  identificador: null,
  nombre: null,
  marca: null,
  modelo: null,
};

const aNumero = (v: string) => (v === "" ? null : Number(v));
const aTexto = (v: string) => (v.trim() === "" ? null : v);

// Minúsculas y sin acentos, para que "gonzalez" encuentre "González"
const normalizar = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const soloDigitos = (v: string) => v.replace(/\D/g, "");

export default function ActivoForm() {
  const params = useParams();
  const id = params.id ? Number(params.id) : null;
  const { perfil, t } = useAuth();
  const taller = perfil === "taller";
  const navigate = useNavigate();

  const catalogos = useCatalogos();
  const existente = useActivoCrud(id);
  const guardar = useGuardarActivo(id);
  const crearCliente = useCrearCliente();

  const [form, setForm] = useState<ActivoInput>(vacio);
  const [nombreTocado, setNombreTocado] = useState(id !== null);
  const [nuevoCliente, setNuevoCliente] = useState<{ nombre: string; apellido: string; telefono: string } | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");

  useEffect(() => {
    if (existente.data) {
      const { idActivo: _omitido, ...resto } = existente.data;
      setForm(resto);
      setNombreTocado(true);
    }
  }, [existente.data]);

  // Taller: el nombre se arma solo con marca y modelo hasta que el usuario lo edite.
  useEffect(() => {
    if (!taller || nombreTocado) return;
    const sugerido = [form.marca, form.modelo].filter(Boolean).join(" ");
    setForm((f) => ({ ...f, nombre: sugerido || null }));
  }, [taller, nombreTocado, form.marca, form.modelo]);

  const estados = useMemo(
    () =>
      (catalogos.data?.estadosActivo ?? []).filter(
        (e) => e.idPadre === null || form.idCategoriaActivo === null || e.idPadre === form.idCategoriaActivo,
      ),
    [catalogos.data, form.idCategoriaActivo],
  );

  const clientes = useMemo(() => catalogos.data?.clientes ?? [], [catalogos.data]);
  const clienteElegido = clientes.find((c) => c.id === form.idCliente) ?? null;

  // Busca por nombre y apellido (todas las palabras, en cualquier orden) o por teléfono (solo dígitos)
  const clientesEncontrados = useMemo(() => {
    const texto = normalizar(busquedaCliente.trim());
    if (!texto) return [];
    const palabras = texto.split(/\s+/);
    const digitos = soloDigitos(texto);
    return clientes
      .filter((c) => {
        const nombre = normalizar(c.descripcion);
        if (palabras.every((p) => nombre.includes(p))) return true;
        return digitos.length >= 3 && soloDigitos(c.extra ?? "").includes(digitos);
      })
      .slice(0, 8);
  }, [clientes, busquedaCliente]);

  function abrirNuevoCliente() {
    // Aprovecha lo que ya se escribió en el buscador
    const texto = busquedaCliente.trim();
    const esTelefono = soloDigitos(texto).length >= 3 && /^[\d\s()+-]+$/.test(texto);
    const [nombre = "", ...resto] = esTelefono || !texto ? [] : texto.split(/\s+/);
    setNuevoCliente({ nombre, apellido: resto.join(" "), telefono: esTelefono ? texto : "" });
  }

  const set = <K extends keyof ActivoInput>(clave: K, valor: ActivoInput[K]) => setForm((f) => ({ ...f, [clave]: valor }));

  const errores = guardar.error instanceof ApiError ? guardar.error.errores : {};
  const errorDe = (campo: string) => errores[campo]?.[0] ?? errores[campo.charAt(0).toUpperCase() + campo.slice(1)]?.[0];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const guardado = await guardar.mutateAsync(form).catch(() => null);
    if (guardado) navigate(`/activos/${guardado.idActivo}`, { replace: true });
  }

  async function agregarCliente() {
    if (!nuevoCliente?.nombre.trim()) return;
    const creado = await crearCliente
      .mutateAsync({
        nombre: nuevoCliente.nombre.trim(),
        apellido: aTexto(nuevoCliente.apellido),
        telefono: aTexto(nuevoCliente.telefono),
        email: null,
      })
      .catch(() => null);
    if (creado) {
      set("idCliente", creado.idCliente);
      setNuevoCliente(null);
      setBusquedaCliente("");
    }
  }

  if ((id && existente.isPending) || catalogos.isPending) return <Cargando />;

  const titulo = `${id ? "Editar" : "Nuevo"} ${t("activo").toLowerCase()}`;

  const campoCliente = (
    <div className="mt-5">
      <span className="label">Cliente</span>
      {nuevoCliente ? (
        <div className="rounded-xl border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold">Nuevo cliente</span>
            <button type="button" onClick={() => setNuevoCliente(null)} aria-label="Cancelar" className="text-muted">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid gap-2">
            <input
              className="field"
              placeholder="Nombre *"
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
            />
            <input
              className="field"
              placeholder="Apellido"
              value={nuevoCliente.apellido}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })}
            />
            <input
              className="field"
              type="tel"
              placeholder="Teléfono"
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
            />
          </div>
          {crearCliente.error && <ErrorCaja error={crearCliente.error} />}
          <Boton type="button" variante="marca" className="mt-3 h-11" cargando={crearCliente.isPending} onClick={agregarCliente}>
            Agregar cliente
          </Boton>
        </div>
      ) : form.idCliente !== null ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{clienteElegido?.descripcion || `Cliente #${form.idCliente}`}</p>
            {clienteElegido?.extra && (
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
                <Phone className="size-3" /> {clienteElegido.extra}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => set("idCliente", null)}
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted active:bg-canvas"
            aria-label="Quitar cliente"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <input
                className="field pl-10"
                type="search"
                autoComplete="off"
                placeholder="Buscar por nombre o teléfono"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={abrirNuevoCliente}
              className="grid size-[50px] shrink-0 place-items-center rounded-xl border border-line active:bg-canvas"
              aria-label="Nuevo cliente"
            >
              <UserPlus className="size-5" />
            </button>
          </div>
          {busquedaCliente.trim() !== "" && (
            <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white">
              {clientesEncontrados.length === 0 ? (
                <button
                  type="button"
                  onClick={abrirNuevoCliente}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] active:bg-canvas"
                >
                  <UserPlus className="size-4 shrink-0 text-muted" />
                  <span>
                    Sin resultados. <span className="font-semibold">Crear cliente nuevo</span>
                  </span>
                </button>
              ) : (
                clientesEncontrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      set("idCliente", c.id);
                      setBusquedaCliente("");
                    }}
                    className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 active:bg-canvas"
                  >
                    <span className="truncate text-[14px] font-semibold">{c.descripcion || "Sin nombre"}</span>
                    {c.extra && <span className="shrink-0 text-[12px] text-muted">{c.extra}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Pantalla>
      <Barra titulo={titulo} volverA={id ? `/activos/${id}` : "/activos"} />

      <form onSubmit={onSubmit} noValidate>
        {taller && (
          <Campo etiqueta={`${t("identificador")} *`} ayuda={t("identificadorAyuda")} error={errorDe("identificador")}>
            <input
              className="field uppercase"
              autoCapitalize="characters"
              placeholder="AE 789 KL"
              value={form.identificador ?? ""}
              onChange={(e) => set("identificador", aTexto(e.target.value.toUpperCase()))}
              required
            />
          </Campo>
        )}

        {taller && campoCliente}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Marca</span>
            <input
              className="field"
              placeholder={taller ? "Toyota" : "Atlas Copco"}
              value={form.marca ?? ""}
              onChange={(e) => set("marca", aTexto(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="label">Modelo</span>
            <input
              className="field"
              placeholder={taller ? "Hilux 2019" : "GA 30"}
              value={form.modelo ?? ""}
              onChange={(e) => set("modelo", aTexto(e.target.value))}
            />
          </label>
        </div>

        <Campo
          etiqueta={taller ? "Descripción *" : "Nombre *"}
          ayuda={taller ? "Se completa con marca y modelo; podés cambiarla." : undefined}
          error={errorDe("nombre")}
        >
          <input
            className="field"
            placeholder={taller ? "Toyota Hilux 2019" : "Compresor C-02"}
            value={form.nombre ?? ""}
            onChange={(e) => {
              setNombreTocado(true);
              set("nombre", aTexto(e.target.value));
            }}
            required
          />
        </Campo>

        {!taller && (
          <Campo etiqueta={t("identificador")} ayuda={t("identificadorAyuda")} error={errorDe("identificador")}>
            <input
              className="field uppercase"
              autoCapitalize="characters"
              placeholder="C-02"
              value={form.identificador ?? ""}
              onChange={(e) => set("identificador", aTexto(e.target.value.toUpperCase()))}
            />
          </Campo>
        )}

        <Campo etiqueta={taller ? "Tipo de vehículo" : "Categoría"}>
          <select
            className="field"
            value={form.idCategoriaActivo ?? ""}
            onChange={(e) => {
              set("idCategoriaActivo", aNumero(e.target.value));
              set("idEstadoActivo", null);
            }}
          >
            <option value="">Sin categoría</option>
            {catalogos.data?.categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descripcion}
              </option>
            ))}
          </select>
        </Campo>

        <div className="mt-5">
          <span className="label">Estado</span>
          <div className="flex flex-wrap gap-2">
            {[{ id: null, descripcion: "Sin estado" }, ...estados].map((e) => {
              const elegido = form.idEstadoActivo === e.id;
              const color = colorEstado(e.id === null ? null : e.descripcion);
              return (
                <button
                  key={e.id ?? "ninguno"}
                  type="button"
                  aria-pressed={elegido}
                  onClick={() => set("idEstadoActivo", e.id)}
                  className={cx(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition",
                    elegido ? color.pill : "border-line bg-white text-ink-soft active:bg-canvas",
                  )}
                >
                  {elegido ? <Check className="size-3.5" /> : <span className={cx("size-2 rounded-full", color.punto)} />}
                  {e.descripcion}
                </button>
              );
            })}
          </div>
        </div>

        {!taller && (
          <Campo etiqueta="Ubicación">
            <select className="field" value={form.idUbicacion ?? ""} onChange={(e) => set("idUbicacion", aNumero(e.target.value))}>
              <option value="">Sin ubicación</option>
              {catalogos.data?.ubicaciones.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.descripcion}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {!taller && campoCliente}

        {guardar.error && <ErrorCaja error={guardar.error} />}

        <Boton
          type="submit"
          className="mt-8"
          cargando={guardar.isPending}
          disabled={!form.nombre || (taller && !form.identificador)}
        >
          {id ? "Guardar cambios" : `Crear ${t("activo").toLowerCase()}`}
        </Boton>
      </form>
    </Pantalla>
  );
}
