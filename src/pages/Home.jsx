import { useState } from 'react'

function Home({ onOpenWorkspace }) {
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [error, setError] = useState('')

  const connectRepository = (event) => {
    event.preventDefault()
    if (!repositoryUrl.trim()) {
      setError('Enter a public GitHub repository URL.')
      return
    }
    setError('')
    onOpenWorkspace(repositoryUrl.trim())
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">CodeLens AI</p>
        <h1 id="page-title">A clearer view of your codebase.</h1>
        <p className="intro">Connect a public GitHub repository to inspect its files with CodeLens AI.</p>
        <form className="repository-connect" onSubmit={connectRepository}>
          <label htmlFor="github-repository">GitHub repository URL</label>
          <div>
            <input id="github-repository" value={repositoryUrl} onChange={(event) => { setRepositoryUrl(event.target.value); setError('') }} placeholder="https://github.com/owner/repository" />
            <button className="button" type="submit">Connect repository</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
        <button className="button button-secondary" type="button" onClick={() => onOpenWorkspace('')}>
          Open local workspace
        </button>
      </section>
    </main>
  )
}

export default Home
