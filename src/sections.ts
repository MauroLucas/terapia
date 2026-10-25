// Orden y metadatos de las secciones del GDD.
// Para agregar una sección: crear src/content/<id>.md y sumarla acá.
export interface Section {
  id: string
  title: string
  icon: string
}

export const sections: Section[] = [
  { id: 'resumen', title: 'Resumen', icon: '🎮' },
  { id: 'historia', title: 'Historia y mundo', icon: '📜' },
  { id: 'personajes', title: 'Personajes', icon: '🧙' },
  { id: 'mecanicas', title: 'Mecánicas', icon: '⚙️' },
  { id: 'locaciones', title: 'Locaciones', icon: '🗺️' },
  { id: 'guion', title: 'Guion', icon: '🎬' },
  { id: 'arte', title: 'Arte y estilo', icon: '🎨' },
  { id: 'sprites', title: 'Sprites', icon: '🧩' },
  { id: 'audio', title: 'Audio', icon: '🎵' },
  { id: 'ui', title: 'Interfaz (UI/UX)', icon: '🖥️' },
  { id: 'tecnico', title: 'Aspectos técnicos', icon: '🛠️' },
  { id: 'roadmap', title: 'Roadmap', icon: '🚀' },
  { id: 'notas', title: 'Notas personales', icon: '📝' },
]

const files = import.meta.glob('./content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getContent(id: string): string | undefined {
  return files[`./content/${id}.md`]
}
