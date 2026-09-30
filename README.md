# MantenIA

- `Mantenia.Api/`: API REST en .NET 10 (este documento).
- `mantenia-app/`: app mobile en React que la consume (ver `mantenia-app/README.md`).

## Mantenia.Api

API REST en .NET 10 sobre la base `ManteniaDB` existente (SQL Server), con autenticación JWT.
Expone solo lo que usa la app: endpoints por pantalla que combinan tablas y filtran por la organización del usuario.

## Requisitos

- .NET 10 SDK
- SQL Server con la base `ManteniaDB` ya creada (la API **no** crea ni modifica tablas: no usa migraciones)

## Cómo levantarla

```bash
cd Mantenia.Api
dotnet restore
dotnet run --launch-profile http
```

Se abre `http://localhost:5080/scalar/v1`, una interfaz para probar todos los endpoints.
También está `Mantenia.Api.http` con ejemplos listos para Visual Studio / VS Code (extensión REST Client).

## Primer uso

1. `POST /api/auth/registro` con nombre, email y clave (mínimo 8 caracteres) → crea el usuario con la clave hasheada y devuelve el token.
2. `POST /api/auth/login` → devuelve `{ token, expiraUtc, usuario }`. El token dura **24 horas**.
3. En Scalar, botón **Authentication** → pegá el token. Fuera de Scalar, mandalo en el header `Authorization: Bearer <token>`.
4. Una vez creados los usuarios necesarios, poné `Auth:PermitirRegistro` en `false` para cerrar el alta pública.

> Si en la tabla `Usuario` ya había claves cargadas en texto plano, esos usuarios **no van a poder loguearse**:
> el login solo acepta claves hasheadas. Creales la clave de nuevo desde la API.

## Endpoints

Todos requieren token salvo `login` y `registro`. Algunos además exigen rol (ver [Roles](#roles)).

| Autenticación (`/api/auth`) | |
|---|---|
| `POST /api/auth/login` | Login (anónimo) → `{ token, expiraUtc }` |
| `POST /api/auth/registro` | Alta de usuario con la clave hasheada (anónimo, si `Auth:PermitirRegistro` = true) |
| `POST /api/auth/cambiar-clave` | Cambia la clave propia (pide la actual) |

### App (`/api/app`)

Filtran por la organización del usuario logueado.

| Método | Ruta | |
|---|---|---|
| GET | `/api/app/contexto` | Usuario, organización, perfil (`planta`/`taller`), plan, textos y permisos |
| GET | `/api/app/catalogos` | Listas para formularios |
| GET | `/api/app/dashboard` | Resumen, alerta predictiva, próximas órdenes y en curso |
| GET | `/api/app/reportes?meses=6` | Serie mensual, costos, críticos, clientes a contactar |
| GET | `/api/app/activos?buscar=&filtro=riesgo\|revisar\|detenidos` | Activos con MTBF, riesgo, km y sugerencia |
| GET | `/api/app/activos/{id}` | Ficha con historial |
| GET | `/api/app/activos/codigo/{codigo}` | Busca por `Identificador` (lectura del QR) |
| GET | `/api/app/activos/{id}/edicion` | Campos editables del activo |
| POST / PUT / DELETE | `/api/app/activos[/{id}]` | Alta, edición y baja (409 si tiene órdenes) |
| POST | `/api/app/clientes` | Alta rápida de cliente en la organización |
| GET | `/api/app/ordenes?estado=abiertas\|cerradas\|todas&idActivo=` | Órdenes |
| GET | `/api/app/ordenes/{id}` | Detalle con repuestos y estados posibles |
| POST | `/api/app/ordenes` | Crea orden + repuestos a nombre del usuario |
| PUT | `/api/app/ordenes/{id}/estado` | Cambia estado y completa inicio/cierre |
| POST | `/api/app/ordenes/{id}/repuestos` | Agrega un repuesto |
| PUT / DELETE | `/api/app/ordenes/repuestos/{idDetalle}` | Edita / quita un repuesto |
| GET/POST/PUT/DELETE | `/api/app/ajustes/...` | Categorías de la organización, sus estados y tipos de trabajo (Administrador o Sistemas) |
| GET/POST/PUT/DELETE | `/api/app/sistemas/...` | Tipos de organización (módulos y textos), estados de orden, prioridades, estados generales, roles y permisos (Sistemas) |

### Roles y permisos

- **Sistemas**: configura lo general (`/api/app/sistemas`), incluidos los roles y sus permisos. Tiene todos los permisos siempre.
  Se crea con `Mantenia.Api/Scripts/Rol_Sistemas.sql`.
- **Administrador**: configura los catálogos de su propia organización (`/api/app/ajustes`).
- Sistemas y Administrador están protegidos: no se renombran ni borran (la API depende de esos nombres).
- **Permisos por módulo**: cada fila de `Accion` tiene una `Clave` que la API aplica; `RolAccion` dice qué rol tiene cada una.
  Un usuario sin rol puede consultar pero no modificar.

| Clave | Módulo | Qué habilita |
|---|---|---|
| `escanear.qr` | Escanear | Buscar un activo por QR |
| `ordenes.crear` | Trabajos | Crear órdenes |
| `ordenes.gestionar` | Trabajos | Cambiar estado y cargar repuestos |
| `activos.gestionar` | Activos | Crear, editar y eliminar activos y dar de alta clientes |
| `reportes.exportar` | Reportes | Exportar el reporte a PDF |

- El rol, los permisos y la organización se leen de la base en cada request: un cambio aplica sin volver a iniciar sesión.
- `Activo.IdOrganizacion` define a qué organización pertenece cada activo (script `Activo_Organizacion_y_Permisos.sql`).

Cómo se calculan los indicadores: ver `mantenia-app/README.md`.

Detalles de negocio:

- `Usuario`: la clave llega como `clave` y se guarda en `ClaveHash` (PBKDF2 de ASP.NET Core Identity). `ClaveHash` nunca se devuelve. El email es único.
- `OrdenTrabajo.FechaCreacion` y `OrdenTrabajoDetalle.FechaCreacion` las completa el servidor al crear.
- Los errores se devuelven en formato ProblemDetails (`title`, `detail`, `status`).

## Estructura

```
Mantenia.Api/
├── Program.cs          Arranque: servicios, CORS, autenticación y controllers
├── Controllers/        AuthController, AppController (pantallas), AjustesController, SistemasController
├── DTOs/               AuthDtos + App/ (lo que recibe y devuelve cada endpoint)
├── Services/           AuthService, TokenService (JWT), PasswordHasherService
│   └── App/            Lógica de cada pantalla + DatosOrganizacion (filtro por organización),
│                       Indicadores (MTBF, riesgo, km) y Permisos (roles Sistemas / Administrador)
├── Interfaces/         Contratos de los servicios
├── Entities/           Una clase por tabla usada, con navegaciones por FK
├── Data/               ManteniaDbContext + Configurations/ (mapeo Fluent API de cada tabla)
├── Middleware/         GlobalExceptionHandler (errores → ProblemDetails)
├── Extensions/         Registro de dependencias, JWT y políticas de autorización
├── Configuration/      Opciones de Jwt y Auth (appsettings)
├── OpenApi/            Esquema Bearer para Scalar
└── Scripts/            SQL de cambios y datos iniciales (rol Sistemas, estado Programado,
                        Activo.IdOrganizacion, claves de permisos)
```

Flujo de un request: **Controller** → **Service** (valida que sea de la organización, aplica reglas) → **DbContext** (EF Core) → SQL Server.

## Configuración y seguridad

- `appsettings.Development.json` tiene la cadena de conexión y una clave JWT aleatoria **solo para desarrollo**.
- Para producción, cargá `ConnectionStrings:ConexionSql` y `Jwt:Key` (mínimo 32 caracteres) por variables de entorno o user-secrets; no las subas al repositorio:

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:ConexionSql" "Server=...;Database=ManteniaDB;..."
dotnet user-secrets set "Jwt:Key" "una-clave-larga-y-aleatoria-de-al-menos-32-caracteres"
```

- La API no arranca si `Jwt:Key` falta o es corta.
- `Cors:Origenes` define qué frontends pueden llamar a la API.
