// Etiqueta de color según el estado del trabajo (se usa en el panel y en el detalle)
const CLASES = { 'Pendiente': 'est-pendiente', 'En curso': 'est-curso', 'Finalizado': 'est-final' }

export default function EstadoTrabajo({ estado }) {
  return <span className={`etiqueta ${CLASES[estado]}`}>{estado}</span>
}
