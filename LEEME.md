# TallerApp: sistema para talleres mecánicos (API .NET + SQL Server + React)

TP de Programación Avanzada II. Varios talleres mecánicos usan el mismo sistema y **cada taller ve solo lo suyo**.
ABM de **Vehículos** (entidad principal) con **Trabajos** (entidad de relación) que además usan **Mecánicos** y **Tipos de trabajo**.
El manual completo (PDF) se entrega aparte (`Manual del Backend - TallerApp.pdf`).

## Cómo correrlo

Hace falta: **SDK de .NET 10**, **SQL Server** (la instancia `localhost\SQLEXPRESS`) y **Node.js**.

**1. Cadena de conexión.** Copiá `Backend/appsettings.json` a `Backend/appsettings.Development.json` y completá ahí tu usuario y clave de SQL Server (base `manteniav1`). Ese archivo no se sube al repositorio.

**2. API** (puerto 5100). Al arrancar **crea la base `manteniav1` y sus tablas solas** (migraciones):
```
cd Backend
dotnet run
```

**3. Front** (puerto 5173):
```
cd Frontend
npm install
npm run dev
```

Abrir http://localhost:5173. La base arranca **vacía**: se puede **registrar un taller** desde la pantalla de login, y para tener datos de ejemplo (tipos de trabajo, talleres, vehículos y trabajos) ejecutar una vez `Backend/Data/datos-ejemplo.sql` en la base. Con ese script hay dos usuarios de prueba (cada uno es de un taller distinto):

| Usuario | Clave | Taller |
|---|---|---|
| `laruta` | `laruta123` | Taller La Ruta |
| `delsur` | `delsur123` | Mecánica del Sur |

Los **tipos de trabajo** (el combo de los trabajos) vienen en ese script: sin ellos el combo queda vacío.
Para probar la API sin el front: http://localhost:5100/scalar/v1 (hacer `POST /api/autenticacion/login` y pegar el token en «Authorize»).
Para verlo desde el celular (misma red wifi): `npm run dev -- --host` y abrir la dirección «Network».

## Estructura (un solo proyecto, organizado en carpetas)

```
TallerApp/
├── TallerApp.slnx
├── Backend/                     el único proyecto .NET (TallerApp.csproj)
│   ├── Controllers/             PRESENTACIÓN: reciben los pedidos HTTP
│   ├── DTOs/                    los datos que viajan por la API (entran y salen), con sus validaciones
│   ├── Interfaces/              los contratos de Services y Repositories
│   ├── Services/                NEGOCIO: las reglas del sistema
│   ├── Repositories/            DATOS: leen y escriben en la base
│   ├── Models/                  ENTIDADES: una clase por tabla
│   ├── Data/                    DbContext, datos iniciales y Migrations/
│   ├── Validations/             validación propia (la fecha no puede ser futura)
│   ├── OpenApi/                 la pantalla para probar la API
│   └── Program.cs               arranque: registra todo y ordena el pipeline
└── Frontend/                    React (Vite)
```

Flujo de un pedido: `React → Controller → Service → Repository → SQL Server`.
Por la API viajan **DTOs**; entre Service y Repository viajan **Models**.
Un solo proyecto (un solo `.csproj`) porque es más simple de entender y de correr; las capas se separan por carpetas e interfaces.

### Cómo se llaman las cosas

| Termina en | Qué es | Ejemplo |
|---|---|---|
| `Controller` | Atiende una URL y devuelve JSON | `VehiculosController` |
| `Service` | Reglas de negocio | `VehiculoService` (contrato: `IVehiculoService`) |
| `Repository` | Lee y escribe una tabla | `VehiculoRepository` (contrato: `IVehiculoRepository`) |
| `Dto` | Datos que viajan por la API | `VehiculoDto`, `NuevoTrabajoDto` |
| (sin sufijo, en `Models/`) | Una tabla | `Vehiculo`, `Trabajo`, `Taller` |

## Varios talleres: cómo se garantiza que cada uno ve lo suyo

- Existe la tabla `Talleres`. `Usuarios`, `Vehiculos` y `Mecanicos` tienen la columna `TallerId`.
- Al hacer login, el **token** lleva el `tallerId` del usuario.
- `TallerControllerBase.TallerId` lo lee del token y se lo pasa a cada Service y Repository, que **siempre filtran por él**.
- El taller **nunca** viene en el cuerpo del pedido: lo pone el servidor. Los DTOs ni siquiera lo exponen.
- Un id de otro taller responde **404** (como si no existiera). La patente es única **por taller**.

## Base de datos y migraciones

La base se maneja con **migraciones de Entity Framework**: cada cambio en un model se convierte en un archivo versionado.
```
dotnet tool restore                               # una vez: instala dotnet-ef
dotnet ef migrations add NombreDelCambio          # crea la migración (desde la carpeta Backend)
dotnet ef database update                         # aplica las migraciones (la API también lo hace al arrancar)
```

## Reglas de negocio

- La patente no se repite dentro del taller (409) y se guarda en mayúsculas.
- Un trabajo nuevo arranca **Pendiente** y avanza de a un paso: Pendiente → En curso → Finalizado (409 si ya está finalizado).
- El vehículo, el mecánico y el tipo de un trabajo deben existir **y ser del taller** (404).
- No se puede eliminar un mecánico con trabajos asignados (409).
- Al eliminar un vehículo se eliminan sus trabajos.

## Endpoints

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/api/autenticacion/login` | Login: devuelve token, usuario y taller |
| POST | `/api/autenticacion/registro` | Alta de un taller nuevo con su primer usuario |
| GET | `/api/vehiculos?patente=&propietario=` | Listar y buscar por 2 campos |
| GET | `/api/vehiculos/{id}` | Un vehículo con sus trabajos |
| POST | `/api/vehiculos` | Alta |
| PUT | `/api/vehiculos/{id}` | Modificación |
| DELETE | `/api/vehiculos/{id}` | Baja |
| POST | `/api/vehiculos/{id}/trabajos` | Alta de un trabajo asociado al vehículo |
| POST | `/api/trabajos/{id}/avanzar` | Pasa al siguiente estado |
| GET | `/api/trabajos/tipos` | Catálogo para el combo |
| GET / POST / DELETE | `/api/mecanicos` | Listar, alta y baja de mecánicos |
| GET | `/api/panel` | Números del panel principal |

Todos menos login y registro exigen el token (`Authorization: Bearer ...`).

## Dónde está cada requisito del documento

| Requisito | Dónde |
|---|---|
| Alta, modificación, baja | `Controllers/VehiculosController.cs` |
| Listado con buscador de 2 campos | `Listar` (patente y propietario) → `VehiculoRepository.Listar`; pantalla `ListaVehiculos.jsx` |
| Entidad de relación + alta asociada | `Models/Trabajo.cs` (con `VehiculoId`); `CrearTrabajo`; pantalla `DetalleVehiculo.jsx` |
| Login | `AutenticacionController` (JWT); `Login.jsx` |
| 10 campos o más | `DTOs/VehiculoDto.cs` y `Models/Vehiculo.cs` (10 campos de datos más el Id) |
| Combo | `Combustible` (lista en `FormVehiculo.jsx`); además tipo y mecánico en el trabajo |
| Fecha validada | `FechaCompra` con `[FechaNoFutura]` |
| Número de 1 a 1000 | `PotenciaHp` con `[Range(1, 1000)]` |
| Todos obligatorios (data annotations) | `[Required]` en los DTOs; `[ApiController]` responde 400 solo |
| Layout | `Frontend/src/components/Layout.jsx` |
| Partial | `ListaTrabajos.jsx`, `EstadoTrabajo.jsx` y `Campo.jsx` (trozos reutilizables) |
| Arquitectura en capas | Carpetas `Controllers` (Presentación), `Models` (Entidades), `Services` (Negocio) y `Repositories` + `Data` (Datos) |

## Notas para la defensa

- Vite reenvía `/api` a la API (`Frontend/vite.config.js`), así que no hace falta configurar CORS.
- La clave se guarda con SHA-256 para que sea corto de explicar; en producción se usa PBKDF2 o BCrypt con sal.
- `appsettings.Development.json` tiene la clave de la base local: está en `.gitignore` y **no se sube al repositorio**.
