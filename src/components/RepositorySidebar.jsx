function RepositorySidebar({ repository, selectedPath, onSelectFile }) {
  const getFileName = (path) => path.split('/').at(-1)
  const getGroup = (path) => (path.startsWith('src/') ? 'src' : 'root')
  const getFolder = (path) => {
    const pieces = path.split('/')
    return pieces.length > 2 ? pieces.slice(1, -1).join('/') : ''
  }

  return (
    <aside className="repository-sidebar" aria-label="Repository files">
      <div className="repository-summary">
        <p className="panel-kicker">Project</p>
        <h1>{repository.name}</h1>
        <div className="repository-meta">
          <span className="repo-status"><i /> {repository.status}</span>
          <span>{repository.files.length} files</span>
          <span>{repository.language}</span>
        </div>
      </div>
      <nav className="file-tree" aria-label="Project file tree">
        {['src', 'root'].map((group) => {
          const files = repository.files.filter((file) => getGroup(file.path) === group)
          return files.length ? (
            <div className="file-group" key={group}>
              <p>{group === 'src' ? 'src' : 'Project files'}</p>
              {files.map((file) => (
                <button className={selectedPath === file.path ? 'file-item active' : 'file-item'} key={file.path} type="button" onClick={() => onSelectFile(file.path)}>
                  <span className="file-icon">{file.language === 'json' ? '{}' : file.language === 'markdown' ? '#' : '<>'}</span>
                  <span className="file-label">{getFolder(file.path) && <small>{getFolder(file.path)}/</small>}{getFileName(file.path)}</span>
                </button>
              ))}
            </div>
          ) : null
        })}
      </nav>
    </aside>
  )
}

export default RepositorySidebar
