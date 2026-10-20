import { useEffect, useState } from 'react'
import { CheckCircle2, TriangleAlert, LayoutDashboard, Car, UserCog, Moon, Sun, LogOut, Wrench } from 'lucide-react'
import { borrarSesion, leerSesion } from '../api'

const MENU = [
  { clave: 'panel', texto: 'Panel', Icono: LayoutDashboard },
  { clave: 'lista', texto: 'Vehículos', Icono: Car },
  { clave: 'mecanicos', texto: 'Mecánicos', Icono: UserCog },
]

// LAYOUT: lo que se repite en todas las pantallas.
//  · Celular: barra de arriba (con el nombre del taller) y menú abajo.
//  · Escritorio: menú lateral a la izquierda.
// El contenido de cada pantalla entra en "children".
export default function Layout({ children, pantalla, ir, aviso }) {
  const [oscuro, setOscuro] = useState(() => {
    const guardado = localStorage.getItem('tema')
    return guardado ? guardado === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // CSS cambia todos los colores con este atributo
  useEffect(() => { document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro' }, [oscuro])
  const cambiarTema = () => { localStorage.setItem('tema', oscuro ? 'claro' : 'oscuro'); setOscuro(!oscuro) }
  const salir = () => { borrarSesion(); location.reload() }

  const sesion = leerSesion()
  // «nuevo», «editar» y «detalle» pertenecen a la sección Vehículos
  const seccion = ['nuevo', 'editar', 'detalle'].includes(pantalla) ? 'lista' : pantalla
  const enFormulario = pantalla === 'nuevo' || pantalla === 'editar'

  return (
    <div className="app">
      {/* Menú lateral (solo se ve en pantallas grandes) */}
      <aside className="lateral">
        <div className="marca-lat">
          <div className="logo"><Wrench size={20} /></div>
          <div><b>{sesion?.taller}</b><small>{sesion?.usuario}</small></div>
        </div>
        {MENU.map(({ clave, texto, Icono }) => (
          <button key={clave} className={'nav' + (seccion === clave ? ' activo' : '')} onClick={() => ir(clave)}>
            <Icono size={20} /> {texto}
          </button>
        ))}
        <div className="pie">
          <button className="btn btn-suave btn-chico" onClick={cambiarTema}>{oscuro ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button className="btn btn-suave btn-chico" onClick={salir}><LogOut size={17} /> Salir</button>
        </div>
      </aside>

      {/* Barra de arriba (celular) */}
      <header className="barra-sup">
        <div className="logo"><Wrench size={20} /></div>
        <div className="titulo-sup"><small>Taller mecánico</small><b>{sesion?.taller}</b></div>
        <button className="icono-btn" onClick={cambiarTema} aria-label="Cambiar tema">{oscuro ? <Sun size={21} /> : <Moon size={21} />}</button>
        <button className="icono-btn" onClick={salir} aria-label="Salir"><LogOut size={21} /></button>
      </header>

      <main className="contenido" key={pantalla}>{children}</main>

      {/* Menú de abajo (celular). En los formularios se oculta para dejar lugar a los botones */}
      {!enFormulario && (
        <nav className="tabs" aria-label="Secciones">
          {MENU.map(({ clave, texto, Icono }) => (
            <button key={clave} className={seccion === clave ? 'activo' : ''} onClick={() => ir(clave)}>
              <Icono size={23} />
              {texto}
            </button>
          ))}
        </nav>
      )}

      {aviso && (
        <div className={`aviso aviso-${aviso.tipo}`} role="status" key={aviso.texto}>
          {aviso.tipo === 'ok' ? <CheckCircle2 size={22} /> : <TriangleAlert size={22} />} {aviso.texto}
        </div>
      )}
    </div>
  )
}
