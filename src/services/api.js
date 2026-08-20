const repositorySources = import.meta.glob([
  '../**/*.{js,jsx,css}',
  '../../*.{html,json,md,js}',
], { eager: true, import: 'default', query: '?raw' })

const ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'build', 'coverage'])
const supportedExtensions = new Set(['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'md'])

const languageFor = (path) => ({
  c: 'c', cpp: 'cpp', css: 'css', html: 'html', java: 'java', js: 'javascript', jsx: 'jsx', json: 'json', md: 'markdown', py: 'python', ts: 'typescript', tsx: 'tsx',
}[path.split('.').pop()] || 'text')

const getRepositoryPath = (sourcePath) => sourcePath.startsWith('../../')
  ? sourcePath.slice(6)
  : `src/${sourcePath.slice(3)}`

const getLocalRepository = () => {
  const files = Object.entries(repositorySources)
    .map(([sourcePath, code]) => {
      const path = getRepositoryPath(sourcePath)
      return { path, language: languageFor(path), code }
    })
    .sort((left, right) => left.path.localeCompare(right.path))

  return { name: 'codelens-ai', status: 'Local workspace', language: 'JavaScript', branch: 'working tree', files }
}

export const mockRepository = getLocalRepository()

const getExtension = (path) => path.split('.').pop().toLowerCase()

const isSupportedFile = (path) => supportedExtensions.has(getExtension(path))

const isIgnoredPath = (path) => path.split('/').some((part) => ignoredDirectories.has(part))

export function parseGitHubUrl(value) {
  try {
    const url = new URL(value.trim())
    const pieces = url.pathname.split('/').filter(Boolean)
    if (url.hostname !== 'github.com' || pieces.length < 2 || pieces.length > 2) return null
    return { owner: pieces[0], repository: pieces[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}

const githubRequest = async (url) => {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  const data = await response.json().catch(() => ({}))
  if (response.ok) return data
  if (response.status === 404) throw new Error('Repository not found. Check the GitHub URL.')
  if (response.status === 401 || response.status === 403) throw new Error('GitHub denied access. The repository may be inaccessible or rate limited.')
  throw new Error(data.message || 'GitHub API failure. Please try again.')
}

export async function loadGitHubRepository(repositoryUrl) {
  const parsed = parseGitHubUrl(repositoryUrl)
  if (!parsed) throw new Error('Enter a valid public GitHub URL, such as https://github.com/owner/repository.')

  const baseUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repository}`
  const repository = await githubRequest(baseUrl)
  const tree = await githubRequest(`${baseUrl}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`)
  const files = (tree.tree || [])
    .filter((entry) => entry.type === 'blob' && !isIgnoredPath(entry.path) && isSupportedFile(entry.path))
    .map((entry) => ({
      path: entry.path,
      language: languageFor(entry.path),
      sha: entry.sha,
      size: entry.size || 0,
      repositoryUrl,
      branch: repository.default_branch,
    }))
    .sort((left, right) => left.path.localeCompare(right.path))

  if (!files.length) throw new Error('No supported files were found in this repository.')

  return {
    name: repository.full_name || `${parsed.owner}/${parsed.repository}`,
    status: 'GitHub connected',
    language: repository.language || 'Mixed',
    branch: repository.default_branch,
    files,
    repositoryUrl,
  }
}

export async function loadFileContent(file) {
  if (!file?.repositoryUrl) return file?.code || ''
  if (file.size > 1_000_000) throw new Error('This file is too large to open. Choose a file under 1 MB.')

  const parsed = parseGitHubUrl(file.repositoryUrl)
  if (!parsed) throw new Error('The selected repository URL is invalid.')
  const data = await githubRequest(`https://api.github.com/repos/${parsed.owner}/${parsed.repository}/contents/${file.path}?ref=${encodeURIComponent(file.branch || '')}`)
  if (data.encoding !== 'base64' || typeof data.content !== 'string') throw new Error('Unsupported file content returned by GitHub.')
  return decodeURIComponent(escape(window.atob(data.content.replace(/\s/g, ''))))
}

export async function loadRepository(repositoryUrl = '') {
  if (!repositoryUrl.trim()) return mockRepository
  return loadGitHubRepository(repositoryUrl)
}
