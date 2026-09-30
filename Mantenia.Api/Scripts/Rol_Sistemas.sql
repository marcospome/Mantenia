-- Rol "Sistemas": configura lo general (tipos de organización, módulos, textos, estados de orden,
-- prioridades y estados de activo generales) y es el único con acceso al CRUD genérico /api/{tabla}.
-- Se puede correr más de una vez.
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE Descripcion = 'Sistemas')
    INSERT INTO dbo.Rol (Descripcion) VALUES ('Sistemas');

UPDATE dbo.Usuario
SET IdRol = (SELECT TOP 1 IdRol FROM dbo.Rol WHERE Descripcion = 'Sistemas')
WHERE Email = 'mpomeranietz@gmail.com';
