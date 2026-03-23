import Groq from 'groq-sdk';

// Rate limit error detection
function isRateLimitError(err) {
  const status = err?.status;
  const code = err?.code;
  const message = err?.message?.toLowerCase() || '';

  return (
    status === 429 ||
    status === 429000 ||
    code === 'rate_limit_exceeded' ||
    message.includes('rate limit') ||
    message.includes('quota exceeded') ||
    message.includes('daily limit')
  );
}

const FALLBACK_INSIGHTS = [
  'Top dishes show consistent demand patterns - ensure adequate ingredient stock.',
  'Several ingredients have low days of coverage - consider increasing safety stock.',
  'Forecast accuracy is within target range - continue current ordering patterns.',
];

const FALLBACK_ANSWER =
  'AI assistant is currently rate-limited. Please try again in a few minutes or check the dashboard directly for insights.';

export function getGroqConfig() {
  const enabled = String(process.env.LLM_ENABLED ?? '1') !== '0';
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    return { enabled: false, error: 'GROQ_API_KEY not set in environment' };
  }

  return { enabled, apiKey, model };
}

export async function checkGroqStatus() {
  const config = getGroqConfig();

  if (!config.enabled) {
    return {
      status: 'disabled',
      message: 'LLM is disabled (LLM_ENABLED=0)',
    };
  }

  if (!config.apiKey) {
    return { status: 'error', message: 'GROQ_API_KEY not set' };
  }

  try {
    const groq = new Groq({ apiKey: config.apiKey });
    // Test call with minimal tokens
    await groq.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1,
    });
    return { status: 'ok', message: `Groq (${config.model})` };
  } catch (err) {
    if (isRateLimitError(err)) {
      return {
        status: 'rate_limited',
        message: 'Groq rate limit reached - using fallback mode',
      };
    }
    return {
      status: 'error',
      message: `Groq connection failed: ${err.message}`,
    };
  }
}

export async function groqChat(messages, temperature = 0.2) {
  const config = getGroqConfig();

  if (!config.enabled) {
    throw new Error('LLM is disabled (LLM_ENABLED=0)');
  }

  if (!config.apiKey) {
    throw new Error('GROQ_API_KEY not set');
  }

  const groq = new Groq({ apiKey: config.apiKey });

  try {
    const response = await groq.chat.completions.create({
      model: config.model,
      messages,
      temperature,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '';
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn('[Groq] Rate limit reached, using fallback');
      // Return null to signal caller to use fallback
      return null;
    }
    throw err;
  }
}

// Generate insights from dashboard data
export async function generateGroqInsights({ kpis, forecasts, risks, _trends }) {
  const systemPrompt = `You are a F&B inventory planning assistant. Analyze the metrics and provide 3-5 actionable insights.
Keep responses concise (max 2 sentences per insight). Use business language.`;

  const userPrompt = `Based on the following forecast data:
- Accuracy: ${kpis.accuracy}%
- Waste reduction: ${kpis.wasteReduction}%
- At-risk ingredients: ${risks.map((r) => r.ingredient).join(', ') || 'None'}
- Top dish: ${forecasts.topDish}

Provide 3-5 actionable insights for the kitchen team.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const result = await groqChat(messages, 0.3);

  // Fallback to static insights if rate limited
  if (result === null) {
    return FALLBACK_INSIGHTS.join('\n\n');
  }

  return result;
}

// For NLP Q&A
export async function askGroq(question, dashboardSnapshot) {
  const systemPrompt = `You are a F&B forecasting assistant. Answer questions about demand forecasts, ingredient planning, and inventory.
Keep answers concise (2-3 sentences). Use the provided data.`;

  const context = JSON.stringify(dashboardSnapshot, null, 2);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Question: ${question}\n\nData:\n${context}` },
  ];

  const result = await groqChat(messages, 0.3);

  if (result === null) {
    return FALLBACK_ANSWER;
  }

  return result;
}
