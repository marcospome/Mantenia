using Microsoft.EntityFrameworkCore;
using TallerApp.Data;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Repositories;

// REPOSITORIO de Usuarios: lo que hace falta para el login y para dar de alta un taller nuevo.
public class UsuarioRepository(TallerDbContext contexto) : IUsuarioRepository
{
    // Busca al usuario junto con su taller (el nombre de usuario es único en todo el sistema)
    public Usuario? BuscarPorNombre(string nombreUsuario) =>
        contexto.Usuarios.Include(u => u.Taller).FirstOrDefault(u => u.NombreUsuario == nombreUsuario);

    public void AgregarTaller(Taller taller) => contexto.Talleres.Add(taller);

    public void Guardar() => contexto.SaveChanges();
}
