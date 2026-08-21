export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { fileName, code, action, question } = req.body || {};

    if (!code) {
      return res.status(400).json({
        error: "No code was provided",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured",
      });
    }

    let instruction = "";

    switch (action) {
      case "explain":
        instruction = `
Explain the following code clearly for a developer.

Include:
1. What the code does
2. How it works
3. Important functions or logic
4. Any potential issues
5. A simple explanation of the overall flow

File name: ${fileName || "Unknown"}

Code:
${code}
`;
        break;

      case "bugs":
        instruction = `
Analyze the following code for bugs, errors, edge cases, and potential runtime problems.

For every issue:
- Explain the problem
- Explain why it happens
- Suggest a fix

File name: ${fileName || "Unknown"}

Code:
${code}
`;
        break;

      case "improve":
        instruction = `
Review the following code and suggest improvements.

Focus on:
- Readability
- Performance
- Maintainability
- Code structure
- Best practices
- Possible simplifications

Do not unnecessarily rewrite working code.

File name: ${fileName || "Unknown"}

Code:
${code}
`;
        break;

      case "question":
        instruction = `
Answer the developer's question using the provided code as context.

Developer question:
${question || "No question provided"}

File name: ${fileName || "Unknown"}

Code:
${code}
`;
        break;

      default:
        instruction = `
Analyze the following code and provide a clear developer-friendly explanation.

File name: ${fileName || "Unknown"}

Code:
${code}
`;
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: instruction,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API request failed",
      });
    }

    const analysis =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      return res.status(500).json({
        error: "Gemini returned an empty response",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Explain API error:", error);

    return res.status(500).json({
      error: "Failed to analyze code",
      details: error.message,
    });
  }
}