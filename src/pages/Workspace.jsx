import { useEffect, useMemo, useState } from 'react'
import AIExplanation from '../components/AIExplanation.jsx'
import CodeEditor from '../components/CodeEditor.jsx'
import ExecutionControls from '../components/ExecutionControls.jsx'
import ExecutionPanel from '../components/ExecutionPanel.jsx'
import RepositorySidebar from '../components/RepositorySidebar.jsx'
import VariablePanel from '../components/VariablePanel.jsx'
import { loadFileContent, loadRepository } from '../services/api.js'
import '../styles/workspace.css'

function Workspace() {
  const [repository, setRepository] = useState(null)
  const [repositoryError, setRepositoryError] = useState('')
  const [repositoryLoading, setRepositoryLoading] = useState(true)
  const [fileLoading, setFileLoading] = useState(false)
  const [selectedPath, setSelectedPath] = useState('')
  const [fileContents, setFileContents] = useState({})
  const [currentStep, setCurrentStep] = useState(0)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    const repositoryUrl = new URLSearchParams(window.location.search).get('repo') || ''
    loadRepository(repositoryUrl)
      .then((loadedRepository) => {
        setRepository(loadedRepository)
        setSelectedPath(loadedRepository.files[0]?.path || '')
        setFileContents(Object.fromEntries(loadedRepository.files.map((file) => [file.path, file.code])))
      })
      .catch((error) => setRepositoryError(error.message || 'Unable to load the workspace.'))
      .finally(() => setRepositoryLoading(false))
  }, [])

  const selectedFile = useMemo(
    () =>
      repository?.files.find(
        (file) => file.path === selectedPath,
      ),
    [repository, selectedPath],
  )

  useEffect(() => {
    if (!repository || !selectedFile || typeof selectedFile.code === 'string' || typeof fileContents[selectedFile.path] === 'string') return
    let active = true
    setFileLoading(true)
    loadFileContent({ ...selectedFile, branch: repository.branch })
      .then((content) => {
        if (active) setFileContents((current) => ({ ...current, [selectedFile.path]: content }))
      })
      .catch((error) => {
        if (active) setRepositoryError(error.message || 'Unable to load file.')
      })
      .finally(() => {
        if (active) setFileLoading(false)
      })
    return () => { active = false }
  }, [repository, selectedFile, selectedPath, fileContents])

  if (repositoryError) return <main className="workspace-shell workspace-loading">{repositoryError}</main>
  if (repositoryLoading || !repository) return <main className="workspace-shell workspace-loading">{repository ? 'Loading files...' : 'Connecting repository...'}</main>

  if (!selectedFile) {
    return (
      <main className="workspace-shell repository-workspace">
        <header className="workspace-header">
          <a
            className="brand"
            href="/"
            aria-label="Return to CodeLens AI home"
          >
            CodeLens <span>AI</span>
          </a>

          <div className="workspace-context">
            <span>Repository explorer</span>
            <strong>{repository.branch}</strong>
          </div>
        </header>

        <section className="repository-layout">
          <RepositorySidebar
            repository={repository}
            selectedPath={selectedPath}
            onSelectFile={setSelectedPath}
          />

          <div className="workspace-empty">
            <h2>No file selected</h2>
            <p>Select a file from the repository.</p>
          </div>
        </section>
      </main>
    )
  }

  const currentCode = typeof fileContents[selectedFile.path] === 'string' ? fileContents[selectedFile.path] : selectedFile.code || ''
  const steps = currentCode.split('\n').map((line, index) => ({ label: `Line ${index + 1}: ${line.trim() || 'blank'}` }))

  const handleCodeChange = (value) => {
    setFileContents((current) => ({
      ...current,
      [selectedFile.path]: value,
    }))
  }

  return (
    <main className="workspace-shell repository-workspace">
      <header className="workspace-header">
        <a
          className="brand"
          href="/"
          aria-label="Return to CodeLens AI home"
        >
          CodeLens <span>AI</span>
        </a>

        <div className="workspace-context">
          <span>Repository explorer</span>
          <strong>{repository.branch}</strong>
        </div>
      </header>

      <section
        className="repository-layout"
        aria-label="CodeLens repository workspace"
      >
        <RepositorySidebar
          repository={repository}
          selectedPath={selectedPath}
          onSelectFile={setSelectedPath}
        />

        <div className="workspace-main">
          {fileLoading ? <div className="workspace-loading">Loading file...</div> : <CodeEditor code={currentCode} fileName={selectedFile.path} language={selectedFile.language} onChange={handleCodeChange} />}
          <ExecutionControls onRun={() => { setHasRun(true); setCurrentStep(0) }} onStep={() => setCurrentStep((step) => Math.min(step + 1, steps.length - 1))} onReset={() => { setHasRun(false); setCurrentStep(0) }} isLastStep={currentStep >= steps.length - 1} />
          <ExecutionPanel steps={steps} currentStep={currentStep} hasRun={hasRun} output={hasRun ? `Previewed ${selectedFile.path}` : ''} />
          <VariablePanel variables={[]} />
        </div>

        <AIExplanation
          file={selectedFile}
          fileName={selectedFile.path}
          code={currentCode}
        />
      </section>
    </main>
  )
}

export default Workspace