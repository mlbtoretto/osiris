import { MODEL_BENCH } from './free-models';

export type MasaProvider = {
  id: string;
  name: string;
  website: string;
  docs: string;
  console?: string;
  envKeys: string[];
  models: string[];
  capabilities: Array<'text' | 'vision' | 'voice' | 'local'>;
  /** Ongoing free tier or a local runtime. Trial credits do not count. */
  free?: boolean;
};

type ProviderSpec = Omit<MasaProvider, 'id' | 'name' | 'models'>;

const PROVIDER_CATALOG: Record<string, ProviderSpec> = {
  Auth0: { website: 'https://auth0.com', docs: 'https://auth0.com/docs', console: 'https://manage.auth0.com', envKeys: ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET', 'AUTH0_AUDIENCE'], capabilities: ['local'] },
  Anthropic: { website: 'https://www.anthropic.com', docs: 'https://docs.anthropic.com/en/docs', envKeys: ['ANTHROPIC_API_KEY'], capabilities: ['text', 'vision'] },
  OpenAI: { website: 'https://openai.com', docs: 'https://platform.openai.com/docs', envKeys: ['OPENAI_API_KEY'], capabilities: ['text', 'vision', 'voice'] },
  Google: { website: 'https://ai.google.dev', docs: 'https://ai.google.dev/gemini-api/docs', envKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], capabilities: ['text', 'vision', 'voice'] },
  Vertex: { website: 'https://cloud.google.com/vertex-ai', docs: 'https://cloud.google.com/vertex-ai/generative-ai/docs', envKeys: ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CLOUD_PROJECT'], capabilities: ['text', 'vision', 'voice'] },
  OpenRouter: { website: 'https://openrouter.ai', docs: 'https://openrouter.ai/docs', envKeys: ['OPENROUTER_API_KEY'], capabilities: ['text', 'vision'] },
  'Blackbox AI': { website: 'https://www.blackbox.ai', docs: 'https://docs.blackbox.ai/api-reference/chat', console: 'https://app.blackbox.ai/dashboard', envKeys: ['BLACKBOX_API_KEY', 'BLACKBOX_MODEL'], capabilities: ['text', 'vision'] },
  Ollama: { website: 'https://ollama.com', docs: 'https://github.com/ollama/ollama/blob/main/docs/api.md', envKeys: ['OLLAMA_HOST', 'OLLAMA_MODEL'], capabilities: ['text', 'vision', 'local'] },
  'Z.AI': { website: 'https://z.ai', docs: 'https://docs.z.ai/guides/overview', envKeys: ['ZAI_API_KEY'], capabilities: ['text', 'vision'] },
  Groq: { website: 'https://groq.com', docs: 'https://console.groq.com/docs', envKeys: ['GROQ_API_KEY'], capabilities: ['text', 'vision'] },
  Cerebras: { website: 'https://cerebras.ai', docs: 'https://inference-docs.cerebras.ai', envKeys: ['CEREBRAS_API_KEY'], capabilities: ['text'] },
  SambaNova: { website: 'https://sambanova.ai', docs: 'https://docs.sambanova.ai', envKeys: ['SAMBANOVA_API_KEY'], capabilities: ['text'] },
  Together: { website: 'https://www.together.ai', docs: 'https://docs.together.ai/docs', envKeys: ['TOGETHER_API_KEY'], capabilities: ['text', 'vision'] },
  Fireworks: { website: 'https://fireworks.ai', docs: 'https://docs.fireworks.ai', envKeys: ['FIREWORKS_API_KEY'], capabilities: ['text', 'vision'] },
  DeepSeek: { website: 'https://www.deepseek.com', docs: 'https://api-docs.deepseek.com', envKeys: ['DEEPSEEK_API_KEY'], capabilities: ['text', 'vision'] },
  Mistral: { website: 'https://mistral.ai', docs: 'https://docs.mistral.ai', envKeys: ['MISTRAL_API_KEY'], capabilities: ['text', 'vision'] },
  xAI: { website: 'https://x.ai', docs: 'https://docs.x.ai', envKeys: ['XAI_API_KEY'], capabilities: ['text', 'vision'] },
  Moonshot: { website: 'https://www.moonshot.ai', docs: 'https://platform.moonshot.ai/docs', envKeys: ['MOONSHOT_API_KEY', 'KIMI_API_KEY'], capabilities: ['text', 'vision'] },
  MiniMax: { website: 'https://www.minimax.io', docs: 'https://platform.minimax.io/docs', envKeys: ['MINIMAX_API_KEY'], capabilities: ['text', 'vision', 'voice'] },
  Cohere: { website: 'https://cohere.com', docs: 'https://docs.cohere.com', envKeys: ['COHERE_API_KEY'], capabilities: ['text', 'vision'] },
  'NVIDIA NIM': { website: 'https://build.nvidia.com', docs: 'https://docs.nvidia.com/nim', envKeys: ['NVIDIA_API_KEY'], capabilities: ['text', 'vision'] },
  HuggingFace: { website: 'https://huggingface.co', docs: 'https://huggingface.co/docs', envKeys: ['HF_TOKEN', 'HUGGINGFACEHUB_API_TOKEN'], capabilities: ['text', 'vision'] },
  Replicate: { website: 'https://replicate.com', docs: 'https://replicate.com/docs', envKeys: ['REPLICATE_API_TOKEN'], capabilities: ['text', 'vision', 'voice'] },
  'AWS Bedrock': { website: 'https://aws.amazon.com/bedrock', docs: 'https://docs.aws.amazon.com/bedrock', envKeys: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'], capabilities: ['text', 'vision'] },
  'Azure OpenAI': { website: 'https://azure.microsoft.com/products/ai-services/openai-service', docs: 'https://learn.microsoft.com/azure/ai-services/openai', envKeys: ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'], capabilities: ['text', 'vision'] },
  Hermes: { website: 'https://github.com/NousResearch/hermes-agent', docs: 'https://github.com/NousResearch/hermes-agent#configuration', envKeys: ['HERMES_HOME', 'OPENROUTER_API_KEY', 'NVIDIA_API_KEY'], capabilities: ['text', 'vision', 'voice', 'local'] },
  'Nous / Ollama': { website: 'https://nousresearch.com', docs: 'https://ollama.com/library/hermes3', envKeys: ['OLLAMA_MODEL'], capabilities: ['text', 'local'] },
  'OpenCode Zen': { website: 'https://opencode.ai', docs: 'https://opencode.ai/docs', envKeys: [], capabilities: ['text'], free: true },
};

/** Public inference APIs. Free means a real free tier or a local runtime. */
const EXTRA_PROVIDERS: Record<string, ProviderSpec> = {
  'LM Studio': { website: 'https://lmstudio.ai', docs: 'https://lmstudio.ai/docs', envKeys: ['LMSTUDIO_API_KEY'], capabilities: ['text', 'vision', 'local'], free: true },
  'llama.cpp': { website: 'https://github.com/ggml-org/llama.cpp', docs: 'https://github.com/ggml-org/llama.cpp/blob/master/examples/server/README.md', envKeys: [], capabilities: ['text', 'local'], free: true },
  vLLM: { website: 'https://docs.vllm.ai', docs: 'https://docs.vllm.ai/en/latest/serving/openai_compatible_server/', envKeys: [], capabilities: ['text', 'local'], free: true },
  GPT4All: { website: 'https://www.nomic.ai/gpt4all', docs: 'https://docs.gpt4all.io', envKeys: [], capabilities: ['text', 'local'], free: true },
  'Open WebUI': { website: 'https://openwebui.com', docs: 'https://docs.openwebui.com', envKeys: [], capabilities: ['text', 'local'], free: true },
  'Google AI Studio': { website: 'https://aistudio.google.com', docs: 'https://ai.google.dev/gemini-api/docs', envKeys: ['GEMINI_API_KEY'], capabilities: ['text', 'vision'], free: true },
  'GitHub Models': { website: 'https://github.com/marketplace/models', docs: 'https://docs.github.com/en/github-models', envKeys: ['GITHUB_TOKEN'], capabilities: ['text'], free: true },
  'Cloudflare Workers AI': { website: 'https://developers.cloudflare.com/workers-ai', docs: 'https://developers.cloudflare.com/workers-ai', envKeys: ['CLOUDFLARE_API_TOKEN'], capabilities: ['text'], free: true },
  'Hugging Face Inference': { website: 'https://huggingface.co/inference', docs: 'https://huggingface.co/docs/api-inference', envKeys: ['HF_TOKEN'], capabilities: ['text', 'vision'], free: true },
  DeepInfra: { website: 'https://deepinfra.com', docs: 'https://deepinfra.com/docs', envKeys: ['DEEPINFRA_API_KEY'], capabilities: ['text'], free: true },
  Featherless: { website: 'https://featherless.ai', docs: 'https://featherless.ai/docs', envKeys: ['FEATHERLESS_API_KEY'], capabilities: ['text'], free: true },
  Chutes: { website: 'https://chutes.ai', docs: 'https://chutes.ai/docs', envKeys: ['CHUTES_API_KEY'], capabilities: ['text'], free: true },
  SiliconFlow: { website: 'https://siliconflow.com', docs: 'https://docs.siliconflow.com', envKeys: ['SILICONFLOW_API_KEY'], capabilities: ['text'], free: true },
  Perplexity: { website: 'https://www.perplexity.ai', docs: 'https://docs.perplexity.ai', envKeys: ['PERPLEXITY_API_KEY'], capabilities: ['text'] },
  AI21: { website: 'https://www.ai21.com', docs: 'https://docs.ai21.com', envKeys: ['AI21_API_KEY'], capabilities: ['text'] },
  ElevenLabs: { website: 'https://elevenlabs.io', docs: 'https://elevenlabs.io/docs', envKeys: ['ELEVENLABS_API_KEY'], capabilities: ['voice'] },
  Stability: { website: 'https://stability.ai', docs: 'https://platform.stability.ai/docs', envKeys: ['STABILITY_API_KEY'], capabilities: ['vision'] },
  Deepgram: { website: 'https://deepgram.com', docs: 'https://developers.deepgram.com', envKeys: ['DEEPGRAM_API_KEY'], capabilities: ['voice'] },
  AssemblyAI: { website: 'https://www.assemblyai.com', docs: 'https://www.assemblyai.com/docs', envKeys: ['ASSEMBLYAI_API_KEY'], capabilities: ['voice'] },
  Voyage: { website: 'https://www.voyageai.com', docs: 'https://docs.voyageai.com', envKeys: ['VOYAGE_API_KEY'], capabilities: ['text'] },
  Writer: { website: 'https://writer.com', docs: 'https://dev.writer.com', envKeys: ['WRITER_API_KEY'], capabilities: ['text'] },
  Databricks: { website: 'https://www.databricks.com', docs: 'https://docs.databricks.com/aws/en/machine-learning/foundation-model-apis', envKeys: ['DATABRICKS_TOKEN'], capabilities: ['text'] },
  'Snowflake Cortex': { website: 'https://www.snowflake.com', docs: 'https://docs.snowflake.com/en/user-guide/snowflake-cortex', envKeys: ['SNOWFLAKE_TOKEN'], capabilities: ['text'] },
  'IBM watsonx': { website: 'https://www.ibm.com/watsonx', docs: 'https://www.ibm.com/docs/en/watsonx', envKeys: ['WATSONX_API_KEY'], capabilities: ['text'] },
  'Alibaba DashScope': { website: 'https://www.alibabacloud.com/product/dashscope', docs: 'https://www.alibabacloud.com/help/en/model-studio', envKeys: ['DASHSCOPE_API_KEY'], capabilities: ['text', 'vision'] },
  'Baidu Qianfan': { website: 'https://cloud.baidu.com', docs: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html', envKeys: ['QIANFAN_API_KEY'], capabilities: ['text'] },
  'Tencent Hunyuan': { website: 'https://hunyuan.tencent.com', docs: 'https://cloud.tencent.com/document/product/1729', envKeys: ['HUNYUAN_API_KEY'], capabilities: ['text'] },
  'ByteDance Doubao': { website: 'https://www.volcengine.com/product/doubao', docs: 'https://www.volcengine.com/docs/82379', envKeys: ['ARK_API_KEY'], capabilities: ['text', 'vision'] },
  Baichuan: { website: 'https://www.baichuan-ai.com', docs: 'https://platform.baichuan-ai.com/docs', envKeys: ['BAICHUAN_API_KEY'], capabilities: ['text'] },
  StepFun: { website: 'https://www.stepfun.com', docs: 'https://platform.stepfun.com/docs', envKeys: ['STEP_API_KEY'], capabilities: ['text', 'vision'] },
  '01.AI': { website: 'https://www.01.ai', docs: 'https://platform.01.ai/docs', envKeys: ['YI_API_KEY'], capabilities: ['text'] },
  Upstage: { website: 'https://www.upstage.ai', docs: 'https://console.upstage.ai/docs', envKeys: ['UPSTAGE_API_KEY'], capabilities: ['text'] },
  Baseten: { website: 'https://www.baseten.co', docs: 'https://docs.baseten.co', envKeys: ['BASETEN_API_KEY'], capabilities: ['text'] },
  Modal: { website: 'https://modal.com', docs: 'https://modal.com/docs', envKeys: ['MODAL_TOKEN'], capabilities: ['text'] },
  Fal: { website: 'https://fal.ai', docs: 'https://docs.fal.ai', envKeys: ['FAL_KEY'], capabilities: ['vision'] },
  RunPod: { website: 'https://www.runpod.io', docs: 'https://docs.runpod.io', envKeys: ['RUNPOD_API_KEY'], capabilities: ['text'] },
  Lambda: { website: 'https://lambda.ai', docs: 'https://docs.lambda.ai', envKeys: ['LAMBDA_API_KEY'], capabilities: ['text'] },
  Nebius: { website: 'https://nebius.com', docs: 'https://docs.nebius.com/studio', envKeys: ['NEBIUS_API_KEY'], capabilities: ['text'] },
  Novita: { website: 'https://novita.ai', docs: 'https://novita.ai/docs', envKeys: ['NOVITA_API_KEY'], capabilities: ['text'] },
  LiteLLM: { website: 'https://www.litellm.ai', docs: 'https://docs.litellm.ai', envKeys: [], capabilities: ['text', 'local'], free: true },
  'Vercel AI Gateway': { website: 'https://vercel.com/ai-gateway', docs: 'https://vercel.com/docs/ai-gateway', envKeys: ['AI_GATEWAY_API_KEY'], capabilities: ['text'] },
  Portkey: { website: 'https://portkey.ai', docs: 'https://docs.portkey.ai', envKeys: ['PORTKEY_API_KEY'], capabilities: ['text'] },
  Poe: { website: 'https://poe.com', docs: 'https://creator.poe.com/docs', envKeys: ['POE_API_KEY'], capabilities: ['text'] },
  Cursor: { website: 'https://cursor.com', docs: 'https://docs.cursor.com', envKeys: [], capabilities: ['text'] },
  Codex: { website: 'https://openai.com/codex', docs: 'https://platform.openai.com/docs', envKeys: ['OPENAI_API_KEY'], capabilities: ['text'] },
  Kilo: { website: 'https://kilo.ai', docs: 'https://kilo.ai/docs', envKeys: [], capabilities: ['text'] },
  Factory: { website: 'https://www.factory.ai', docs: 'https://docs.factory.ai', envKeys: [], capabilities: ['text'] },
};

Object.assign(PROVIDER_CATALOG, EXTRA_PROVIDERS);

export const MASA_PROVIDERS: MasaProvider[] = Object.entries(
  MODEL_BENCH.reduce<Record<string, { models: string[]; envKeys: string[] }>>((out, lane) => {
    const row = out[lane.provider] ?? { models: [], envKeys: [] };
    if (!row.models.includes(lane.model)) row.models.push(lane.model);
    if (lane.envKey && !row.envKeys.includes(lane.envKey)) row.envKeys.push(lane.envKey);
    out[lane.provider] = row;
    return out;
  }, {}),
).map(([name, data]) => {
  const spec = PROVIDER_CATALOG[name];
  const freeLane = MODEL_BENCH.some(lane => lane.provider === name && lane.cost === 'free');
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    ...(spec ?? { website: '', docs: '', envKeys: [], capabilities: ['text' as const] }),
    ...data,
    free: freeLane || Boolean(spec?.free),
  };
});

MASA_PROVIDERS.unshift({
  id: 'hermes-robonaut',
  name: 'Hermes · Robonaut',
  website: 'https://github.com/NousResearch/hermes-agent',
  docs: 'https://github.com/NousResearch/hermes-agent#configuration',
  envKeys: ['HERMES_HOME', 'OPENROUTER_API_KEY', 'NVIDIA_API_KEY'],
  models: ['Existing local robonaut profile', 'Ollama / OpenRouter / NVIDIA provider routes'],
  capabilities: ['text', 'vision', 'voice', 'local'],
  free: true,
});

for (const [name, spec] of Object.entries(PROVIDER_CATALOG)) {
  if (MASA_PROVIDERS.some(provider => provider.name === name)) continue;
  MASA_PROVIDERS.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    ...spec,
    models: [],
  });
}
