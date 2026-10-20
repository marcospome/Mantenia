-- DATOS DE EJEMPLO para TallerApp (SQL Server).
-- Ejecutar UNA sola vez, sobre la base vacía (después de que la API creó las tablas con las migraciones).
-- Carga: 5 tipos de trabajo, 2 talleres con su usuario y sus mecánicos, 6 vehículos y 7 trabajos.
-- Usuarios: laruta / laruta123  y  delsur / delsur123
-- Ejemplo:  sqlcmd -S "localhost\SQLEXPRESS" -U <usuario> -P <clave> -d manteniav1 -f 65001 -i Backend/Data/datos-ejemplo.sql

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;
-- Tipos de trabajo (catálogo común)
INSERT INTO TiposTrabajo (Nombre) VALUES (N'Cambio de aceite'),(N'Frenos'),(N'Alineación y balanceo'),(N'Batería'),(N'Revisión general');

-- Talleres, usuarios y mecánicos
INSERT INTO Talleres (Nombre) VALUES (N'Taller La Ruta'),(N'Mecánica del Sur');
DECLARE @t1 INT = (SELECT Id FROM Talleres WHERE Nombre=N'Taller La Ruta');
DECLARE @t2 INT = (SELECT Id FROM Talleres WHERE Nombre=N'Mecánica del Sur');
INSERT INTO Usuarios (NombreUsuario, ClaveHash, TallerId) VALUES (N'laruta','B9E44631757FFDD76A6B89744DB65962E55A2C965665D9AF37030D56CF7450A8',@t1),(N'delsur','31B1664D6982BC211518FE44E00E6F6E5A35C9F2D691F331691A44FFD28E0BC2',@t2);
INSERT INTO Mecanicos (Nombre, Especialidad, Telefono, TallerId) VALUES
 (N'Pablo Rivas',N'Motor',N'1155550101',@t1),(N'Sofía Ledesma',N'Frenos y suspensión',N'1155550102',@t1),
 (N'Martín Acosta',N'Electricidad',N'1155550201',@t2),(N'Lucía Ferrer',N'Mecánica general',N'1155550202',@t2);

-- Vehículos
INSERT INTO Vehiculos (Patente,Marca,Modelo,Color,Combustible,FechaCompra,PotenciaHp,Propietario,Email,Telefono,TallerId) VALUES
 (N'AB123CD',N'Ford',N'Ranger',N'Rojo',N'Diésel','2022-05-10',200,N'Juan Pérez',N'juan@mail.com',N'1144445555',@t1),
 (N'AC456EF',N'Toyota',N'Corolla',N'Gris',N'Nafta','2021-03-22',140,N'María López',N'maria@mail.com',N'1166667777',@t1),
 (N'AD789GH',N'Renault',N'Kwid',N'Blanco',N'GNC','2020-09-01',66,N'Carlos Díaz',N'carlos@mail.com',N'1177778888',@t1),
 (N'AB123CD',N'Fiat',N'Cronos',N'Azul',N'Nafta','2023-01-15',115,N'Ana Gómez',N'ana@mail.com',N'1133334444',@t2),
 (N'AE111IJ',N'Tesla',N'Model 3',N'Negro',N'Eléctrico','2024-02-02',283,N'Lucía Gómez',N'lucia@mail.com',N'1122223333',@t2),
 (N'AF222KL',N'Toyota',N'Prius',N'Azul',N'Híbrido','2022-11-30',122,N'Roberto Sosa',N'roberto@mail.com',N'1188889999',@t2);

-- Trabajos (en distintos estados)
DECLARE @aceite INT=(SELECT Id FROM TiposTrabajo WHERE Nombre=N'Cambio de aceite'),@frenos INT=(SELECT Id FROM TiposTrabajo WHERE Nombre=N'Frenos'),
        @alin INT=(SELECT Id FROM TiposTrabajo WHERE Nombre=N'Alineación y balanceo'),@bat INT=(SELECT Id FROM TiposTrabajo WHERE Nombre=N'Batería'),
        @rev INT=(SELECT Id FROM TiposTrabajo WHERE Nombre=N'Revisión general');
DECLARE @pablo INT=(SELECT Id FROM Mecanicos WHERE Nombre=N'Pablo Rivas'),@sofia INT=(SELECT Id FROM Mecanicos WHERE Nombre=N'Sofía Ledesma'),
        @martin INT=(SELECT Id FROM Mecanicos WHERE Nombre=N'Martín Acosta'),@lucia INT=(SELECT Id FROM Mecanicos WHERE Nombre=N'Lucía Ferrer');
DECLARE @v1 INT=(SELECT Id FROM Vehiculos WHERE Patente=N'AB123CD' AND TallerId=@t1),@v2 INT=(SELECT Id FROM Vehiculos WHERE Patente=N'AC456EF'),
        @v3 INT=(SELECT Id FROM Vehiculos WHERE Patente=N'AD789GH'),@v4 INT=(SELECT Id FROM Vehiculos WHERE Patente=N'AB123CD' AND TallerId=@t2),
        @v5 INT=(SELECT Id FROM Vehiculos WHERE Patente=N'AE111IJ'),@v6 INT=(SELECT Id FROM Vehiculos WHERE Patente=N'AF222KL');
INSERT INTO Trabajos (VehiculoId,TipoTrabajoId,MecanicoId,Fecha,Descripcion,Costo,Estado) VALUES
 (@v1,@aceite,@pablo,'2026-09-10',N'Service de 10.000 km',45000,N'Finalizado'),
 (@v1,@frenos,@sofia,'2026-10-02',N'Cambio de pastillas delanteras',62000,N'En curso'),
 (@v2,@alin,@pablo,'2026-10-10',N'Alineación completa',28000,N'Finalizado'),
 (@v3,@rev,@sofia,'2026-10-15',N'Revisión pre-viaje',18000,N'Pendiente'),
 (@v4,@aceite,@martin,'2026-09-20',N'Cambio de aceite y filtros',31000,N'Finalizado'),
 (@v5,@bat,@lucia,'2026-10-18',N'Chequeo de batería',35000,N'En curso'),
 (@v6,@rev,@martin,'2026-10-21',N'Revisión general',22000,N'Pendiente');
COMMIT;
SELECT (SELECT COUNT(*) FROM Talleres) AS talleres,(SELECT COUNT(*) FROM Usuarios) AS usuarios,(SELECT COUNT(*) FROM Mecanicos) AS mecanicos,(SELECT COUNT(*) FROM TiposTrabajo) AS tipos,(SELECT COUNT(*) FROM Vehiculos) AS vehiculos,(SELECT COUNT(*) FROM Trabajos) AS trabajos;
