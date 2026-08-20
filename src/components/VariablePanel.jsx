function VariablePanel({ variables }) {
  return (
    <section className="workspace-panel variable-panel" aria-labelledby="variables-title">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Inspector</p>
          <h2 id="variables-title">Variables</h2>
        </div>
      </div>
      {variables.length ? (
        <dl className="variables-list">
          {variables.map((variable) => (
            <div key={variable.name}>
              <dt><code>{variable.name}</code><span>{variable.type}</span></dt>
              <dd>{variable.value}</dd>
            </div>
          ))}
        </dl>
      ) : <p className="empty-state">Variable values will appear as you step through the code.</p>}
    </section>
  )
}

export default VariablePanel
