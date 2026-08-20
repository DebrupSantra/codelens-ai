import { useState } from 'react'

const escapeHtml = (value) => value.replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character])

function highlightCode(code, language) {
  const escaped = escapeHtml(code)
  if (language === 'markdown') return escaped.replace(/^(#.*)$/gm, '<span class="syntax-keyword">$1</span>')
  return escaped
    .replace(/(".*?")/g, '<span class="syntax-string">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="syntax-comment">$1</span>')
    .replace(/\b(import|from|export|function|const|return|if|else|new|true|false|null)\b/g, '<span class="syntax-keyword">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="syntax-number">$1</span>')
}

function CodeEditor({ code, fileName, language, onChange }) {
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const lineCount = code.split('\n').length
  return (
    <section className="code-editor" aria-labelledby="editor-title">
      <div className="editor-heading"><div><p className="panel-kicker">Selected file</p><h1 id="editor-title">{fileName}</h1></div><span className="language-pill">{language}</span></div>
      <div className="editor-surface">
        <div className="line-numbers" aria-hidden="true" style={{ transform: `translateY(${-scrollTop}px)` }}>{Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
        <div className="code-stack">
          <pre aria-hidden="true" className="highlighted-code" style={{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }}><code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} /></pre>
          <textarea aria-label={`Code editor for ${fileName}`} value={code} spellCheck="false" onChange={(event) => onChange(event.target.value)} onScroll={(event) => { setScrollTop(event.currentTarget.scrollTop); setScrollLeft(event.currentTarget.scrollLeft) }} />
        </div>
      </div>
    </section>
  )
}

export default CodeEditor
