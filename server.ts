import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('AI request timed out. Please try again in a moment.'));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function formatAiError(error: unknown, fallback: string): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : fallback;
  const upper = raw.toUpperCase();
  if (upper.includes('429') || upper.includes('RESOURCE_EXHAUSTED') || upper.includes('QUOTA')) {
    return {
      status: 429,
      message: 'AI rate limit reached right now. Please wait a few seconds and retry, or check your Gemini API quota.',
    };
  }
  if (upper.includes('TIMED OUT')) {
    return { status: 504, message: raw };
  }
  return { status: 500, message: raw || fallback };
}

const proposeFinanceEntryTool: FunctionDeclaration = {
  name: 'propose_finance_entry',
  description:
    'Propose logging a personal or business income or expense entry. This requires explicit user approval before saving.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      scope: { type: Type.STRING, description: 'Either "personal" or "business".' },
      type: { type: Type.STRING, description: 'Either "income" or "expense".' },
      title: { type: Type.STRING, description: 'Concise description of the transaction (max 120 chars).' },
      category: { type: Type.STRING, description: 'Category such as Groceries, Housing, Transport, Client Retainer, Software, Utilities.' },
      amount: { type: Type.NUMBER, description: 'Positive numeric amount in user currency.' },
      date: { type: Type.STRING, description: 'ISO date YYYY-MM-DD.' },
      notes: { type: Type.STRING, description: 'Optional short note.' },
    },
    required: ['scope', 'type', 'title', 'category', 'amount', 'date'],
  },
};

const proposeTaskTool: FunctionDeclaration = {
  name: 'propose_task',
  description:
    'Propose scheduling a personal task, appointment, or deadline reminder. Requires explicit user approval before saving.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Task or appointment title (max 140 chars).' },
      category: { type: Type.STRING, description: 'One of: personal, work, finance, learning, health.' },
      priority: { type: Type.STRING, description: 'One of: low, medium, high.' },
      dueDate: { type: Type.STRING, description: 'ISO date YYYY-MM-DD.' },
      timeSlot: { type: Type.STRING, description: 'Optional time slot like "09:30" or "14:00".' },
    },
    required: ['title', 'category', 'priority', 'dueDate'],
  },
};

const proposeInvoiceTool: FunctionDeclaration = {
  name: 'propose_invoice',
  description:
    'Propose drafting a professional business quotation or invoice. Requires explicit user approval before saving.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      docType: { type: Type.STRING, description: 'Either "quote" or "invoice".' },
      clientName: { type: Type.STRING, description: 'Client or company name.' },
      itemSummary: { type: Type.STRING, description: 'Concise description of services or deliverables.' },
      subtotal: { type: Type.NUMBER, description: 'Subtotal amount before VAT.' },
      includeVat: { type: Type.BOOLEAN, description: 'Whether to apply 15% VAT.' },
      dueDate: { type: Type.STRING, description: 'Due date in YYYY-MM-DD.' },
    },
    required: ['docType', 'clientName', 'itemSummary', 'subtotal', 'includeVat', 'dueDate'],
  },
};

const proposeLearningPlanTool: FunctionDeclaration = {
  name: 'propose_learning_plan',
  description:
    'Propose creating a personalized learning track and study plan. Requires user approval before saving.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Learning track title.' },
      skillArea: { type: Type.STRING, description: 'Skill domain e.g. Web Development, Business Finance, UI Design.' },
      level: { type: Type.STRING, description: 'One of: beginner, intermediate, advanced.' },
      totalLessons: { type: Type.INTEGER, description: 'Total number of lessons in the plan (between 4 and 40).' },
      nextTopic: { type: Type.STRING, description: 'First or next topic to study.' },
      studyReminder: { type: Type.STRING, description: 'Suggested study cadence e.g. "Mon & Wed · 18:30".' },
    },
    required: ['title', 'skillArea', 'level', 'totalLessons', 'nextTopic'],
  },
};

const navigateModuleTool: FunctionDeclaration = {
  name: 'navigate_module',
  description: 'Navigate the user interface to a specific LIFEOS module.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      module: {
        type: Type.STRING,
        description:
          'Target module: overview, finance, business, tasks, places, opportunities, learning, assistant, account.',
      },
      reason: { type: Type.STRING, description: 'Short explanation for navigating.' },
    },
    required: ['module'],
  },
};

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface RawGroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

function extractGroundingSources(response: unknown): Array<{ title: string; url: string }> {
  const candidates = (response as { candidates?: Array<{ groundingMetadata?: { groundingChunks?: RawGroundingChunk[] } }> })?.candidates;
  const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const out: Array<{ title: string; url: string }> = [];
  for (const chunk of chunks) {
    const uri = chunk?.web?.uri;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      out.push({
        title: chunk.web?.title || uri,
        url: uri,
      });
    }
  }
  return out.slice(0, 6);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'lifeos-core' });
  });

  app.get('/api/config/maps', (_req, res) => {
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({ apiKey });
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const {
        messages,
        contextSnapshot,
        activeModule,
        aiContextEnabled,
        currency,
        useSearch,
      } = req.body as {
        messages?: ChatMessageInput[];
        contextSnapshot?: Record<string, unknown>;
        activeModule?: string;
        aiContextEnabled?: boolean;
        currency?: string;
        useSearch?: boolean;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      const ai = getAiClient();
      const todayIso = new Date().toISOString().slice(0, 10);

      const contextBlock = aiContextEnabled
        ? `User Workspace Snapshot (${currency || 'ZAR'}, active module: ${activeModule || 'overview'}, today: ${todayIso}):\n${JSON.stringify(contextSnapshot || {}, null, 2)}`
        : `POPIA Context Restricted: The user disabled automatic workspace context sharing. Answer strictly using the conversation messages. Today is ${todayIso}.`;

      const systemInstruction = `You are LIFEOS Intelligence — the calm, incisive, executive personal operating system assistant.
Your role is to help the user manage personal finances, small business operations (quotes, invoices, profits), daily schedules, opportunity discovery, and personalized learning.

Rules:
1. Be clear, practical, structured, and concise. Avoid fluff, hype, or robotic disclaimers.
2. When the user asks you to record a transaction, schedule a task/appointment, create a quotation/invoice, or start a learning track, ALWAYS call the corresponding propose_* function tool so the user receives an interactive Approval Card in the UI before any data is committed. Never pretend a write already succeeded before the user clicks Approve.
3. If the user asks to open or jump to a section, call navigate_module.
4. For drafting emails, quotations, study guides, or explaining financial concepts, respond with clean, ready-to-use prose or bullet points.
5. Respect currency (${currency || 'ZAR'}) and South African context when relevant (e.g. POPIA, 15% VAT, local opportunities), while staying globally helpful.

${contextBlock}`;

      const contents = messages.slice(-14).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }],
      }));

      const tools: Array<Record<string, unknown>> = [
        {
          functionDeclarations: [
            proposeFinanceEntryTool,
            proposeTaskTool,
            proposeInvoiceTool,
            proposeLearningPlanTool,
            navigateModuleTool,
          ],
        },
      ];

      if (useSearch) {
        tools.push({ googleSearch: {} });
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            systemInstruction,
            tools,
            ...(useSearch ? { toolConfig: { includeServerSideToolInvocations: true } } : {}),
          },
        })
      );

      const functionCalls = (response.functionCalls || []).map((fc) => ({
        id: fc.id || `call_${Date.now()}`,
        name: fc.name,
        args: fc.args || {},
      }));

      let replyText = (response.text || '').trim();
      if (!replyText && functionCalls.length > 0) {
        const navCall = functionCalls.find((c) => c.name === 'navigate_module');
        const actionCalls = functionCalls.filter((c) => c.name !== 'navigate_module');
        if (actionCalls.length > 0) {
          replyText =
            'I have prepared the requested action below. Please review the details and approve to commit it to your LIFEOS workspace.';
        } else if (navCall) {
          replyText = `Switching your workspace to ${String((navCall.args as { module?: string }).module || 'requested module')}.`;
        }
      }

      const groundingSources = extractGroundingSources(response);

      return res.json({
        reply: replyText,
        functionCalls,
        groundingSources,
      });
    } catch (error: unknown) {
      const formatted = formatAiError(error, 'AI service request failed.');
      console.error('LIFEOS AI error:', formatted.message);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/ai/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64 || typeof audioBase64 !== 'string') {
        return res.status(400).json({ error: 'Audio payload is required.' });
      }

      const ai = getAiClient();
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe the spoken audio accurately into clean plain text with punctuation. Output only the transcript.',
              },
            ],
          },
        })
      );

      return res.json({
        transcript: (response.text || '').trim(),
      });
    } catch (error: unknown) {
      const formatted = formatAiError(error, 'Audio transcription failed.');
      console.error('LIFEOS Transcribe error:', formatted.message);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/ai/opportunities-search', async (req, res) => {
    try {
      const { query, kind } = req.body as { query?: string; kind?: string };
      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Search query is required.' });
      }

      const ai = getAiClient();
      const todayIso = new Date().toISOString().slice(0, 10);

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Find current, verifiable ${kind && kind !== 'all' ? kind : 'jobs, scholarships, grants, internships, business funding, or training'} opportunities matching: "${query.trim()}". Today is ${todayIso}. Summarize the top 4-5 real opportunities concisely with organization, eligibility, deadline (if public), and direct action steps.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        })
      );

      const groundingSources = extractGroundingSources(response);

      return res.json({
        summary: (response.text || '').trim(),
        sources: groundingSources,
      });
    } catch (error: unknown) {
      const formatted = formatAiError(error, 'Live opportunity search failed.');
      console.error('LIFEOS Opportunities Search error:', formatted.message);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LIFEOS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LIFEOS server:', err);
  process.exit(1);
});
