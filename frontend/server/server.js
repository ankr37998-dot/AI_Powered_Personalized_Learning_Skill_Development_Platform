/**
 * CogniPath AI - Express.js REST API Server
 * Database: MongoDB
 * Architecture: Student-Only Learning Platform with Real Authentication Endpoints
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GOOGLE_GEMINI_API_BASE_URL = (process.env.GOOGLE_GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
const GOOGLE_GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-3.8-flash';

if (!MONGODB_URI) {
  console.error('MONGODB_URI must be set in the backend environment.');
  process.exit(1);
}

// Security Headers & CORS
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// Rate Limiting on Authentication Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/', authLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests. Please try again shortly.' }
});

async function callGemini(messages, options = {}) {
  if (!GOOGLE_GEMINI_API_KEY) {
    const error = new Error('GOOGLE_GEMINI_API_KEY is not configured on the backend.');
    error.status = 503;
    throw error;
  }

  const systemInstruction = messages.find((message) => message.role === 'system')?.content;
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));

  const response = await fetch(`${GOOGLE_GEMINI_API_BASE_URL}/models/${encodeURIComponent(GOOGLE_GEMINI_MODEL)}:${options.stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': GOOGLE_GEMINI_API_KEY,
      'Content-Type': 'application/json',
      Accept: options.stream ? 'text/event-stream' : 'application/json'
    },
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 2048,
        ...(options.json ? { responseMimeType: 'application/json' } : {})
      }
    }),
    signal: options.signal || AbortSignal.timeout(90000)
  });

  if (!response.ok) {
    const error = new Error(`Gemini API request failed with HTTP ${response.status}.`);
    error.status = response.status === 401 || response.status === 403 ? 502 : response.status;
    throw error;
  }

  return response;
}

function validateMessages(messages) {
  return Array.isArray(messages) && messages.length > 0 && messages.length <= 24 &&
    messages.every((message) => ['system', 'user', 'assistant'].includes(message?.role) &&
      typeof message.content === 'string' && message.content.length > 0 && message.content.length <= 12000);
}

app.post('/api/ai/generate', requireAuth, aiLimiter, async (req, res) => {
  const { prompt, systemInstruction, json = false, maxTokens } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 24000) {
    return res.status(400).json({ error: 'A prompt between 1 and 24000 characters is required.' });
  }

  try {
    const response = await callGemini([
      ...(systemInstruction ? [{ role: 'system', content: String(systemInstruction).slice(0, 4000) }] : []),
      { role: 'user', content: prompt }
    ], { json, maxTokens: Math.min(Number(maxTokens) || 4096, 4096) });
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }
    res.json({ content, model: GOOGLE_GEMINI_MODEL });
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message || 'Gemini API request failed.' });
  }
});

app.post('/api/ai/chat', requireAuth, aiLimiter, async (req, res) => {
  const { messages, stream = false } = req.body || {};
  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Provide 1 to 24 valid chat messages, each up to 12000 characters.' });
  }

  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const response = await callGemini(messages, { stream, signal: controller.signal, maxTokens: 2048 });
    if (!stream) {
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
      return res.json({ content, model: GOOGLE_GEMINI_MODEL });
    }

    res.status(200);
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
          if (text && !res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`)) {
            await new Promise((resolve) => res.once('drain', resolve));
          }
        } catch {
          // Ignore malformed or keep-alive stream events.
        }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: 'Gemini API request failed.' })}\n\n`);
      return res.end();
    }
    res.status(error.status || 502).json({ error: error.message || 'Gemini API request failed.' });
  }
});

// ----------------------------------------------------
// MongoDB Atlas Connection
// ----------------------------------------------------
let isDbConnected = false;

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'cognipath_ai',
      serverSelectionTimeoutMS: 8000
    });
    isDbConnected = true;
    console.log(`[MongoDB] Connected successfully to database: ${mongoose.connection.name}`);
  } catch (err) {
    isDbConnected = false;
    console.error('[MongoDB Atlas Connection Error]', err.message);
  }
}

connectDatabase().then(seedQuestionBank).catch((error) => {
  console.error('[Assessment Question Seed Error]', error.message);
});

// ----------------------------------------------------
// Mongoose Schemas & Models (Student-Only Model)
// ----------------------------------------------------
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  passwordHash: { type: String, select: false },
  role: { type: String, default: 'student', enum: ['student', 'admin'] },
  targetGoal: { type: String, default: 'Master Production Node.js' },
  currentSkillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  preferredLanguage: { type: String, default: 'JavaScript / TypeScript' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  registeredDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

const StudentStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  state: { type: mongoose.Schema.Types.Mixed, required: true, default: {} }
}, { timestamps: true });

const PlatformStateSchema = new mongoose.Schema({
  key: { type: String, default: 'primary', unique: true },
  state: { type: mongoose.Schema.Types.Mixed, required: true, default: {} }
}, { timestamps: true });

const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String },
  title: { type: String, required: true },
  category: { type: String, default: 'Backend Core' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  summary: { type: String, required: true },
  prerequisiteIds: [{ type: String }],
  keyCompetencies: [{ type: String }],
  isActive: { type: Boolean, default: true },
  officialDocSources: [{
    title: String,
    url: String,
    authorityName: String
  }]
}, { timestamps: true });

const ResourceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  topicId: { type: String, required: true },
  subtopics: [{ type: String }],
  title: { type: String, required: true },
  url: { type: String, required: true },
  platform: { type: String, required: true },
  type: { type: String, enum: ['video', 'documentation', 'article', 'mcq', 'practice'], required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  language: { type: String, default: 'English' },
  durationOrReadTime: { type: String, default: '15 mins' },
  description: { type: String },
  isOfficialSource: { type: Boolean, default: false },
  availabilityStatus: { type: String, enum: ['available', 'unavailable', 'unknown', 'archived'], default: 'available' },
  publicationDate: { type: String },
  lastCheckedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  authorOrChannel: { type: String },
  provenance: { type: String, enum: ['curated', 'admin_entered'], default: 'curated' },
  verificationStatus: { type: String, default: 'unable_to_verify' },
  verificationReport: { type: Object }
}, { timestamps: true });

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  topicId: { type: String, required: true, index: true },
  subtopic: { type: String, required: true },
  correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, required: true },
  citationTitle: { type: String, required: true },
  citationUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const AttemptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  topicId: { type: String, required: true },
  topicTitle: { type: String, required: true },
  answers: [{
    questionId: String,
    subtopic: String,
    selectedOption: Number,
    correctOption: Number,
    isCorrect: Boolean,
    explanation: String,
    citationTitle: String,
    citationUrl: String
  }],
  totalScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  scorePercentage: { type: Number, required: true },
  status: { type: String, default: 'completed' },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Session = mongoose.model('Session', SessionSchema);
const StudentState = mongoose.model('StudentState', StudentStateSchema);
const PlatformState = mongoose.model('PlatformState', PlatformStateSchema);
const Topic = mongoose.model('Topic', TopicSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Question = mongoose.model('Question', QuestionSchema);
const Attempt = mongoose.model('Attempt', AttemptSchema);

const INITIAL_QUESTION_KEYS = [
  { id: 'q1', topicId: 'topic_event_loop', subtopic: 'Event Loop Phases', correctOptionIndex: 2, explanation: 'setImmediate callbacks execute during the check phase.', citationTitle: 'Node.js Event Loop', citationUrl: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#check' },
  { id: 'q2', topicId: 'topic_event_loop', subtopic: 'Event Loop Phases', correctOptionIndex: 1, explanation: 'When poll is idle and setImmediate callbacks are queued, execution advances to check.', citationTitle: 'Node.js Event Loop', citationUrl: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#poll' },
  { id: 'q3', topicId: 'topic_event_loop', subtopic: 'Microtask Execution Order', correctOptionIndex: 1, explanation: 'Node drains process.nextTick callbacks before Promise microtasks.', citationTitle: 'Node.js process.nextTick', citationUrl: 'https://nodejs.org/api/process.html#processnexttickcallback-args' },
  { id: 'q4', topicId: 'topic_event_loop', subtopic: 'Microtask Execution Order', correctOptionIndex: 1, explanation: 'Recursive nextTick scheduling can starve I/O and prevent later phases from running.', citationTitle: 'Node.js process.nextTick', citationUrl: 'https://nodejs.org/api/process.html#processnexttickcallback-args' },
  { id: 'q5', topicId: 'topic_buffers_streams', subtopic: 'Buffer Allocation Safety', correctOptionIndex: 1, explanation: 'The deprecated constructor may expose uninitialized memory; use Buffer.alloc when zero-fill is required.', citationTitle: 'Node.js Buffer', citationUrl: 'https://nodejs.org/api/buffer.html#bufferallocunsafe-size' },
  { id: 'q6', topicId: 'topic_buffers_streams', subtopic: 'Stream Backpressure Signals', correctOptionIndex: 1, explanation: 'A false write result signals backpressure; pause until drain.', citationTitle: 'Node.js Backpressure', citationUrl: 'https://nodejs.org/en/learn/modules/backpressuring-in-streams' },
  { id: 'q7', topicId: 'topic_buffers_streams', subtopic: 'Stream Backpressure Signals', correctOptionIndex: 1, explanation: 'stream.pipeline coordinates backpressure, errors, and teardown.', citationTitle: 'Node.js Streams', citationUrl: 'https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback' },
  { id: 'q8', topicId: 'topic_cluster_scaling', subtopic: 'Cluster Socket Sharing', correctOptionIndex: 1, explanation: 'By default the primary accepts connections and distributes handles to workers using round-robin scheduling.', citationTitle: 'Node.js Cluster', citationUrl: 'https://nodejs.org/api/cluster.html#how-it-works' }
];

async function seedQuestionBank() {
  await Question.bulkWrite(INITIAL_QUESTION_KEYS.map((question) => ({
    updateOne: {
      filter: { id: question.id },
      update: { $setOnInsert: question },
      upsert: true
    }
  })), { ordered: false });
}

// ----------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    databaseConnected: isDbConnected,
    databaseName: 'cognipath_ai',
    databaseHost: mongoose.connection.host || null,
    googleAiConfigured: Boolean(GOOGLE_GEMINI_API_KEY),
    port: PORT
  });
});

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function getBearerToken(req) {
  const [scheme, token] = String(req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

async function issueSession(user) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await Session.create({
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    userId: user._id,
    expiresAt
  });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      targetGoal: user.targetGoal,
      currentSkillLevel: user.currentSkillLevel,
      preferredLanguage: user.preferredLanguage,
      registeredDate: user.registeredDate,
      status: user.status
    },
    expiresAt: expiresAt.getTime()
  };
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (!session) return res.status(401).json({ error: 'Session is invalid or expired.' });

    const user = await User.findById(session.userId);
    if (!user || user.status !== 'active') {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ error: 'Account is unavailable.' });
    }

    req.auth = { user, session };
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication could not be verified.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator permission required.' });
  }
  next();
}

// ----------------------------------------------------
// Real Authentication Endpoints
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail }).select('+password +passwordHash');

    // Seed default student if requested demo account
    if (!user && cleanEmail === 'alex.rivera@university.edu') {
      user = await User.create({
        id: 'usr_student_01',
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        passwordHash: await hashPassword('password123'),
        role: 'student',
        targetGoal: 'Master Production Node.js Architecture & Performance Engineering',
        currentSkillLevel: 'intermediate',
        preferredLanguage: 'JavaScript / TypeScript'
      });
    }

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    let passwordIsValid = user.passwordHash
      ? await verifyPassword(password, user.passwordHash)
      : user.password === password;
    if (!passwordIsValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.passwordHash) {
      user.passwordHash = await hashPassword(password);
      user.password = undefined;
      await user.save();
    }

    const session = await issueSession(user);

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Login could not be completed.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, targetGoal, currentSkillLevel, preferredLanguage } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, error: 'Provide a valid name, email, and password of 8-128 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Account with this email already exists.' });
    }

    const newStudent = await User.create({
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: await hashPassword(password),
      role: 'student', // Enforce Student role strictly
      targetGoal: targetGoal?.trim() || 'Master Full-Stack Software Engineering',
      currentSkillLevel: currentSkillLevel || 'beginner',
      preferredLanguage: typeof preferredLanguage === 'string' ? preferredLanguage.slice(0, 80) : 'JavaScript / TypeScript'
    });

    const session = await issueSession(newStudent);

    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Registration could not be completed.' });
  }
});

app.post('/api/auth/bootstrap-admin', async (req, res) => {
  try {
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!bootstrapSecret) return res.status(404).json({ error: 'Admin bootstrap is not enabled.' });
    if (await User.exists({ role: 'admin', status: 'active' })) {
      return res.status(409).json({ error: 'An active administrator already exists.' });
    }
    const suppliedSecret = req.get('x-admin-bootstrap-secret') || '';
    const expected = Buffer.from(bootstrapSecret);
    const supplied = Buffer.from(suppliedSecret);
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
      return res.status(401).json({ error: 'Invalid bootstrap credentials.' });
    }

    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'Admin requires a valid name/email and a 12-128 character password.' });
    }

    const admin = await User.create({
      id: `usr_admin_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
      role: 'admin',
      targetGoal: 'Platform administration',
      currentSkillLevel: 'advanced',
      preferredLanguage: 'English'
    });
    res.status(201).json({ success: true, session: await issueSession(admin) });
  } catch (error) {
    res.status(500).json({ error: 'Administrator bootstrap failed.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.auth.user.id,
      name: req.auth.user.name,
      email: req.auth.user.email,
      role: req.auth.user.role,
      targetGoal: req.auth.user.targetGoal,
      currentSkillLevel: req.auth.user.currentSkillLevel,
      preferredLanguage: req.auth.user.preferredLanguage,
      registeredDate: req.auth.user.registeredDate,
      status: req.auth.user.status
    }
  });
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const { name, targetGoal, currentSkillLevel, preferredLanguage } = req.body || {};
  const updates = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.length > 100) {
      return res.status(400).json({ error: 'Name must be 1-100 characters.' });
    }
    updates.name = name.trim();
  }
  if (targetGoal !== undefined) updates.targetGoal = String(targetGoal).slice(0, 200);
  if (currentSkillLevel !== undefined) {
    if (!['beginner', 'intermediate', 'advanced'].includes(currentSkillLevel)) {
      return res.status(400).json({ error: 'Invalid skill level.' });
    }
    updates.currentSkillLevel = currentSkillLevel;
  }
  if (preferredLanguage !== undefined) updates.preferredLanguage = String(preferredLanguage).slice(0, 80);

  try {
    const user = await User.findByIdAndUpdate(req.auth.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        targetGoal: user.targetGoal,
        currentSkillLevel: user.currentSkillLevel,
        preferredLanguage: user.preferredLanguage,
        registeredDate: user.registeredDate,
        status: user.status
      }
    });
  } catch {
    res.status(500).json({ error: 'Profile could not be updated.' });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await Session.deleteOne({ _id: req.auth.session._id });
  res.json({ success: true, message: 'Logged out successfully.' });
});

const STUDENT_STATE_KEYS = new Set([
  'savedRoadmaps', 'activeRoadmapId', 'attempts', 'verificationHistory'
]);
const PLATFORM_STATE_KEYS = new Set([
  'catalog', 'resources', 'questions', 'reportedIssues', 'platformConfig'
]);
const STATE_ARRAY_KEYS = new Set([
  'savedRoadmaps', 'attempts', 'verificationHistory', 'catalog', 'resources',
  'questions', 'reportedIssues'
]);

app.get('/api/state', requireAuth, async (req, res) => {
  try {
    const [record, platform] = await Promise.all([
      StudentState.findOne({ userId: req.auth.user._id }).lean(),
      PlatformState.findOne({ key: 'primary' }).lean()
    ]);
    const hasState = record?.state || platform?.state;
    res.json({
      state: hasState ? { ...(platform?.state || {}), ...(record?.state || {}) } : null,
      hasStudentState: Boolean(record),
      updatedAt: record?.updatedAt || platform?.updatedAt || null
    });
  } catch {
    res.status(500).json({ error: 'Student state could not be loaded.' });
  }
});

app.put('/api/state', requireAuth, async (req, res) => {
  const input = req.body?.state;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return res.status(400).json({ error: 'A state object is required.' });
  }

  const studentState = {};
  const platformState = {};
  for (const [key, value] of Object.entries(input)) {
    if (!STUDENT_STATE_KEYS.has(key) && !(req.auth.user.role === 'admin' && PLATFORM_STATE_KEYS.has(key))) continue;
    if (STATE_ARRAY_KEYS.has(key) &&
      (!Array.isArray(value) || value.length > 5000)) {
      return res.status(400).json({ error: `Invalid or oversized ${key} collection.` });
    }
    if (PLATFORM_STATE_KEYS.has(key)) platformState[key] = value;
    else studentState[key] = value;
  }

  if (Buffer.byteLength(JSON.stringify({ studentState, platformState }), 'utf8') > 2 * 1024 * 1024) {
    return res.status(413).json({ error: 'State exceeds the 2 MB limit.' });
  }

  try {
    const writes = [StudentState.findOneAndUpdate(
      { userId: req.auth.user._id },
      { $set: { state: studentState } },
      { upsert: true, new: true, runValidators: true }
    )];
    if (req.auth.user.role === 'admin' && Object.keys(platformState).length > 0) {
      writes.push(PlatformState.findOneAndUpdate(
        { key: 'primary' },
        { $set: { state: platformState } },
        { upsert: true, new: true, runValidators: true }
      ));
    }
    await Promise.all(writes);
    res.json({ success: true, updatedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Student state could not be saved.' });
  }
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    targetGoal: user.targetGoal,
    currentSkillLevel: user.currentSkillLevel,
    preferredLanguage: user.preferredLanguage,
    registeredDate: user.registeredDate,
    status: user.status
  };
}

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { search = '', role = 'all', status = 'all', page = '1', limit = '5' } = req.query;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 5));
    const filter = {};
    if (role === 'student' || role === 'admin') filter.role = role;
    if (status === 'active' || status === 'suspended') filter.status = status;
    if (typeof search === 'string' && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
    }
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
      User.countDocuments(filter)
    ]);
    res.json({ users: users.map(publicUser), total, page: pageNumber, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch {
    res.status(500).json({ error: 'User directory could not be loaded.' });
  }
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const target = await User.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ error: 'User account not found.' });
    const { role, status } = req.body || {};
    if (role !== undefined && !['student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    if (status !== undefined && !['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    if (target._id.equals(req.auth.user._id) && (role === 'student' || status === 'suspended')) {
      return res.status(400).json({ error: 'You cannot remove or suspend your own administrator access.' });
    }
    if (target.role === 'admin' && target.status === 'active' && (role === 'student' || status === 'suspended')) {
      const otherActiveAdmins = await User.countDocuments({ role: 'admin', status: 'active', _id: { $ne: target._id } });
      if (otherActiveAdmins === 0) return res.status(400).json({ error: 'Cannot remove the last active administrator.' });
    }
    if (role !== undefined) target.role = role;
    if (status !== undefined) target.status = status;
    await target.save();
    if (target.status === 'suspended') await Session.deleteMany({ userId: target._id });
    res.json({ user: publicUser(target) });
  } catch {
    res.status(500).json({ error: 'User account could not be updated.' });
  }
});

app.get('/api/admin/metrics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, adminUsers, databaseTopics, databaseActiveTopics, databaseResources, attemptsCount, platform] = await Promise.all([
      User.countDocuments(), User.countDocuments({ status: 'active' }), User.countDocuments({ status: 'suspended' }), User.countDocuments({ role: 'admin' }),
      Topic.countDocuments(), Topic.countDocuments({ isActive: true }), Resource.countDocuments(),
      Attempt.countDocuments(), PlatformState.findOne({ key: 'primary' }).lean()
    ]);
    const topics = platform?.state?.catalog || [];
    const resources = platform?.state?.resources || [];
    const reports = platform?.state?.reportedIssues || [];
    const totalTopics = topics.length || databaseTopics;
    const activeTopics = topics.length ? topics.filter((topic) => topic.isActive !== false).length : databaseActiveTopics;
    const totalResources = resources.length || databaseResources;
    res.json({
      totalUsers, activeUsers, suspendedUsers, adminUsers, totalTopics, activeTopics,
      totalResources,
      availableResources: resources.length ? resources.filter((resource) => resource.availabilityStatus === 'available').length : await Resource.countDocuments({ availabilityStatus: 'available' }),
      unavailableResources: resources.length ? resources.filter((resource) => resource.availabilityStatus === 'unavailable').length : await Resource.countDocuments({ availabilityStatus: 'unavailable' }),
      archivedResources: resources.length ? resources.filter((resource) => resource.availabilityStatus === 'archived').length : await Resource.countDocuments({ availabilityStatus: 'archived' }),
      pendingReportsCount: reports.filter((issue) => issue.status === 'pending_review').length,
      resolvedReportsCount: reports.filter((issue) => issue.status === 'resolved').length,
      verifiedResourcesCount: resources.filter((resource) => resource.verificationStatus === 'verified_against_cited_references').length,
      potentialMismatchesCount: resources.filter((resource) => resource.verificationStatus === 'potential_mismatch').length,
      attemptsCount
    });
  } catch {
    res.status(500).json({ error: 'Administrator metrics could not be loaded.' });
  }
});

app.post('/api/resource-reports', requireAuth, async (req, res) => {
  const { resourceId, reason, studentNotes = '' } = req.body || {};
  const allowedReasons = ['broken_link', 'outdated_api', 'inaccurate_content', 'misleading_title'];
  if (typeof resourceId !== 'string' || !allowedReasons.includes(reason) ||
    typeof studentNotes !== 'string' || studentNotes.length > 1000) {
    return res.status(400).json({ error: 'Invalid resource report.' });
  }

  try {
    const platform = await PlatformState.findOne({ key: 'primary' }).lean();
    const resource = (platform?.state?.resources || []).find((item) => item.id === resourceId) ||
      await Resource.findOne({ id: resourceId }).lean();
    if (!resource) return res.status(404).json({ error: 'Resource was not found.' });
    const issue = {
      id: `rep_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      resourceId,
      resourceTitle: resource.title,
      reportedBy: req.auth.user.name,
      reportedAt: new Date().toISOString(),
      reason,
      studentNotes: studentNotes.trim() || 'No additional comment provided.',
      status: 'pending_review'
    };
    await PlatformState.findOneAndUpdate(
      { key: 'primary' },
      { $setOnInsert: { key: 'primary', state: {} }, $push: { 'state.reportedIssues': issue } },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, data: issue });
  } catch {
    res.status(500).json({ error: 'Resource report could not be saved.' });
  }
});

// ----------------------------------------------------
// Topics & Prerequisites Endpoints
// ----------------------------------------------------
app.get('/api/topics', requireAuth, async (req, res) => {
  try {
    const platform = await PlatformState.findOne({ key: 'primary' }).lean();
    const topics = platform?.state?.catalog
      ? platform.state.catalog.filter((topic) => topic.isActive !== false)
      : await Topic.find({ isActive: true });
    res.json({ success: true, count: topics.length, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Resources Catalog Endpoints
// ----------------------------------------------------
app.get('/api/resources', requireAuth, async (req, res) => {
  try {
    const { topicId, type, officialOnly } = req.query;
    const platform = await PlatformState.findOne({ key: 'primary' }).lean();
    if (Array.isArray(platform?.state?.resources)) {
      const filtered = platform.state.resources.filter((resource) => {
        if (resource.availabilityStatus === 'archived') return false;
        if (topicId && topicId !== 'all' && resource.topicId !== topicId) return false;
        if (type && type !== 'all' && resource.type !== type) return false;
        if (officialOnly === 'true' && !resource.isOfficialSource) return false;
        return true;
      });
      return res.json({ success: true, count: filtered.length, data: filtered });
    }
    const filter = { availabilityStatus: { $ne: 'archived' } };
    if (topicId && topicId !== 'all') filter.topicId = topicId;
    if (type && type !== 'all') filter.type = type;
    if (officialOnly === 'true') filter.isOfficialSource = true;

    const resources = await Resource.find(filter);
    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Assessment Scoring Endpoint
// ----------------------------------------------------
app.post('/api/assessments/submit', requireAuth, async (req, res) => {
  try {
    const { topicId, topicTitle, answers } = req.body || {};
    if (typeof topicId !== 'string' || typeof topicTitle !== 'string' ||
      !Array.isArray(answers) || answers.length > 100) {
      return res.status(400).json({ error: 'Invalid assessment submission.' });
    }

    const questions = await Question.find({ topicId, isActive: true }).lean();
    if (questions.length === 0) return res.status(404).json({ error: 'No active assessment exists for this topic.' });
    const selectedByQuestion = new Map();
    for (const answer of answers) {
      if (typeof answer?.questionId !== 'string' ||
        !Number.isInteger(answer.selectedOption) || answer.selectedOption < -1 || answer.selectedOption > 3) {
        return res.status(400).json({ error: 'Invalid answer selection.' });
      }
      selectedByQuestion.set(answer.questionId, answer.selectedOption);
    }

    let totalScore = 0;
    const scoredAnswers = questions.map((question) => {
      const selectedOption = selectedByQuestion.get(question.id) ?? -1;
      const isCorrect = selectedOption === question.correctOptionIndex;
      if (isCorrect) totalScore += 1;
      return {
        questionId: question.id,
        subtopic: question.subtopic,
        selectedOption,
        correctOption: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
        citationTitle: question.citationTitle,
        citationUrl: question.citationUrl
      };
    });
    const maxScore = questions.length;
    const scorePercentage = Math.round((totalScore / maxScore) * 100);

    const attempt = await Attempt.create({
      id: `att_${Date.now()}`,
      studentId: req.auth.user.id,
      topicId,
      topicTitle: topicTitle.slice(0, 200),
      answers: scoredAnswers,
      totalScore,
      maxScore,
      scorePercentage,
      status: 'completed'
    });

    res.json({ success: true, data: attempt });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/assessments/attempts', requireAuth, async (req, res) => {
  try {
    const attempts = await Attempt.find({ studentId: req.auth.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: attempts.length, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Listening
app.listen(PORT, () => {
  console.log(`[CogniPath Express Server] Student-Only API listening on http://localhost:${PORT}`);
});

module.exports = app;
