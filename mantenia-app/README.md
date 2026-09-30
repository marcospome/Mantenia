# MantenIA · App mobile

App web mobile-first (React + TypeScript) que consume `Mantenia.Api`. Sigue los mockups v1.0 (planta) y v1.1 (taller): la misma app cambia textos, íconos e indicadores según el tipo de organización del usuario logueado.

## Levantarla

Requisitos: Node 20+ y la API corriendo en `http://localhost:5080`.

```bash
cd mantenia-app
npm install
npm run dev
```

Abrí `http://localhost:5173`. En desarrollo, Vite reenvía `/api` a la API, así que no hace falta configurar CORS.

### Probar en el celular

El celular tiene que estar en la misma red Wi-Fi que la computadora.

- `npm run dev` y entrá a `http://<IP-de-tu-PC>:5173`. Todo funciona salvo la cámara: los navegadores solo la habilitan con HTTPS.
- Para escanear QR con la cámara: `npm run dev:https` y entrá a `https://<IP-de-tu-PC>:5173`. El navegador va a avisar que el certificado no es de confianza (es local); aceptalo una vez.

Desde el navegador del celular se puede "Agregar a pantalla de inicio" y se abre como app.

## Pantallas

| Mockup | Ruta | Qué hace |
|---|---|---|
| 1. Login | `/login` | JWT de 24 h guardado en el dispositivo |
| 2. Inicio | `/` | Alerta predictiva, resumen del día, próximas revisiones / trabajos en curso |
| 3. Escaneo QR | `/escanear` | Cámara trasera + linterna; busca por el campo `Identificador` (o ingreso manual) |
| 4. Ficha | `/activos/:id` | MTBF, próxima falla o km al service, sugerencia, historial, reportar falla |
| 5. Orden de trabajo | `/ordenes/nueva` | Planta: tipo de problema, prioridad, descripción. Taller: km, tipo, diagnóstico, repuestos |
| 6. ABM | `/activos`, `/activos/nuevo`, `/activos/:id/editar` | Búsqueda, filtros, alta/edición/baja; en taller permite crear el cliente en el momento |
| 7. Reportes | `/reportes` | Gráfico mensual, costos, críticos / clientes para contactar, exportar a PDF (impresión) |
| Extra | `/ordenes`, `/ordenes/:id`, `/perfil` | Listado y detalle de órdenes con cambio de estado; perfil y cambio de clave |

## Planta o taller

Lo decide la API (`GET /api/app/contexto`):

- Si la descripción del `TipoOrganizacion` de la organización contiene "taller", "mecánico", "automotor" o "vehículo" → perfil **taller**. Si no → **planta**.
- Se puede forzar cargando en `LabelTipoOrganizacionModulo` la clave `perfil` con valor `taller` o `planta`.
- Cualquier texto de la app se puede cambiar desde esa misma tabla usando las claves de `src/lib/labels.ts` (por ejemplo `activos` → `Equipos`).

## De dónde salen los indicadores

La base no tiene columnas de MTBF, kilometraje ni predicciones, así que la API los calcula con el historial de órdenes:

- **Falla vs. preventivo:** un `TipoTrabajo` es preventivo si su nombre incluye service, inspección, lubricación, revisión, aceite, filtro, alineación, balanceo, control, calibración, limpieza o rutina. El resto cuenta como falla. Conviene nombrar los tipos de trabajo con eso en mente.
- **MTBF** = días desde la primera orden del activo / cantidad de fallas.
- **Probabilidad / próxima falla** = días desde la última falla comparados con el MTBF. ≥ 80 % es "en riesgo", ≥ 60 % "revisar".
- **Taller:** el kilometraje de ingreso se guarda al principio de la descripción de la orden (`Km ingreso: 128400`). El próximo service se estima cada 10.000 km desde el último trabajo preventivo; si se pasó, el vehículo queda "vencido".
- **Downtime** = horas entre inicio y cierre de las órdenes de falla. El inicio y el cierre se completan solos al cambiar el estado de la orden.
- **Costo / facturado** = importe de la orden + repuestos (cantidad × costo).

La "sugerencia" de la ficha es una regla sobre esos números, no un modelo de IA.

## Producción

```bash
npm run build
```

Genera `dist/`, una web estática. Se puede publicar en cualquier hosting (Netlify, Vercel, IIS, Nginx) configurando que las rutas desconocidas devuelvan `index.html`. Si la API queda en otro dominio, definí `VITE_API_URL` antes del build y agregá ese dominio a `Cors:Origenes` en la API.

## Estructura

```
src/
├── api/          client.ts (fetch + token + errores), hooks.ts (TanStack Query), types.ts
├── auth/         AuthContext: sesión, contexto del usuario, perfil y textos
├── components/   Layout (nav inferior), ui (botones, chips, filas, stats...), badges
├── lib/          labels.ts (textos por perfil), format.ts (números, fechas, pesos)
└── pages/        Una pantalla por archivo
```
