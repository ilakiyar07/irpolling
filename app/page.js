'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [questions, setQuestions] = useState([])
  const [newQuestion, setNewQuestion] = useState('')
  const [polls, setPolls] = useState([])
  const [pollQuestion, setPollQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [search, setSearch] = useState('')
  const [aiAnswers, setAiAnswers] = useState({})
  const [loadingAI, setLoadingAI] = useState({})

  useEffect(() => {
    fetchQuestions()
    fetchPolls()
  }, [])

  async function fetchQuestions() {
    const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: false })
    setQuestions(data || [])
  }

  async function addQuestion() {
    if (!newQuestion.trim()) return
    await supabase.from('questions').insert([{ text: newQuestion, vote: 0 }])
    setNewQuestion('')
    fetchQuestions()
  }

  async function voteQuestion(id, currentVote) {
    await supabase.from('questions').update({ vote: currentVote + 1 }).eq('id', id)
    fetchQuestions()
  }

  async function fetchPolls() {
    const { data } = await supabase.from('polls').select('*').order('id', { ascending: false })
    setPolls(data || [])
  }

  async function addPoll() {
    if (!pollQuestion.trim()) return
    await supabase.from('polls').insert([{
      poll_question: pollQuestion,
      option_1: options[0], option_2: options[1],
      option_3: options[2], option_4: options[3],
      votes_1: 0, votes_2: 0, votes_3: 0, votes_4: 0
    }])
    setPollQuestion('')
    setOptions(['', '', '', ''])
    fetchPolls()
  }

  async function votePoll(id, optionNum) {
    const poll = polls.find(p => p.id === id)
    const key = `votes_${optionNum}`
    await supabase.from('polls').update({ [key]: poll[key] + 1 }).eq('id', id)
    fetchPolls()
  }

  async function askAI(id, questionText) {
    setLoadingAI(prev => ({ ...prev, [id]: true }))
    const res = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: questionText })
    })
    const data = await res.json()
    setAiAnswers(prev => ({ ...prev, [id]: data.answer }))
    setLoadingAI(prev => ({ ...prev, [id]: false }))
  }

  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#ffffff' }}
      className="max-w-2xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6 text-center text-white">Live Q&A + Polls</h1>

      {/* Ask Question Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-white">Ask a Question</h2>
        <div className="flex gap-2 mb-4">
          <input
            style={{ backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #333' }}
            className="p-2 flex-1 rounded placeholder-gray-500"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="Type your question..."
          />
          <button
            className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
            onClick={addQuestion}
          >
            Add
          </button>
        </div>

        {/* Search */}
        <input
          style={{ backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #333' }}
          className="p-2 w-full rounded placeholder-gray-500 mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search questions..."
        />

        {/* Asked Questions */}
        <h3 className="mt-2 text-lg font-semibold mb-2 text-white">📋 Asked Questions</h3>
        {filteredQuestions.length === 0 ? (
          <p className="text-gray-500">No questions found.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {filteredQuestions.map(q => (
              <li key={q.id}
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                className="p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-white">❓ {q.text}</span>
                  <button
                    style={{ backgroundColor: '#2a2a2a', color: '#ffffff', border: '1px solid #444' }}
                    className="text-sm px-3 py-1 rounded hover:bg-gray-600 ml-2"
                    onClick={() => voteQuestion(q.id, q.vote)}
                  >
                    👍 {q.vote}
                  </button>
                </div>

                {/* AI Answer Button */}
                <button
                  className="mt-2 text-sm bg-purple-700 text-white px-3 py-1 rounded hover:bg-purple-800"
                  onClick={() => askAI(q.id, q.text)}
                >
                  {loadingAI[q.id] ? '⏳ Thinking...' : '🤖 Ask AI'}
                </button>

                {/* AI Answer Display */}
                {aiAnswers[q.id] && (
                  <div style={{ backgroundColor: '#2a1a3e', border: '1px solid #6b21a8' }}
                    className="mt-2 p-3 rounded text-purple-200 text-sm">
                    🤖 <strong>AI Answer:</strong> {aiAnswers[q.id]}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create Poll Section */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-white">Create a Poll</h2>
        <input
          style={{ backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #333' }}
          className="p-2 w-full rounded mb-2 placeholder-gray-500"
          value={pollQuestion}
          onChange={e => setPollQuestion(e.target.value)}
          placeholder="Poll question..."
        />
        {options.map((opt, i) => (
          <input
            key={i}
            style={{ backgroundColor: '#1e1e1e', color: '#ffffff', border: '1px solid #333' }}
            className="p-2 w-full rounded mb-2 placeholder-gray-500"
            value={opt}
            onChange={e => {
              const o = [...options]
              o[i] = e.target.value
              setOptions(o)
            }}
            placeholder={`Option ${i + 1}`}
          />
        ))}
        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700"
          onClick={addPoll}
        >
          Create Poll
        </button>

        {/* Polls Display */}
        <h3 className="mt-6 text-lg font-semibold mb-2 text-white">📊 Active Polls</h3>
        {polls.length === 0 ? (
          <p className="text-gray-500">No polls yet. Create one above!</p>
        ) : (
          <div className="mt-2 space-y-4">
            {polls.map(poll => (
              <div key={poll.id}
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}
                className="p-4 rounded">
                <p className="font-semibold mb-2 text-white">🗳️ {poll.poll_question}</p>
                {[1, 2, 3, 4].map(n => poll[`option_${n}`] && (
                  <button
                    key={n}
                    onClick={() => votePoll(poll.id, n)}
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#ffffff' }}
                    className="block w-full text-left p-2 rounded mb-1 hover:bg-gray-600"
                  >
                    {poll[`option_${n}`]} — <span className="text-blue-400 font-medium">{poll[`votes_${n}`]} votes</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}