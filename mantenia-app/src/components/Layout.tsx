import { Box, Car, ChartColumn, House, QrCode, Wrench } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { cx } from "./ui";

/** Contenedor de las pantallas principales, con la barra de navegación inferior de los mockups. */
export function LayoutConNav() {
  const { perfil, t, puede } = useAuth();
  const IconoActivo = perfil === "taller" ? Car : Box;

  const items = [
    { to: "/", texto: "Inicio", Icono: House, end: true },
    { to: "/activos", texto: t("activos"), Icono: IconoActivo, end: false },
    { to: "/ordenes", texto: t("ordenes"), Icono: Wrench, end: false },
    { to: "/reportes", texto: "Reportes", Icono: ChartColumn, end: false },
  ];

  const enlace = (item: (typeof items)[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cx("flex flex-1 flex-col items-center gap-1 pt-2 text-[10px]", isActive ? "font-semibold text-ink" : "text-muted")
      }
    >
      {({ isActive }) => (
        <>
          <item.Icono className="size-5" strokeWidth={isActive ? 2.2 : 1.6} />
          <span className="max-w-16 truncate">{item.texto}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className="relative mx-auto min-h-dvh max-w-md bg-white shadow-[0_0_0_1px_var(--color-line)]">
      <main className="pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-start border-t border-line bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
        aria-label="Navegación principal"
      >
        {items.slice(0, 2).map(enlace)}
        {puede("escanear.qr") && (
        <NavLink
          to="/escanear"
          className="flex flex-1 flex-col items-center gap-1 text-[10px] font-semibold text-ink"
          aria-label="Escanear QR"
        >
          <span className="-mt-5 grid size-14 place-items-center rounded-2xl bg-ink text-brand shadow-lg shadow-ink/25">
            <QrCode className="size-7" />
          </span>
          Escanear
        </NavLink>
        )}
        {items.slice(2).map(enlace)}
      </nav>
    </div>
  );
}

/** Contenedor sin navegación inferior (formularios, escáner, login). */
export function LayoutSimple({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <div className={cx("relative mx-auto min-h-dvh max-w-md", oscuro ? "bg-ink" : "bg-white shadow-[0_0_0_1px_var(--color-line)]")}>
      <Outlet />
    </div>
  );
}
