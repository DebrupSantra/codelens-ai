import { useEffect, useState } from 'react'
import {
  explainCode,
  findPotentialBugs,
  suggestImprovements,
  askCodeLens,
} from '../services/aiService'

export default function AIExplanation({
  fileName,
  code,
  selectedFile,
}) {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [conversation, setConversation] = useState([])

  const resolvedFileName =
    fileName ||
    selectedFile?.fileName ||
    selectedFile?.name ||
    selectedFile?.path?.split('/').pop() ||
    selectedFile?.path?.split('\\').pop() ||
    ''

  const resolvedCode = typeof code === 'string'
    ? code
    : selectedFile?.code || selectedFile?.content || selectedFile?.source || ''

  useEffect(() => {
    setConversation([])
    setResult('')
    setError('')
  }, [resolvedFileName])

  const hasSelectedCode =
    Boolean(resolvedFileName) &&
    typeof resolvedCode === 'string' &&
    resolvedCode.trim().length > 0

  const runAnalysis = async (action) => {
    if (!hasSelectedCode) {
      setError(
        'Please select a file with readable source code first.',
      )
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      let response

      if (action === 'explain') {
        response = await explainCode({
          fileName: resolvedFileName,
          code: resolvedCode,
        })
      } else if (action === 'bugs') {
        response = await findPotentialBugs({
          fileName: resolvedFileName,
          code: resolvedCode,
        })
      } else if (action === 'improve') {
        response = await suggestImprovements({
          fileName: resolvedFileName,
          code: resolvedCode,
        })
      } else {
        throw new Error('Unsupported AI action.')
      }

      setResult(response || 'No AI response was returned.')
    } catch (err) {
      setError(
        err?.message ||
          'Unable to analyze the selected code right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleAsk = async () => {
    if (!hasSelectedCode) {
      setError(
        'Please select a file with readable source code first.',
      )
      return
    }

    if (!question.trim()) {
      setError('Please enter a question.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await askCodeLens({
        fileName: resolvedFileName,
        code: resolvedCode,
        question: question.trim(),
      })

      setConversation((current) => [
        ...current,
        { question: question.trim(), response: response || 'No AI response was returned.' },
      ])
      setQuestion('')
    } catch (err) {
      setError(
        err?.message ||
          'Unable to answer your question right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-explanation">
      <div className="ai-explanation-header">
        <h2>CodeLens AI</h2>

        <p>
          Analyze and understand your selected code with AI.
        </p>

        {resolvedFileName && (
          <div className="ai-selected-file">
            Selected file:{' '}
            <strong>{resolvedFileName}</strong>
          </div>
        )}
      </div>

      <div className="ai-actions">
        <button
          type="button"
          onClick={() => runAnalysis('explain')}
          disabled={loading || !hasSelectedCode}
        >
          {loading ? 'Analyzing...' : 'Explain this code'}
        </button>

        <button
          type="button"
          onClick={() => runAnalysis('bugs')}
          disabled={loading || !hasSelectedCode}
        >
          Find Potential Bugs
        </button>

        <button
          type="button"
          onClick={() => runAnalysis('improve')}
          disabled={loading || !hasSelectedCode}
        >
          Suggest Improvements
        </button>
      </div>

      <div className="ask-codelens">
        <label htmlFor="codelens-question">
          Ask CodeLens
        </label>

        <div className="ask-codelens-input">
          <input
            id="codelens-question"
            type="text"
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value)
              setError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAsk()
              }
            }}
            placeholder="Ask a question about this code..."
            disabled={loading || !hasSelectedCode}
          />

          <button
            type="button"
            onClick={handleAsk}
            disabled={
              loading ||
              !hasSelectedCode ||
              !question.trim()
            }
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </div>

      {!hasSelectedCode && (
        <div className="ai-empty-state">
          Select a source file from the workspace to use
          CodeLens AI.
        </div>
      )}

      {loading && (
        <div className="ai-loading">
          Analyzing with Gemini...
        </div>
      )}

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="ai-result">
          <div className="ai-result-header">
            AI Response
          </div>

          <div className="ai-result-content">
            {result}
          </div>
        </div>
      )}

      {conversation.length > 0 && !loading && (
        <div className="ai-conversation" aria-label="Ask CodeLens conversation">
          {conversation.map((entry, index) => (
            <div className="ai-conversation-entry" key={`${entry.question}-${index}`}>
              <strong>You</strong>
              <p>{entry.question}</p>
              <strong>CodeLens AI</strong>
              <p>{entry.response}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}