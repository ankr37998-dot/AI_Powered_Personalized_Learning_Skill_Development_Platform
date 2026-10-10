/**
 * CogniPath AI - Express.js REST API Server
 * Database: MongoDB Atlas (Mongoose)
 * Model Runtime: Google Vertex AI / Gemini 2.5 Flash
 * Architecture: Student-Only Learning Platform with Real Authentication Endpoints
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');

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

// Rate Limiting on Authentication Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/', authLimiter);

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
// Mongoose Schemas & Models (Student-Only Model)
// ----------------------------------------------------
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: 'password123' },
  role: { type: String, default: 'student', enum: ['student'] },
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

const User = mongoose.model('User', UserSchema);
const Topic = mongoose.model('Topic', TopicSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Attempt = mongoose.model('Attempt', AttemptSchema);

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
// Real Authentication Endpoints
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Seed default student if requested demo account
    if (!user && cleanEmail === 'alex.rivera@university.edu') {
      user = await User.create({
        id: 'usr_student_01',
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        password: 'password123',
        role: 'student',
        targetGoal: 'Master Production Node.js Architecture & Performance Engineering',
        currentSkillLevel: 'intermediate',
        preferredLanguage: 'JavaScript / TypeScript'
      });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const session = {
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'student',
        targetGoal: user.targetGoal,
        currentSkillLevel: user.currentSkillLevel,
        preferredLanguage: user.preferredLanguage,
        registeredDate: user.registeredDate,
        status: user.status
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, targetGoal, currentSkillLevel } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
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
      password,
      role: 'student', // Enforce Student role strictly
      targetGoal: targetGoal?.trim() || 'Master Full-Stack Software Engineering',
      currentSkillLevel: currentSkillLevel || 'beginner',
      preferredLanguage: 'JavaScript / TypeScript'
    });

    const session = {
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      user: {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        role: 'student',
        targetGoal: newStudent.targetGoal,
        currentSkillLevel: newStudent.currentSkillLevel,
        preferredLanguage: newStudent.preferredLanguage,
        registeredDate: newStudent.registeredDate,
        status: newStudent.status
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
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
// Assessment Scoring Endpoint
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
// Vertex AI / Gemini Doubt Solver Endpoint
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

// Start Listening
app.listen(PORT, () => {
  console.log(`[CogniPath Express Server] Student-Only API listening on http://localhost:${PORT}`);
});

module.exports = app;
