using Mantenia.Api.Entities;

namespace Mantenia.Api.Interfaces;

public interface IPasswordHasherService
{
    string Hash(Usuario usuario, string clave);
    bool Verificar(Usuario usuario, string hash, string clave);
}
