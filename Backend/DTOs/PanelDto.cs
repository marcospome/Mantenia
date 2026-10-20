namespace TallerApp.DTOs;

// Datos del panel principal. NO es una tabla: se calcula con los trabajos y se manda al front.
// Un "record" es una ficha de datos que no se modifica una vez creada.
public record PanelDto(
    int Vehiculos,
    int Mecanicos,
    int Pendientes,
    int EnCurso,
    int Finalizados,
    decimal Ingresos,                    // suma de los trabajos finalizados
    List<ItemPanelDto> PorTipo,          // cuántos trabajos hay de cada tipo
    List<UltimoTrabajoDto> Ultimos);     // los 5 más recientes

public record ItemPanelDto(string Nombre, int Cantidad);

public record UltimoTrabajoDto(int VehiculoId, string Patente, string Tipo, string Mecanico, string Estado,
 DateTime Fecha, decimal Costo);
