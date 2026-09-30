import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, LoaderCircle, Share2, X } from "lucide-react";
import { Boton } from "./ui";

// Imagen cuadrada-alta pensada para imprimir como etiqueta o mandar por WhatsApp
const ANCHO = 1080;
const MARGEN = 90;
const LADO_QR = ANCHO - MARGEN * 2;
const ALTO_LOGO = 150;
const TINTA = "#111111";
const GRIS = "#7b7b76";
const LINEA = "#e8e8e4";
const FUENTE = `"Poppins", ui-sans-serif, system-ui, sans-serif`;

interface Props {
  /** Texto que va dentro del QR: el identificador, que es lo que busca el escáner */
  codigo: string;
  titulo: string;
  organizacion: string | null;
  logo: string | null;
  onCerrar: () => void;
}

export function QrActivo({ codigo, titulo, organizacion, logo, onCerrar }: Props) {
  const [imagen, setImagen] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);

  useEffect(() => {
    let vivo = true;
    let url: string | null = null;
    generarImagen({ codigo, titulo, organizacion, logo })
      .then((blob) => {
        if (!vivo) return;
        url = URL.createObjectURL(blob);
        setImagen({ url, blob });
      })
      .catch(() => vivo && setError("No se pudo generar el código QR."));
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [codigo, titulo, organizacion, logo]);

  const nombreArchivo = `QR-${codigo.replace(/[^\w-]+/g, "_")}.png`;

  async function compartir() {
    if (!imagen) return;
    const archivo = new File([imagen.blob], nombreArchivo, { type: "image/png" });
    if (navigator.canShare?.({ files: [archivo] })) {
      setCompartiendo(true);
      try {
        await navigator.share({ files: [archivo], title: titulo });
      } catch {
        /* el usuario canceló */
      } finally {
        setCompartiendo(false);
      }
      return;
    }
    descargar();
  }

  function descargar() {
    if (!imagen) return;
    const a = document.createElement("a");
    a.href = imagen.url;
    a.download = nombreArchivo;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Código QR"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">Código QR</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg text-muted active:bg-canvas">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid min-h-64 place-items-center rounded-2xl border border-line bg-canvas p-3">
          {error ? (
            <p className="text-[13px] text-bad">{error}</p>
          ) : imagen ? (
            <img src={imagen.url} alt={`Código QR de ${titulo}`} className="max-h-[55dvh] w-auto rounded-xl bg-white shadow-sm" />
          ) : (
            <LoaderCircle className="size-8 animate-spin text-muted" />
          )}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Boton onClick={compartir} cargando={compartiendo} disabled={!imagen}>
            <Share2 className="size-5 text-brand" /> Compartir
          </Boton>
          <Boton variante="secundario" onClick={descargar} disabled={!imagen} className="w-14 px-0" aria-label="Descargar imagen">
            <Download className="size-5" />
          </Boton>
        </div>
      </div>
    </div>
  );
}

async function generarImagen({ codigo, titulo, organizacion, logo }: Omit<Props, "onCerrar">): Promise<Blob> {
  const [imgLogo] = await Promise.all([cargarLogo(logo), document.fonts?.ready]);

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, codigo, { width: LADO_QR, margin: 0, errorCorrectionLevel: "M", color: { dark: TINTA, light: "#ffffff" } });

  const altoPie = imgLogo || organizacion ? 60 + ALTO_LOGO + MARGEN : MARGEN;
  const alto = MARGEN + 200 + LADO_QR + altoPie;

  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, alto);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Encabezado: nombre del activo y su código
  ctx.fillStyle = TINTA;
  ctx.font = `700 64px ${FUENTE}`;
  ctx.fillText(recortar(ctx, titulo, LADO_QR), ANCHO / 2, MARGEN + 60);
  ctx.fillStyle = GRIS;
  ctx.font = `600 48px ${FUENTE}`;
  ctx.fillText(recortar(ctx, codigo, LADO_QR), ANCHO / 2, MARGEN + 135);

  let y = MARGEN + 200;
  ctx.drawImage(qr, MARGEN, y);
  y += LADO_QR;

  // Pie: logo de la organización (o su nombre si no tiene logo)
  if (imgLogo || organizacion) {
    y += 30;
    ctx.fillStyle = LINEA;
    ctx.fillRect(MARGEN, y, LADO_QR, 3);
    y += 30;
    if (imgLogo) {
      const escala = Math.min(ALTO_LOGO / imgLogo.naturalHeight, (LADO_QR * 0.7) / imgLogo.naturalWidth);
      const w = imgLogo.naturalWidth * escala;
      const h = imgLogo.naturalHeight * escala;
      ctx.drawImage(imgLogo, (ANCHO - w) / 2, y + (ALTO_LOGO - h) / 2, w, h);
    } else if (organizacion) {
      ctx.fillStyle = TINTA;
      ctx.font = `700 56px ${FUENTE}`;
      ctx.textBaseline = "middle";
      ctx.fillText(recortar(ctx, organizacion, LADO_QR), ANCHO / 2, y + ALTO_LOGO / 2);
    }
  }

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}

/** El logo se guarda como URL o como base64; si no carga (o no permite CORS) se usa el nombre. */
function cargarLogo(logo: string | null): Promise<HTMLImageElement | null> {
  const valor = logo?.trim();
  if (!valor) return Promise.resolve(null);
  const src = /^(data:|https?:|blob:|\/)/i.test(valor) ? valor : `data:image/png;base64,${valor}`;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function recortar(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  if (ctx.measureText(texto).width <= max) return texto;
  let t = texto;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}
