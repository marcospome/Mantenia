-- 1) Activo.IdOrganizacion: el activo pasa a pertenecer a una organización de forma explícita.
-- 2) Accion.Clave: código estable que usa la API para aplicar cada permiso (no cambia aunque se renombre la acción).
-- 3) Acciones nuevas y permisos iniciales por rol.
-- Se puede correr más de una vez.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


-- ------------------------------------------------------------------ 1. Activo.IdOrganizacion
IF COL_LENGTH('dbo.Activo', 'IdOrganizacion') IS NULL
    ALTER TABLE dbo.Activo ADD IdOrganizacion INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Activo_Organizacion')
    ALTER TABLE dbo.Activo ADD CONSTRAINT FK_Activo_Organizacion
        FOREIGN KEY (IdOrganizacion) REFERENCES dbo.Organizacion (IdOrganizacion);
GO

-- Los activos existentes toman la organización de su categoría o, si no tiene, la de su cliente
UPDATE a
SET a.IdOrganizacion = COALESCE(c.IdOrganizacion, cl.IdOrganizacion)
FROM dbo.Activo a
LEFT JOIN dbo.CategoriaActivo c ON c.IdCategoriaActivo = a.IdCategoriaActivo
LEFT JOIN dbo.Cliente cl ON cl.IdCliente = a.IdCliente
WHERE a.IdOrganizacion IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Activo_IdOrganizacion')
    CREATE INDEX IX_Activo_IdOrganizacion ON dbo.Activo (IdOrganizacion);
GO

-- ------------------------------------------------------------------ 2. Accion.Clave
IF COL_LENGTH('dbo.Accion', 'Clave') IS NULL
    ALTER TABLE dbo.Accion ADD Clave VARCHAR(50) NULL;
GO

UPDATE dbo.Accion SET Clave = 'escanear.qr'       WHERE Clave IS NULL AND Descripcion = 'Escanear QR';
UPDATE dbo.Accion SET Clave = 'ordenes.crear'     WHERE Clave IS NULL AND Descripcion = 'Crear Nueva Orden';
UPDATE dbo.Accion SET Clave = 'reportes.exportar' WHERE Clave IS NULL AND Descripcion = 'Exportar PDF Reporte';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Accion_Clave')
    CREATE UNIQUE INDEX UX_Accion_Clave ON dbo.Accion (Clave) WHERE Clave IS NOT NULL;
GO

-- ------------------------------------------------------------------ 3. Acciones nuevas
IF NOT EXISTS (SELECT 1 FROM dbo.Accion WHERE Clave = 'activos.gestionar')
    INSERT INTO dbo.Accion (IdModulo, Descripcion, Version, Clave)
    SELECT IdModulo, 'Crear, editar y eliminar activos', 'v1.0', 'activos.gestionar' FROM dbo.Modulo WHERE Descripcion = 'Activos';

IF NOT EXISTS (SELECT 1 FROM dbo.Accion WHERE Clave = 'ordenes.gestionar')
    INSERT INTO dbo.Accion (IdModulo, Descripcion, Version, Clave)
    SELECT IdModulo, 'Cambiar estado y cargar repuestos', 'v1.0', 'ordenes.gestionar' FROM dbo.Modulo WHERE Descripcion = 'Trabajos';
GO

-- Permisos iniciales: Administrador tiene todo; Técnico también gestiona órdenes.
-- (Sistemas no necesita filas: la API le da todos los permisos.)
INSERT INTO dbo.RolAccion (IdRol, IdAccion)
SELECT r.IdRol, a.IdAccion
FROM dbo.Rol r
JOIN dbo.Accion a ON (r.Descripcion = 'Administrador' AND a.Clave IS NOT NULL)
                  OR (r.Descripcion LIKE 'T_cnico' AND a.Clave = 'ordenes.gestionar')
WHERE NOT EXISTS (SELECT 1 FROM dbo.RolAccion ra WHERE ra.IdRol = r.IdRol AND ra.IdAccion = a.IdAccion);
GO
