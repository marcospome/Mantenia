// Un campo del formulario con su mensaje de error debajo (se reutiliza para todos los campos)
export default function Campo({ etiqueta, nombre, valores, cambiar, errores, tipo = 'text', opciones }) {
  const invalido = errores[nombre] ? ' is-invalid' : ''
  const comunes = { value: valores[nombre] ?? '', onChange: (e) => cambiar(nombre, e.target.value) }

  return (
    <div className="col-md-4">
      <label className="form-label">{etiqueta}</label>
      {opciones ? (
        <select className={'form-select' + invalido} {...comunes}>
          <option value="">-- Elegir --</option>
          {opciones.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={tipo} className={'form-control' + invalido} {...comunes} />
      )}
      <div className="invalid-feedback">{errores[nombre]}</div>
    </div>
  )
}
