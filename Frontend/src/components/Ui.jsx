import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Piezas chicas que se reutilizan en varias pantallas.

// HOJA: una ventana que sube desde abajo (en el celular) o aparece al centro (en pantallas grandes).
// Se cierra tocando afuera, con la X o con la tecla Escape.
export function Hoja({ titulo, alCerrar, children }) {
  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && alCerrar()
    document.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'                 // evita que se mueva la pantalla de atrás
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fondo-hoja" onClick={alCerrar}>
      <div className="hoja" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="agarre" />
        <div className="hoja-cab">
          <h3>{titulo}</h3>
          <button className="icono-btn" onClick={alCerrar} aria-label="Cerrar"><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// CONTADOR: muestra un número que «sube» desde 0 hasta su valor (efecto de conteo)
export function Contador({ valor, formato = (n) => n }) {
  const [actual, setActual] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setActual(valor); return }
    let inicio, cuadro
    const paso = (t) => {
      inicio ??= t
      const avance = Math.min((t - inicio) / 900, 1)
      setActual(valor * (1 - Math.pow(1 - avance, 3)))       // arranca rápido y frena al final
      if (avance < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor])

  return <span className="num">{formato(Math.round(actual))}</span>
}

// ESQUELETO: un bloque gris que brilla mientras llegan los datos
export const Esqueleto = ({ alto = 90 }) => <div className="esqueleto" style={{ height: alto }} />

// VACÍO: lo que se muestra cuando no hay datos
export function Vacio({ icono, texto }) {
  return (
    <div className="vacio">
      <div className="circulo">{icono}</div>
      <p>{texto}</p>
    </div>
  )
}

// PATENTE: se dibuja como la chapa de un auto
export const Patente = ({ valor }) => <span className="patente">{valor}</span>
