import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

export async function POST(request) {
  try {
    const { question } = await request.json()

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Answer in 1-2 sentences only: ${question}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 100,
    })

    const answer = completion.choices[0]?.message?.content || 'No answer found.'
    return Response.json({ answer })

  } catch (error) {
    console.error('Groq Error:', error.message)
    return Response.json({ answer: `Error: ${error.message}` })
  }
}