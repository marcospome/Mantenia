import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOff, Flashlight, FlashlightOff, LoaderCircle, X } from "lucide-react";
import { buscarPorCodigo } from "../api/hooks";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Barra, Boton, cx } from "../components/ui";

const LECTOR_ID = "qr-reader";

export default function Escanear() {
  const { t } = useAuth();
  const navigate = useNavigate();

  const [intento, setIntento] = useState(0);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [camaraLista, setCamaraLista] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [linterna, setLinterna] = useState<{ soportada: boolean; encendida: boolean }>({ soportada: false, encendida: false });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const resolver = useCallback(
    async (texto: string) => {
      setBuscando(true);
      setMensaje(null);
      try {
        const encontrado = await buscarPorCodigo(texto);
        navigate(`/activos/${encontrado.idActivo}?origen=qr`, { replace: true });
      } catch (e) {
        setMensaje(
          e instanceof ApiError && e.status === 404
            ? `No encontramos ningún ${t("activo").toLowerCase()} con el código “${texto}”.`
            : e instanceof Error
              ? e.message
              : "No se pudo buscar el código.",
        );
        setBuscando(false);
      }
    },
    [navigate, t],
  );

  // Referencia estable para usar dentro del callback del escáner
  const resolverRef = useRef(resolver);
  resolverRef.current = resolver;

  useEffect(() => {
    if (!window.isSecureContext) {
      setErrorCamara("La cámara solo funciona con HTTPS (o en localhost). Ingresá el código a mano.");
      return;
    }

    let vivo = true;
    let leido = false;
    const scanner = new Html5Qrcode(LECTOR_ID, { verbose: false });
    scannerRef.current = scanner;
    setCamaraLista(false);
    setErrorCamara(null);

    const inicio = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10 },
        (texto) => {
          if (leido || !vivo) return;
          leido = true;
          try {
            scanner.pause(true);
          } catch {
            /* ignorar */
          }
          navigator.vibrate?.(60);
          void resolverRef.current(texto);
        },
        () => {
          /* frame sin QR: se ignora */
        },
      )
      .then(() => {
        if (!vivo) return;
        const videoLector = document.querySelector<HTMLVideoElement>(`#${LECTOR_ID} video`);
        const visor = videoRef.current;
        if (videoLector && visor) {
          visor.srcObject = videoLector.srcObject;
          void visor.play().catch(() => undefined);
        }
        setCamaraLista(true);
        try {
          const capacidades = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          setLinterna({ soportada: Boolean(capacidades.torch), encendida: false });
        } catch {
          setLinterna({ soportada: false, encendida: false });
        }
      })
      .catch((err: unknown) => {
        if (!vivo) return;
        const texto = String(err);
        setErrorCamara(
          /NotAllowed|Permission/i.test(texto)
            ? "No diste permiso para usar la cámara. Habilitalo en el navegador o ingresá el código a mano."
            : /NotFound|no camera|Requested device/i.test(texto)
              ? "No encontramos una cámara en este dispositivo."
              : "No se pudo iniciar la cámara.",
        );
      });

    return () => {
      vivo = false;
      scannerRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      void inicio
        .then(() => (scanner.isScanning ? scanner.stop() : undefined))
        .catch(() => undefined)
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            /* ignorar */
          }
        });
    };
  }, [intento]);

  async function alternarLinterna() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    const encendida = !linterna.encendida;
    try {
      await scanner.applyVideoConstraints({ advanced: [{ torch: encendida } as unknown as MediaTrackConstraintSet] });
      setLinterna({ soportada: true, encendida });
    } catch {
      setLinterna({ soportada: false, encendida: false });
    }
  }

  function reintentar() {
    setMensaje(null);
    setBuscando(false);
    setIntento((i) => i + 1);
  }

  function onManual(e: FormEvent) {
    e.preventDefault();
    if (codigo.trim()) void resolver(codigo.trim());
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink text-white">
      {/* Video de la cámara */}
      {/* El lector decodifica con su video a tamaño natural (invisible); mostramos el mismo stream a pantalla completa */}
      <div id={LECTOR_ID} className="pointer-events-none absolute inset-x-0 top-0 opacity-0" aria-hidden />
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className={cx("absolute inset-0 size-full object-cover transition-opacity", camaraLista ? "opacity-60" : "opacity-0")}
      />

      <div className="relative z-10 flex flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Barra
          oscuro
          volverA="/"
          titulo={t("escanearTitulo")}
          derecha={
            linterna.soportada && (
              <button
                type="button"
                onClick={alternarLinterna}
                className="grid size-10 place-items-center rounded-xl active:bg-white/10"
                aria-label={linterna.encendida ? "Apagar linterna" : "Encender linterna"}
              >
                {linterna.encendida ? <FlashlightOff className="size-5" /> : <Flashlight className="size-5" />}
              </button>
            )
          }
        />

        {/* Marco de escaneo */}
        <div className="mt-10 flex justify-center">
          <div className="relative aspect-square w-64">
            <span className="absolute top-0 left-0 size-10 rounded-tl-xl border-t-4 border-l-4 border-brand" />
            <span className="absolute top-0 right-0 size-10 rounded-tr-xl border-t-4 border-r-4 border-brand" />
            <span className="absolute bottom-0 left-0 size-10 rounded-bl-xl border-b-4 border-l-4 border-brand" />
            <span className="absolute right-0 bottom-0 size-10 rounded-br-xl border-r-4 border-b-4 border-brand" />
            {errorCamara ? (
              <div className="absolute inset-0 grid place-items-center text-white/40">
                <CameraOff className="size-14" />
              </div>
            ) : buscando ? (
              <div className="absolute inset-0 grid place-items-center">
                <LoaderCircle className="size-10 animate-spin text-brand" />
              </div>
            ) : (
              <span className="absolute inset-x-6 top-1/2 h-0.5 animate-pulse rounded-full bg-brand shadow-[0_0_12px_var(--color-brand)]" />
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[16px] font-semibold">{buscando ? "Buscando…" : t("escanearApunta")}</p>
          <p className="mt-1 text-[13px] text-white/60">{errorCamara ?? t("escanearAyuda")}</p>
        </div>

        {mensaje && (
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-center text-[13px]">
            <p>{mensaje}</p>
            {!errorCamara && (
              <button type="button" onClick={reintentar} className="mt-2 font-semibold text-brand">
                Escanear de nuevo
              </button>
            )}
          </div>
        )}

        <div className="mt-auto pt-8">
          {manual ? (
            <form onSubmit={onManual} className="rounded-2xl bg-white p-4 text-ink">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] font-semibold">{t("escanearManual")}</span>
                <button type="button" onClick={() => setManual(false)} aria-label="Cerrar" className="text-muted">
                  <X className="size-5" />
                </button>
              </div>
              <input
                className="field uppercase"
                autoFocus
                autoCapitalize="characters"
                placeholder={t("identificador")}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              <Boton type="submit" className="mt-3" cargando={buscando} disabled={!codigo.trim()}>
                Buscar
              </Boton>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setManual(true)}
              className="h-12 w-full rounded-xl border border-white/25 text-[15px] font-semibold active:bg-white/10"
            >
              {t("escanearManual")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
