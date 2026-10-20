using System.Security.Cryptography;
using System.Text;
using TallerApp.DTOs;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Services;

// Login y alta de talleres nuevos.
public class AutenticacionService(IUsuarioRepository usuarios) : IAutenticacionService
{
    // "Hash" = resumen irreversible de la clave. Se guarda el hash, nunca la clave.
    public static string Hash(string clave) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(clave)));

    // Se hashea lo que escribió la persona y se compara con el hash guardado
    public SesionDto? Validar(string nombreUsuario, string clave)
    {
        var usuario = usuarios.BuscarPorNombre(nombreUsuario);
        if (usuario is null || usuario.ClaveHash != Hash(clave)) return null;
        return new SesionDto(usuario.NombreUsuario, usuario.TallerId, usuario.Taller!.Nombre);
    }

    // Alta de un taller nuevo con su primer usuario
    public Resultado<SesionDto> Registrar(RegistroDto dto)
    {
        if (usuarios.BuscarPorNombre(dto.Usuario!) is not null)
            return Resultado<SesionDto>.Conflicto("Ese nombre de usuario ya está en uso");

        var taller = new Taller
        {
            Nombre = dto.NombreTaller!.Trim(),
            Usuarios = [new Usuario { NombreUsuario = dto.Usuario!, ClaveHash = Hash(dto.Clave!) }],
        };
        usuarios.AgregarTaller(taller);
        usuarios.Guardar();
        return Resultado<SesionDto>.Correcto(new SesionDto(dto.Usuario!, taller.Id, taller.Nombre));
    }
}
