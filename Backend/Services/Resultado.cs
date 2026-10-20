namespace TallerApp.Services;

public enum TipoResultado { Correcto, NoEncontrado, Conflicto }

// Lo que devuelve un servicio: o salió bien (con su valor), o falló con un mensaje.
// El controller lo traduce a un código HTTP: Correcto = 200/201, NoEncontrado = 404, Conflicto = 409.
public class Resultado<T>
{
    public TipoResultado Tipo { get; private init; }
    public string? Mensaje { get; private init; }
    public T? Valor { get; private init; }

    public static Resultado<T> Correcto(T valor) => new() { Tipo = TipoResultado.Correcto, Valor = valor };
    public static Resultado<T> NoEncontrado(string mensaje) => new() { Tipo = TipoResultado.NoEncontrado, Mensaje = mensaje };
    public static Resultado<T> Conflicto(string mensaje) => new() { Tipo = TipoResultado.Conflicto, Mensaje = mensaje };
}
