import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { Wrench } from "lucide-react";
import type { Permiso } from "./api/types";
import { useAuth } from "./auth/AuthContext";
import { LayoutConNav, LayoutSimple } from "./components/Layout";
import { Boton, ErrorCaja } from "./components/ui";
import ActivoFicha from "./pages/ActivoFicha";
import ActivoForm from "./pages/ActivoForm";
import Ajustes from "./pages/Ajustes";
import Activos from "./pages/Activos";
import Escanear from "./pages/Escanear";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import NuevaOrden from "./pages/NuevaOrden";
import OrdenDetalle from "./pages/OrdenDetalle";
import Ordenes from "./pages/Ordenes";
import Perfil from "./pages/Perfil";
import Reportes from "./pages/Reportes";
import Sistemas from "./pages/Sistemas";

/** Solo deja pasar con sesión iniciada y el contexto (perfil planta/taller) cargado. */
function RequiereSesion() {
  const { autenticado, cargandoContexto, errorContexto, salir } = useAuth();
  const location = useLocation();

  if (!autenticado) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;

  if (cargandoContexto) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white">
        <div className="grid size-14 animate-pulse place-items-center rounded-2xl bg-ink text-brand">
          <Wrench className="size-6" />
        </div>
      </div>
    );
  }

  if (errorContexto) {
    return (
      <div className="mx-auto max-w-md px-6 pt-24">
        <ErrorCaja error={errorContexto} reintentar={() => window.location.reload()} />
        <Boton variante="secundario" onClick={salir}>
          Volver al login
        </Boton>
      </div>
    );
  }

  return <Outlet />;
}

/** Sin el permiso, vuelve al inicio (la API igual rechazaría la operación). */
function RequierePermiso({ permiso }: { permiso: Permiso }) {
  const { puede } = useAuth();
  return puede(permiso) ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutSimple />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<RequiereSesion />}>
        <Route element={<LayoutConNav />}>
          <Route index element={<Inicio />} />
          <Route path="/activos" element={<Activos />} />
          <Route path="/activos/:id" element={<ActivoFicha />} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/ordenes/:id" element={<OrdenDetalle />} />
          <Route path="/reportes" element={<Reportes />} />
        </Route>

        <Route element={<LayoutSimple />}>
          <Route element={<RequierePermiso permiso="activos.gestionar" />}>
            <Route path="/activos/nuevo" element={<ActivoForm />} />
            <Route path="/activos/:id/editar" element={<ActivoForm />} />
          </Route>
          <Route element={<RequierePermiso permiso="ordenes.crear" />}>
            <Route path="/ordenes/nueva" element={<NuevaOrden />} />
          </Route>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/sistemas" element={<Sistemas />} />
        </Route>

        <Route element={<LayoutSimple oscuro />}>
          <Route element={<RequierePermiso permiso="escanear.qr" />}>
            <Route path="/escanear" element={<Escanear />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
