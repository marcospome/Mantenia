// Etiqueta de color según el estado del trabajo (se usa en el panel y en el detalle).
// «En curso» late suavemente para que se note que está pasando algo.
export default function EstadoTrabajo({ estado }) {
  return (
    <span className={`chip chip-${estado.replace(' ', '-')}`}>
      <i className="punto" />
      {estado}
    </span>
  )
}
