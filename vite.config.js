import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const sendJson = (response, statusCode, body) => {
response.writeHead(statusCode, { 'Content-Type': 'application/json' })
response.end(JSON.stringify(body))
}

const redactSensitiveValues = (value, apiKey) => String(value || '')
.replaceAll(apiKey, '[REDACTED]')
.replace(/(x-goog-api-key["'\s:=]+)[^,\s}"']+/gi, '$1[REDACTED]')

const getGeminiFailure = (response, data, apiKey) => {
const message =
data?.error?.message ||
data?.error?.status ||
data?.promptFeedback?.blockReason ||
'Gemini returned no response.'

return {
status: response.status,
message: redactSensitiveValues(message, apiKey),
}
}

const readRequestBody = (request) => new Promise((resolve, reject) => {
let body = ''

request.on('data', (chunk) => {
body += chunk


if (body.length > 100_000) {
  reject(new Error('Request body is too large.'))
}


})

request.on('end', () => {
try {
resolve(JSON.parse(body))
} catch {
reject(new Error('Invalid request body.'))
}
})

request.on('error', reject)
})

const geminiProxyPlugin = (apiKey, isDevelopment) => ({
name: 'gemini-explain-proxy',

configureServer(server) {
server.middlewares.use('/api/explain', async (request, response, next) => {
if (request.method !== 'POST') {
next()
return
}


  if (!apiKey) {
    sendJson(response, 503, {
      error: 'Gemini is not configured. Add GEMINI_API_KEY to your server environment.',
    })
    return
  }

  try {
    const {
      fileName,
      code,
      action = 'explain',
      question,
    } = await readRequestBody(request)

    // Basic validation
    if (
      typeof fileName !== 'string' ||
      typeof code !== 'string' ||
      !fileName ||
      !code
    ) {
      sendJson(response, 400, {
        error: 'A file name and code are required.',
      })
      return
    }

    // Supported actions
    if (!['explain', 'bugs', 'improve', 'ask'].includes(action)) {
      sendJson(response, 400, {
        error: 'Unsupported AI action.',
      })
      return
    }

    // Ask CodeLens requires a question
    if (
      action === 'ask' &&
      (typeof question !== 'string' || !question.trim())
    ) {
      sendJson(response, 400, {
        error: 'A question is required.',
      })
      return
    }

    const prompt =
      action === 'bugs'
        ? `Analyze the following source file for a developer. Identify potential bugs, logical errors, edge cases, and unsafe or problematic patterns. Use concise labeled sections and bullet-style findings. For each finding, explain why it matters and suggest a concrete fix. If no issues are found, say so and mention any residual risks. Do not invent behavior that is not present.


File: ${fileName}

Code:
${code}`


        : action === 'improve'
          ? `Suggest practical improvements to the following source file for a developer. Focus on readability, maintainability, code quality, performance where relevant, and modern coding practices. Use concise labeled sections and bullet-style suggestions. For each suggestion, explain why it matters and provide a concrete improvement. Do not invent behavior that is not present.


File: ${fileName}

Code:
${code}`


          : action === 'ask'
            ? `Answer the developer's question about the following source file. Base your answer strictly on the provided code. Explain your reasoning clearly and do not invent behavior that is not present.


Developer question:
${question}

File: ${fileName}

Code:
${code}`


            : `Explain the following source file clearly for a developer. Describe its responsibility, key flow, and anything notable. Do not invent behavior that is not present.


File: ${fileName}

Code:
${code}`


    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    const data = await geminiResponse.json().catch(() => ({}))

    const explanation = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim()

    if (!geminiResponse.ok || !explanation) {
      const geminiFailure = getGeminiFailure(
        geminiResponse,
        data,
        apiKey,
      )

      console.error(
        '[Gemini explain] Upstream request failed:',
        geminiFailure,
      )

      sendJson(
        response,
        502,
        isDevelopment
          ? {
              error: `Gemini request failed (HTTP ${geminiFailure.status}): ${geminiFailure.message}`,
              geminiStatus: geminiFailure.status,
            }
          : {
              error:
                'Gemini could not generate a response. Please try again.',
            },
      )

      return
    }

    sendJson(response, 200, {
      explanation,
    })
  } catch (error) {
    const message = redactSensitiveValues(
      error?.message || 'Unable to process the request.',
      apiKey,
    )

    console.error(
      '[Gemini explain] Request processing failed:',
      message,
    )

    const statusCode =
      error.message === 'Request body is too large.'
        ? 413
        : 400

    sendJson(
      response,
      statusCode,
      isDevelopment
        ? {
            error: message,
          }
        : {
            error:
              statusCode === 413
                ? 'Request body is too large.'
                : 'Unable to process the request.',
          },
    )
  }
})


},
})

export default defineConfig(({ mode }) => {
const environment = loadEnv(
mode,
process.cwd(),
'',
)

return {
plugins: [
react(),
geminiProxyPlugin(
environment.GEMINI_API_KEY,
mode === 'development',
),
],
}
})

