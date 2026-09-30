using Mantenia.Api.Common;
using Mantenia.Api.Data;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

public sealed class ActivosAppService(ManteniaDbContext db, DatosOrganizacion datos, ICurrentUser usuarioActual) : IActivosAppService
{
    // ------------------------------------------------------------ Alta, edición y baja

    public async Task<ActivoEdicionDto?> GetEdicionAsync(int idActivo, CancellationToken ct = default)
        => await datos.ActivosQuery()
            .Where(a => a.IdActivo == idActivo)
            .Select(a => new ActivoEdicionDto(
                a.IdActivo, a.IdCategoriaActivo, a.IdCliente, a.IdUbicacion, a.IdEstadoActivo, a.Identificador, a.Nombre, a.Marca, a.Modelo))
            .FirstOrDefaultAsync(ct);

    public async Task<ActivoEdicionDto> CrearAsync(ActivoGuardarDto dto, CancellationToken ct = default)
    {
        await ValidarReferenciasAsync(dto, ct);
        var activo = new Activo { IdOrganizacion = usuarioActual.IdOrganizacion };
        Aplicar(dto, activo);
        db.Activos.Add(activo);
        await db.SaveChangesAsync(ct);
        return (await GetEdicionAsync(activo.IdActivo, ct))!;
    }

    public async Task<ActivoEdicionDto?> GuardarAsync(int idActivo, ActivoGuardarDto dto, CancellationToken ct = default)
    {
        if (!await datos.ActivosQuery().AnyAsync(a => a.IdActivo == idActivo, ct))
        {
            return null;
        }

        await ValidarReferenciasAsync(dto, ct);
        var activo = await db.Activos.FirstAsync(a => a.IdActivo == idActivo, ct);
        Aplicar(dto, activo);
        await db.SaveChangesAsync(ct);
        return await GetEdicionAsync(idActivo, ct);
    }

    public async Task<bool> EliminarAsync(int idActivo, CancellationToken ct = default)
    {
        if (!await datos.ActivosQuery().AnyAsync(a => a.IdActivo == idActivo, ct))
        {
            return false;
        }

        var ordenes = await db.OrdenesTrabajo.CountAsync(o => o.IdActivo == idActivo, ct);
        if (ordenes > 0)
        {
            throw new ConflictException($"No se puede eliminar: tiene {ordenes} orden(es) de trabajo en su historial.");
        }

        db.Activos.Remove(await db.Activos.FirstAsync(a => a.IdActivo == idActivo, ct));
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<ClienteDto> CrearClienteAsync(ClienteCrearDto dto, CancellationToken ct = default)
    {
        var cliente = new Cliente
        {
            IdOrganizacion = usuarioActual.IdOrganizacion
                ?? throw new ConflictException("Tu usuario no pertenece a ninguna organización."),
            Nombre = dto.Nombre.Trim(),
            Apellido = Texto(dto.Apellido),
            Telefono = Texto(dto.Telefono),
            Email = Texto(dto.Email),
        };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync(ct);
        return new ClienteDto(cliente.IdCliente, cliente.Nombre, cliente.Apellido, cliente.Telefono, cliente.Email);
    }

    /// <summary>La categoría, el cliente y el estado elegidos tienen que ser de la organización del usuario.</summary>
    private async Task ValidarReferenciasAsync(ActivoGuardarDto dto, CancellationToken ct)
    {
        var org = usuarioActual.IdOrganizacion
            ?? throw new ConflictException("Tu usuario no pertenece a ninguna organización.");

        if (dto.IdCategoriaActivo is int idCategoria
            && !await db.CategoriasActivo.AnyAsync(c => c.IdCategoriaActivo == idCategoria && c.IdOrganizacion == org, ct))
        {
            throw new ConflictException("La categoría elegida no existe.");
        }

        if (dto.IdCliente is int idCliente
            && !await db.Clientes.AnyAsync(c => c.IdCliente == idCliente && c.IdOrganizacion == org, ct))
        {
            throw new ConflictException("El cliente elegido no existe.");
        }

        if (dto.IdEstadoActivo is int idEstado
            && !await db.EstadosActivo.AnyAsync(e => e.IdEstadoActivo == idEstado
                && (e.IdCategoriaActivo == null || e.IdCategoriaActivo == dto.IdCategoriaActivo), ct))
        {
            throw new ConflictException("El estado elegido no corresponde a la categoría.");
        }

        if (dto.IdUbicacion is int idUbicacion && !await db.Ubicaciones.AnyAsync(u => u.IdUbicacion == idUbicacion, ct))
        {
            throw new ConflictException("La ubicación elegida no existe.");
        }
    }

    private static void Aplicar(ActivoGuardarDto dto, Activo activo)
    {
        activo.IdCategoriaActivo = dto.IdCategoriaActivo;
        activo.IdCliente = dto.IdCliente;
        activo.IdUbicacion = dto.IdUbicacion;
        activo.IdEstadoActivo = dto.IdEstadoActivo;
        activo.Identificador = Texto(dto.Identificador)?.ToUpperInvariant();
        activo.Nombre = dto.Nombre.Trim();
        activo.Marca = Texto(dto.Marca);
        activo.Modelo = Texto(dto.Modelo);
    }

    private static string? Texto(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    // ------------------------------------------------------------ Consultas

    public async Task<ActivosListadoDto> ListarAsync(string? buscar, string? filtro, CancellationToken ct = default)
    {
        var snapshot = await datos.CargarAsync(ct);
        var todos = snapshot.Activos.Select(snapshot.Resumen).ToList();

        IEnumerable<ActivoResumenDto> items = todos;

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var texto = buscar.Trim();
            items = items.Where(a =>
                Contiene(a.Nombre, texto) || Contiene(a.Identificador, texto) || Contiene(a.Cliente, texto)
                || Contiene(a.Marca, texto) || Contiene(a.Modelo, texto));
        }

        items = filtro?.ToLowerInvariant() switch
        {
            "riesgo" => items.Where(a => a.Salud.Nivel == "riesgo"),
            "revisar" => items.Where(a => a.Salud.Nivel == "revisar"),
            "detenidos" => items.Where(a => a.Salud.Detenido),
            _ => items,
        };

        var ordenados = items
            .OrderBy(a => a.Salud.Nivel switch { "riesgo" => 0, "revisar" => 1, _ => 2 })
            .ThenBy(a => a.Nombre)
            .ToList();

        return new ActivosListadoDto(
            ordenados,
            todos.Count,
            todos.Count(a => a.Salud.Nivel == "riesgo"),
            todos.Count(a => a.Salud.Nivel == "revisar"),
            todos.Count(a => a.Salud.Detenido));
    }

    public async Task<ActivoFichaDto?> GetFichaAsync(int idActivo, CancellationToken ct = default)
    {
        var snapshot = await datos.CargarAsync(ct);
        if (!snapshot.PorId.TryGetValue(idActivo, out var activo))
        {
            return null;
        }

        var historial = snapshot.OrdenesPorActivo[idActivo]
            .OrderByDescending(o => o.FechaCreacion)
            .Select(snapshot.Orden)
            .ToList();

        return new ActivoFichaDto(snapshot.Resumen(activo), historial);
    }

    public async Task<CodigoEncontradoDto?> BuscarPorCodigoAsync(string codigo, CancellationToken ct = default)
    {
        // Acepta el código solo ("C-02"), una URL o texto con barras (".../activo/C-02") o "activo:15".
        var valor = Uri.UnescapeDataString(codigo).Trim().TrimEnd('/');
        var barra = valor.LastIndexOf('/');
        if (barra >= 0)
        {
            valor = valor[(barra + 1)..].Trim();
        }
        if (valor.Length == 0)
        {
            return null;
        }

        var query = datos.ActivosQuery();

        if (valor.StartsWith("activo:", StringComparison.OrdinalIgnoreCase)
            && int.TryParse(valor["activo:".Length..], out var id))
        {
            return await query.Where(a => a.IdActivo == id)
                .Select(a => new CodigoEncontradoDto(a.IdActivo, a.Nombre))
                .FirstOrDefaultAsync(ct);
        }

        // La intercalación por defecto de SQL Server no distingue mayúsculas.
        var encontrado = await query.Where(a => a.Identificador == valor)
            .Select(a => new CodigoEncontradoDto(a.IdActivo, a.Nombre))
            .FirstOrDefaultAsync(ct);
        if (encontrado is not null)
        {
            return encontrado;
        }

        // Segundo intento ignorando espacios y guiones (patentes "AE 789 KL" vs "AE789KL").
        var compacto = valor.Replace(" ", "").Replace("-", "");
        return await query
            .Where(a => a.Identificador != null && a.Identificador.Replace(" ", "").Replace("-", "") == compacto)
            .Select(a => new CodigoEncontradoDto(a.IdActivo, a.Nombre))
            .FirstOrDefaultAsync(ct);
    }

    private static bool Contiene(string? campo, string texto)
        => campo is not null && campo.Contains(texto, StringComparison.OrdinalIgnoreCase);
}
