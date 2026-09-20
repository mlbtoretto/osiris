/** MASA IA model bench. Free first. Paid listed so we never pretend Astra is free. */

export type ModelLane = {
  id: string;
  name: string;
  provider: string;
  role: string;
  cost: 'free' | 'cheap' | 'paid';
  endpoint: string;
  model: string;
  envKey: string;
  ramFit20g: boolean;
  /** Preferred completion budget for this lane (army can raise further). */
  maxTokens?: number;
};

export const MODEL_BENCH: ModelLane[] = [
  { id: 'ollama-horus', name: 'Your Ollama', provider: 'Ollama', role: 'home brain on the 20GB box', cost: 'free', endpoint: 'http://127.0.0.1:11434/v1', model: 'horus', envKey: 'OLLAMA_MODEL', ramFit20g: true, maxTokens: 128000 },
  { id: 'ollama-llama32', name: 'Llama 3.2 1B (downloaded)', provider: 'Ollama', role: 'local unlimited tokens, 1.3GB on disk', cost: 'free', endpoint: 'http://127.0.0.1:11434/v1', model: 'llama3.2:1b', envKey: 'OLLAMA_MODEL', ramFit20g: true, maxTokens: 128000 },
  { id: 'ollama-any', name: 'Ollama (any tag)', provider: 'Ollama', role: 'swap via OLLAMA_MODEL', cost: 'free', endpoint: 'http://127.0.0.1:11434/v1', model: 'llama3.2:1b', envKey: 'OLLAMA_MODEL', ramFit20g: true, maxTokens: 128000 },
  { id: 'glm-flash', name: 'GLM-4.7-Flash', provider: 'Z.AI', role: 'free raw agentic coding (200K)', cost: 'free', endpoint: 'https://api.z.ai/api/paas/v4', model: 'glm-4.7-flash', envKey: 'ZAI_API_KEY', ramFit20g: true, maxTokens: 128000 },
  { id: 'glm-45-flash', name: 'GLM-4.5-Flash', provider: 'Z.AI', role: 'free GLM failover', cost: 'free', endpoint: 'https://api.z.ai/api/paas/v4', model: 'glm-4.5-flash', envKey: 'ZAI_API_KEY', ramFit20g: true, maxTokens: 128000 },
  { id: 'glm-53-flash', name: 'GLM-5.3-Flash', provider: 'Z.AI', role: 'cheap multimodal agentic (1M ctx)', cost: 'cheap', endpoint: 'https://api.z.ai/api/paas/v4', model: 'glm-5.3-flash', envKey: 'ZAI_API_KEY', ramFit20g: true, maxTokens: 128000 },
  { id: 'glm-53', name: 'GLM-5.3', provider: 'Z.AI', role: 'flagship GLM agentic coding', cost: 'cheap', endpoint: 'https://api.z.ai/api/paas/v4', model: 'glm-5.3', envKey: 'ZAI_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'Google', role: 'live vision + voice', cost: 'free', endpoint: 'google', model: 'gemini-2.0-flash', envKey: 'GEMINI_API_KEY', ramFit20g: true, maxTokens: 8192 },
  { id: 'gemini-flash-25', name: 'Gemini 2.5 Flash', provider: 'Google', role: 'long desk + vision', cost: 'free', endpoint: 'google', model: 'gemini-2.5-flash', envKey: 'GEMINI_API_KEY', ramFit20g: true, maxTokens: 65536 },
  { id: 'groq-llama', name: 'Llama 3.3 70B', provider: 'Groq', role: 'fast free-tier burst', cost: 'free', endpoint: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY', ramFit20g: true, maxTokens: 32768 },
  { id: 'groq-70b-spec', name: 'Llama 3.1 70B', provider: 'Groq', role: 'army burst failover', cost: 'free', endpoint: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile', envKey: 'GROQ_API_KEY', ramFit20g: true, maxTokens: 32768 },
  { id: 'cerebras-llama', name: 'Cerebras Llama 3.3 70B', provider: 'Cerebras', role: 'speed lane', cost: 'free', endpoint: 'https://api.cerebras.ai/v1', model: 'llama-3.3-70b', envKey: 'CEREBRAS_API_KEY', ramFit20g: true, maxTokens: 65536 },
  { id: 'sambanova-llama', name: 'SambaNova Llama 3.3', provider: 'SambaNova', role: 'free-tier army cell', cost: 'free', endpoint: 'https://api.sambanova.ai/v1', model: 'Meta-Llama-3.3-70B-Instruct', envKey: 'SAMBANOVA_API_KEY', ramFit20g: true, maxTokens: 65536 },
  { id: 'openrouter-free', name: 'OpenRouter free pool', provider: 'OpenRouter', role: 'many free models via one key', cost: 'free', endpoint: 'https://openrouter.ai/api/v1', model: 'openrouter/free', envKey: 'OPENROUTER_API_KEY', ramFit20g: true, maxTokens: 128000 },
  { id: 'grok-46', name: 'Grok 4.6', provider: 'xAI', role: 'this Grok session', cost: 'free', endpoint: 'xai-oauth', model: 'grok-4.6', envKey: '', ramFit20g: true, maxTokens: 128000 },
  { id: 'deepseek-flash', name: 'DeepSeek V4.1 Flash', provider: 'DeepSeek', role: 'raw agentic code + vision (1M ctx)', cost: 'cheap', endpoint: 'https://api.deepseek.com', model: 'deepseek-flash', envKey: 'DEEPSEEK_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'deepseek-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', role: 'legacy DeepSeek flagship, routes to Flash', cost: 'cheap', endpoint: 'https://api.deepseek.com', model: 'deepseek-v4-pro', envKey: 'DEEPSEEK_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'kimi-code', name: 'Kimi K2.7 Code', provider: 'Moonshot', role: 'raw agentic coding (256K)', cost: 'cheap', endpoint: 'https://api.kimi.com/coding/v1', model: 'kimi-k2.7-code', envKey: 'MOONSHOT_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'kimi-for-coding', name: 'Kimi for Coding', provider: 'Moonshot', role: 'Kimi Code CLI agent id (K2.8 preview)', cost: 'cheap', endpoint: 'https://api.kimi.com/coding/v1', model: 'kimi-for-coding', envKey: 'KIMI_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'kimi-k3', name: 'Kimi K3', provider: 'Moonshot', role: 'flagship 1M-ctx vision + long-horizon agent', cost: 'paid', endpoint: 'https://api.moonshot.ai/v1', model: 'kimi-k3', envKey: 'MOONSHOT_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'hermes-4', name: 'Hermes 4', provider: 'Nous / Ollama', role: 'local raw agentic (needs 14B+ RAM or OpenRouter)', cost: 'free', endpoint: 'http://127.0.0.1:11434/v1', model: 'hermes-4', envKey: 'OLLAMA_MODEL', ramFit20g: false, maxTokens: 64000 },
  { id: 'minimax-m25-free', name: 'MiniMax M2.5 (free)', provider: 'OpenRouter', role: 'SOTA agentic coding + world search (BrowseComp 76%)', cost: 'free', endpoint: 'https://openrouter.ai/api/v1', model: 'minimax/minimax-m2.5:free', envKey: 'OPENROUTER_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'minimax-m25', name: 'MiniMax M2.5', provider: 'MiniMax', role: 'agentic coding + office + search (SWE 80%)', cost: 'cheap', endpoint: 'https://api.minimax.io/v1', model: 'MiniMax-M2.5', envKey: 'MINIMAX_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'nvidia-glm53-flash', name: 'GLM-5.3-Flash NIM', provider: 'NVIDIA NIM', role: '1.3M ctx free hosted agentic GLM', cost: 'free', endpoint: 'https://integrate.api.nvidia.com/v1', model: 'z-ai/glm-5.3-flash', envKey: 'NVIDIA_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'nvidia-kimi-k3', name: 'Kimi K3 NIM', provider: 'NVIDIA NIM', role: '1M ctx free hosted Kimi agent', cost: 'free', endpoint: 'https://integrate.api.nvidia.com/v1', model: 'moonshotai/kimi-k3', envKey: 'NVIDIA_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'nvidia-ds-flash', name: 'DeepSeek V4 Flash NIM', provider: 'NVIDIA NIM', role: 'free hosted DeepSeek agentic', cost: 'free', endpoint: 'https://integrate.api.nvidia.com/v1', model: 'deepseek-ai/deepseek-v4-flash-0731', envKey: 'NVIDIA_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'nvidia-nemotron', name: 'Nemotron 3 Ultra', provider: 'NVIDIA NIM', role: 'US open-weight 1M-ctx long-horizon agent', cost: 'free', endpoint: 'https://integrate.api.nvidia.com/v1', model: 'nvidia/nemotron-3-ultra-550b-a55b', envKey: 'NVIDIA_API_KEY', ramFit20g: false, maxTokens: 128000 },
  { id: 'zen-nemotron', name: 'Nemotron 3 Ultra (OpenCode Zen)', provider: 'OpenCode Zen', role: 'free inside OpenCode/Kilo only', cost: 'free', endpoint: 'opencode-zen', model: 'opencode/nemotron-3-ultra-free', envKey: '', ramFit20g: true, maxTokens: 128000 },
  { id: 'zen-ling', name: 'Ling 3.0 Flash Fin (Zen)', provider: 'OpenCode Zen', role: 'free inside OpenCode/Kilo', cost: 'free', endpoint: 'opencode-zen', model: 'opencode/ling-3.0-flash-fin-free', envKey: '', ramFit20g: true, maxTokens: 128000 },
  { id: 'zen-pickle', name: 'Big Pickle (Zen)', provider: 'OpenCode Zen', role: 'free OpenCode coding agent', cost: 'free', endpoint: 'opencode-zen', model: 'opencode/big-pickle', envKey: '', ramFit20g: true, maxTokens: 128000 },
  { id: 'gpt-6-astra', name: 'GPT-6 Astra', provider: 'OpenAI', role: 'frontier computer-use — not free', cost: 'paid', endpoint: 'https://api.openai.com/v1', model: 'gpt-6-astra', envKey: 'OPENAI_API_KEY', ramFit20g: false, maxTokens: 128000 },
];

export const DESIGN_PAIR = ['deepseek-flash', 'kimi-k3'] as const;
export const TEAM_FREE = MODEL_BENCH.filter(m => m.cost === 'free');
export const ARMY_LANES = MODEL_BENCH;
