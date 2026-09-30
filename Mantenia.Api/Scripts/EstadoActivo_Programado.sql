-- Estado "Programado": activos con mantenimientos periódicos agendados
-- (ej. una máquina con service diario o un auto que cambia el aceite cada año).
-- IdCategoriaActivo NULL = disponible para todas las categorías. Se puede correr más de una vez.
IF NOT EXISTS (SELECT 1 FROM dbo.EstadoActivo WHERE Descripcion = 'Programado' AND IdCategoriaActivo IS NULL)
    INSERT INTO dbo.EstadoActivo (IdCategoriaActivo, Descripcion) VALUES (NULL, 'Programado');
