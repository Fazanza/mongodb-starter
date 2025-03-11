import OpenAI from 'openai';

const api_base = 'https://api.umgpt.umich.edu/azure-openai-api';
const model = 'gpt-35-turbo';
const api_version = '2023-05-15';
const apiKey = process.env.AZURE_OPENAI_API_KEY; // Use environment variable
const organization = process.env.AZURE_ORGANIZATION;

if (!apiKey) {
  throw new Error(
    'The AZURE_OPENAI_API_KEY environment variable is missing or empty.'
  );
}

if (!organization) {
  throw new Error(
    'The AZURE_ORGANIZATION environment variable is missing or empty.'
  );
}

// Azure OpenAI setup
const openai = new OpenAI({
  apiKey,
  baseURL: `${api_base}/openai/deployments/${model}`,
  defaultQuery: { 'api-version': api_version },
  defaultHeaders: { 'api-key': apiKey, 'openai-organization': organization }
});

// API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { message } = req.body;

  try {
    const result = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: message }]
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
