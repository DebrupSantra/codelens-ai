function ExecutionPanel({ steps, currentStep, hasRun, output }) {
  const activeStep = hasRun ? steps[currentStep] : null

  return (
    <section className="workspace-panel execution-panel" aria-labelledby="execution-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Runtime</p>
          <h2 id="execution-title">Execution visualizer</h2>
        </div>
        <span className="step-indicator">Step {hasRun ? currentStep + 1 : 0} / {steps.length}</span>
      </div>
      <div className="current-action" aria-live="polite">
        <span>Current action</span>
        <strong>{activeStep ? activeStep.label : 'Ready to execute'}</strong>
      </div>
      <ol className="execution-track">
        {steps.map((step, index) => (
          <li key={`${step.label}-${index}`} className={hasRun && index <= currentStep ? 'visited' : ''}>
            <span className="track-dot" />
            <span className="track-label">{step.label}</span>
          </li>
        ))}
      </ol>
      <div className="output-console" aria-live="polite">
        <span>Output</span>
        <code>{output || 'Run the code to view output.'}</code>
      </div>
    </section>
  )
}

export default ExecutionPanel
