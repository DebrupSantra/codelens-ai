async function requestAiAnalysis({ fileName, code, action, question }) {
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      code,
      action,
      ...(question ? { question } : {}),
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.error || 'Unable to process the AI request right now.'
    )
  }

  if (!data.explanation) {
    throw new Error('The AI returned an empty response.')
  }

  return data.explanation
}

export function explainCode({ fileName, code }) {
  return requestAiAnalysis({
    fileName,
    code,
    action: 'explain',
  })
}

export function findPotentialBugs({ fileName, code }) {
  return requestAiAnalysis({
    fileName,
    code,
    action: 'bugs',
  })
}

export function suggestImprovements({ fileName, code }) {
  return requestAiAnalysis({
    fileName,
    code,
    action: 'improve',
  })
}

export function askCodeLens({ fileName, code, question }) {
  return requestAiAnalysis({
    fileName,
    code,
    action: 'ask',
    question,
  })
}