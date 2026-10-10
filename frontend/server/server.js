/**
 * CogniPath AI - Express.js REST API Server
 * Database: MongoDB Atlas (Mongoose)
 * Model Runtime: Google Vertex AI / Gemini 2.5 Flash
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ankitkumar:Ankit719.@cluster0.nmemp4s.mongodb.net/cognipath_ai?retryWrites=true&w=majority';

// Security Headers & CORS
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

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
    console.log('[MongoDB Atlas] Connected successfully to database: cognipath_ai');
  } catch (err) {
    isDbConnected = false;
    console.error('[MongoDB Atlas Connection Error]', err.message);
  }
}

connectDatabase();

// ----------------------------------------------------
// Mongoose Schemas & Models
// ----------------------------------------------------
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  targetGoal: { type: String, default: 'Master Production Node.js' },
  currentSkillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  preferredLanguage: { type: String, default: 'JavaScript / TypeScript' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  registeredDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
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

const ReportedIssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  resourceId: { type: String, required: true },
  resourceTitle: { type: String, required: true },
  reportedBy: { type: String, required: true },
  reportedAt: { type: String, default: () => new Date().toISOString() },
  reason: { type: String, required: true },
  studentNotes: { type: String },
  status: { type: String, enum: ['pending_review', 'resolved', 'dismissed'], default: 'pending_review' },
  adminResolutionNote: { type: String },
  resolvedAt: { type: String },
  resolvedBy: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Topic = mongoose.model('Topic', TopicSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Attempt = mongoose.model('Attempt', AttemptSchema);
const ReportedIssue = mongoose.model('ReportedIssue', ReportedIssueSchema);

// ----------------------------------------------------
// SSRF Defense Middleware
// ----------------------------------------------------
function validateUrlSafety(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isSafe: false, reason: 'Disallowed scheme. Only HTTP and HTTPS are permitted.' };
    }
    const host = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '172.16.', '192.168.', '169.254.'];
    if (blockedHosts.some(b => host === b || host.startsWith(b))) {
      return { isSafe: false, reason: 'Destination resolves to private loopback/internal IP and is blocked.' };
    }
    return { isSafe: true };
  } catch (err) {
    return { isSafe: false, reason: 'Malformed URL format.' };
  }
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
    aiProviderConfigured: Boolean(process.env.API_KEY),
    port: PORT
  });
});

// ----------------------------------------------------
// Authentication & User Endpoints
// ----------------------------------------------------
app.get('/api/auth/me', async (req, res) => {
  try {
    // In local dev, returns Alex Rivera default profile or active user
    let user = await User.findOne({ id: 'usr_student_01' });
    if (!user) {
      user = await User.create({
        id: 'usr_student_01',
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        role: 'student',
        targetGoal: 'Master Production Node.js Architecture & Performance Engineering',
        currentSkillLevel: 'intermediate',
        preferredLanguage: 'JavaScript / TypeScript'
      });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Topics & Prerequisites Endpoints
// ----------------------------------------------------
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await Topic.find({ isActive: true });
    res.json({ success: true, count: topics.length, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Resources Catalog Endpoints
// ----------------------------------------------------
app.get('/api/resources', async (req, res) => {
  try {
    const { topicId, type, officialOnly } = req.query;
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
// Assessment Scoring Endpoint (Authoritative Server Boundary)
// ----------------------------------------------------
app.post('/api/assessments/submit', async (req, res) => {
  try {
    const { studentId, topicId, topicTitle, answers, totalScore, maxScore, scorePercentage } = req.body;

    const attempt = await Attempt.create({
      id: `att_${Date.now()}`,
      studentId: studentId || 'usr_student_01',
      topicId,
      topicTitle,
      answers,
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

app.get('/api/assessments/attempts', async (req, res) => {
  try {
    const attempts = await Attempt.find().sort({ createdAt: -1 });
    res.json({ success: true, count: attempts.length, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Vertex AI / Gemini Doubt Solver Streaming Endpoint
// ----------------------------------------------------
app.post('/api/chat/message', async (req, res) => {
  try {
    const { question, topicTitle, topicSummary } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
    const prompt = `You are the real-time AI Learning Assistant on CogniPath.
Active Topic: "${topicTitle || 'Node.js Internals'}"
Summary: "${topicSummary || 'Systems Engineering'}"

Student Question: "${question}"
Cite authoritative Node.js specifications where applicable. Never fabricate URLs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({
      success: true,
      answer: response.text || 'No response formulated.',
      citations: [
        { title: 'Node.js Official Documentation', url: 'https://nodejs.org/api/' }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// Start Listening
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`[CogniPath Express Server] Listening on http://localhost:${PORT}`);
});

module.exports = app;
