import { Navigate, useParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getContent, sections } from '../sections'

export function SectionPage() {
  const { id = '' } = useParams()
  const section = sections.find((s) => s.id === id)
  if (!section) return <Navigate to={`/${sections[0].id}`} replace />

  const content = getContent(id)
  return (
    <article className="content">
      <header className="section-header">
        <span className="section-icon">{section.icon}</span>
        <h1>{section.title}</h1>
      </header>
      {content ? (
        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      ) : (
        <p className="empty">
          Sección sin contenido todavía. Creá <code>src/content/{id}.md</code>.
        </p>
      )}
    </article>
  )
}
