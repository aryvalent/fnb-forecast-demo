export function getLocalLlmConfig() {
  const provider = process.env.LLM_PROVIDER ? String(process.env.LLM_PROVIDER) : 'ollama';
  if (provider !== 'ollama') return { provider, enabled: false };

  const baseUrl = process.env.OLLAMA_URL
    ? String(process.env.OLLAMA_URL)
    : 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL ? String(process.env.OLLAMA_MODEL) : 'llama3.1';
  const enabled = String(process.env.LLM_ENABLED ?? '1') !== '0';

  return { provider, enabled, baseUrl, model };
}

export async function ollamaStatus({ baseUrl }) {
  const res = await fetch(new URL('/api/tags', baseUrl), { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Ollama status failed: ${res.status}`);
  }
  return res.json();
}

export async function ollamaChat({ baseUrl, model, messages, temperature = 0.2 }) {
  const res = await fetch(new URL('/api/chat', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false, options: { temperature } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Ollama chat failed: ${res.status}`);
  }
  const json = await res.json();
  const content = json?.message?.content;
  if (!content) throw new Error('Ollama returned empty content');
  return content;
}
