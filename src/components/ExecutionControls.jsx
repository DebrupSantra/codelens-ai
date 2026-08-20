function ExecutionControls({ onRun, onStep, onReset, isLastStep }) {
  return (
    <div className="execution-controls" aria-label="Execution controls">
      <button className="control-button control-primary" type="button" onClick={onRun}>Run</button>
      <button className="control-button" type="button" onClick={onStep} disabled={isLastStep}>Step forward</button>
      <button className="control-button control-reset" type="button" onClick={onReset}>Reset</button>
    </div>
  )
}

export default ExecutionControls
