import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { guardarSesion, leerSesion, onSesionExpirada } from "../api/client";
import { login as loginApi, useContexto } from "../api/hooks";
import type { Contexto, Perfil, Permiso } from "../api/types";
import { crearTraductor, type Traductor } from "../lib/labels";

const PERFIL_KEY = "mantenia.perfil";

interface AuthValue {
  autenticado: boolean;
  contexto: Contexto | undefined;
  cargandoContexto: boolean;
  errorContexto: Error | null;
  perfil: Perfil;
  t: Traductor;
  /** ¿El rol del usuario tiene esta acción? (la API también lo valida) */
  puede: (permiso: Permiso) => boolean;
  ingresar: (email: string, clave: string) => Promise<void>;
  salir: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function perfilGuardado(): Perfil {
  try {
    return localStorage.getItem(PERFIL_KEY) === "taller" ? "taller" : "planta";
  } catch {
    return "planta";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [autenticado, setAutenticado] = useState(() => leerSesion() !== null);
  const contextoQuery = useContexto(autenticado);
  const contexto = contextoQuery.data;

  const salir = useCallback(() => {
    guardarSesion(null);
    setAutenticado(false);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    onSesionExpirada(salir);
    return () => onSesionExpirada(null);
  }, [salir]);

  // Recuerda el último perfil para mostrar el login correcto la próxima vez.
  useEffect(() => {
    if (!contexto) return;
    try {
      localStorage.setItem(PERFIL_KEY, contexto.perfil);
      localStorage.setItem("mantenia.plan", contexto.plan ?? "");
    } catch {
      /* ignorar */
    }
  }, [contexto]);

  const ingresar = useCallback(
    async (email: string, clave: string) => {
      const respuesta = await loginApi(email, clave);
      guardarSesion({ token: respuesta.token, expiraUtc: respuesta.expiraUtc });
      queryClient.clear();
      setAutenticado(true);
    },
    [queryClient],
  );

  const value = useMemo<AuthValue>(() => {
    const perfil = contexto?.perfil ?? perfilGuardado();
    return {
      autenticado,
      contexto,
      cargandoContexto: contextoQuery.isPending && autenticado,
      errorContexto: contextoQuery.error,
      perfil,
      t: crearTraductor(perfil, contexto?.labels),
      puede: (permiso: Permiso) => contexto?.permisos.includes(permiso) ?? false,
      ingresar,
      salir,
    };
  }, [autenticado, contexto, contextoQuery.isPending, contextoQuery.error, ingresar, salir]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
