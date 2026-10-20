// Un campo del formulario con su etiqueta y su mensaje de error (se reutiliza para todos los campos).
// Si tiene "opciones" se dibuja como lista desplegable; si no, como un cuadro de texto.
export default function Campo({ etiqueta, nombre, valores, cambiar, errores, tipo = 'text', opciones, modo, ancho }) {
  return (
    <label className={'campo' + (ancho ? ' ancho' : '') + (errores[nombre] ? ' error' : '')}>
      <span>{etiqueta}</span>
      {opciones ? (
        <select value={valores[nombre] ?? ''} onChange={(e) => cambiar(nombre, e.target.value)}>
          <option value="">Elegir...</option>
          {opciones.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={tipo} inputMode={modo} value={valores[nombre] ?? ''} onChange={(e) => cambiar(nombre, e.target.value)} />
      )}
      {errores[nombre] && <small>{errores[nombre]}</small>}
    </label>
  )
}
