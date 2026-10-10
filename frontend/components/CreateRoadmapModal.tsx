import React, { useState } from 'react';
import {
  CreateRoadmapPayload,
  GoalCategory,
  SavedRoadmap,
  RoadmapNode
} from '../types';
import { geminiService } from '../services/geminiService';
import {
  Sparkles,
  X,
  Compass,
  Briefcase,
  BookOpen,
  Code2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Plus,
  Trash2
} from 'lucide-react';

interface CreateRoadmapModalProps {
  onClose: () => void;
  onRoadmapConfirmed: (roadmap: SavedRoadmap) => void;
}

export const CreateRoadmapModal: React.FC<CreateRoadmapModalProps> = ({
  onClose,
  onRoadmapConfirmed
}) => {
  // Step 1: Input & Personalization
  const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [category, setCategory] = useState<GoalCategory>('skill');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [priorKnowledge, setPriorKnowledge] = useState('');
  const [weeklyHours, setWeeklyHours] = useState<number>(8);
  const [targetFocus, setTargetFocus] = useState<'comprehensive' | 'project_oriented' | 'interview_prep' | 'exam_prep'>('comprehensive');

  // Step 2 & 3: Generated Roadmap Preview & Edit
  const [generatedRoadmap, setGeneratedRoadmap] = useState<SavedRoadmap | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suggested Goal Preset Chips
  const presetSuggestions = [
    { title: 'Android Development with Kotlin & Compose', category: 'skill' as GoalCategory, level: 'beginner' as const, hours: 10 },
    { title: 'Web Development with React & TypeScript', category: 'skill' as GoalCategory, level: 'intermediate' as const, hours: 8 },
    { title: 'Backend Developer with Java & Spring Boot', category: 'career' as GoalCategory, level: 'intermediate' as const, hours: 12 },
    { title: 'Data Structures and Algorithms in Python', category: 'skill' as GoalCategory, level: 'beginner' as const, hours: 6 },
    { title: 'Relational SQL & Database Architecture', category: 'skill' as GoalCategory, level: 'intermediate' as const, hours: 6 },
    { title: 'Machine Learning Fundamentals with PyTorch', category: 'skill' as GoalCategory, level: 'intermediate' as const, hours: 10 }
  ];

  const handleSelectPreset = (preset: typeof presetSuggestions[0]) => {
    setCategory(preset.category);
    setGoalTitle(preset.title);
    setSkillLevel(preset.level);
    setWeeklyHours(preset.hours);
  };

  const handleGenerate = async () => {
    if (!goalTitle.trim()) {
      setErrorMessage('Please specify what you want to learn.');
      return;
    }
    setErrorMessage(null);
    setStep('generating');

    try {
      const payload: CreateRoadmapPayload = {
        category,
        goalTitle: goalTitle.trim(),
        goalDescription: goalDescription.trim(),
        skillLevel,
        priorKnowledge: priorKnowledge.trim(),
        weeklyHours: Number(weeklyHours) || 8,
        targetFocus
      };

      const result = await geminiService.generatePersonalizedRoadmap(payload);
      setGeneratedRoadmap(result);
      setStep('preview');
    } catch (err: any) {
      console.error('Roadmap generation failed:', err);
      setErrorMessage(err.message || 'Failed to generate roadmap from Vertex AI. Please retry.');
      setStep('input');
    }
  };

  // Node editing handlers in preview
  const handleUpdateNodeTitle = (topicId: string, newTitle: string) => {
    if (!generatedRoadmap) return;
    const updatedNodes = generatedRoadmap.nodes.map((n) =>
      n.topicId === topicId ? { ...n, title: newTitle } : n
    );
    setGeneratedRoadmap({ ...generatedRoadmap, nodes: updatedNodes });
  };

  const handleDeleteNode = (topicId: string) => {
    if (!generatedRoadmap || generatedRoadmap.nodes.length <= 1) return;
    const updatedNodes = generatedRoadmap.nodes.filter((n) => n.topicId !== topicId);
    setGeneratedRoadmap({ ...generatedRoadmap, nodes: updatedNodes });
  };

  const handleConfirmAndSave = () => {
    if (!generatedRoadmap) return;
    onRoadmapConfirmed(generatedRoadmap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-5 my-auto transition-colors">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {step === 'preview' ? 'Review & Customize Roadmap' : 'Generate Personalized Learning Roadmap'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'preview'
                  ? 'Verify learning phases, topics, and prerequisites before starting.'
                  : 'Tell Vertex AI Gemini what skill or career you want to master.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: INPUT & PERSONALIZATION */}
        {step === 'input' && (
          <div className="space-y-4 text-xs">
            {/* Category Selector Tabs */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Goal Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'skill' as GoalCategory, label: 'New Skill', icon: Code2 },
                  { id: 'career' as GoalCategory, label: 'Career Role', icon: Briefcase },
                  { id: 'syllabus' as GoalCategory, label: 'Course Subject', icon: BookOpen },
                  { id: 'custom' as GoalCategory, label: 'Custom Goal', icon: Compass }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggested Preset Goal Pills */}
            <div className="space-y-1.5">
              <span className="font-medium text-slate-400 text-[10px] uppercase tracking-wider block">
                Popular Learning Goals (Click to Autofill)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetSuggestions.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Skill Input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                What do you want to learn? *
              </label>
              <input
                type="text"
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Android Development with Kotlin & Jetpack Compose"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Detail / Specific Outcome */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Specific Outcomes or Context (Optional)
              </label>
              <textarea
                rows={2}
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="e.g. I want to build a real offline-first social audio player app from scratch with Room DB and clean architecture."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Personalization Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                  Starting Proficiency
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="beginner">Beginner (Zero / Basic)</option>
                  <option value="intermediate">Intermediate (Familiar)</option>
                  <option value="advanced">Advanced (Deep Dive)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                  Weekly Study Hours
                </label>
                <input
                  type="number"
                  min={2}
                  max={40}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 8)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                  Pedagogical Focus
                </label>
                <select
                  value={targetFocus}
                  onChange={(e) => setTargetFocus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="comprehensive">Comprehensive Mastery</option>
                  <option value="project_oriented">Hands-on Project Building</option>
                  <option value="interview_prep">Technical Interview Prep</option>
                  <option value="exam_prep">College / Academic Exam</option>
                </select>
              </div>
            </div>

            {/* Prior Knowledge */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Prior Knowledge / Completed Prerequisites (Optional)
              </label>
              <input
                type="text"
                value={priorKnowledge}
                onChange={(e) => setPriorKnowledge(e.target.value)}
                placeholder="e.g. Basic Java syntax, Git, and basic OOP principles"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Roadmap with Gemini 2.5</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GENERATION IN PROGRESS */}
        {step === 'generating' && (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center mx-auto animate-pulse">
              <RotateCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Architecting Personalized Roadmap for "{goalTitle}"
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Calling Google Vertex AI / Gemini 2.5 Flash to decompose curriculum modules, enforce acyclic prerequisite ordering, and calculate study hour milestones...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CUSTOMIZATION */}
        {step === 'preview' && generatedRoadmap && (
          <div className="space-y-4 text-xs">
            {/* Overview Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-925 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {generatedRoadmap.title}
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Total ~{generatedRoadmap.totalEstimatedHours} Study Hours
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {generatedRoadmap.description}
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1">
                <span>{generatedRoadmap.phases.length} Phases</span>
                <span>•</span>
                <span>{generatedRoadmap.nodes.length} Topics</span>
                <span>•</span>
                <span>{generatedRoadmap.weeklyHours} hrs/week pace</span>
                <span>•</span>
                <span className="capitalize">{generatedRoadmap.skillLevel} Entry</span>
              </div>
            </div>

            {/* Editable Phases and Topics */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {generatedRoadmap.phases.map((phase) => {
                const phaseNodes = generatedRoadmap.nodes.filter((n) => n.phaseId === phase.id);

                return (
                  <div
                    key={phase.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {phase.title}
                      </span>
                      {phase.milestoneProject && (
                        <span className="text-[10px] text-indigo-600 dark:text-cyan-400 font-medium truncate max-w-xs">
                          Project: {phase.milestoneProject}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                      {phaseNodes.map((node) => (
                        <div
                          key={node.topicId}
                          className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <input
                              type="text"
                              value={node.title}
                              onChange={(e) => handleUpdateNodeTitle(node.topicId, e.target.value)}
                              className="font-semibold text-slate-800 dark:text-slate-200 bg-transparent text-xs focus:outline-none w-full"
                            />
                            <p className="text-[10px] text-slate-400 truncate">
                              {node.learningObjective}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-[10px] font-mono text-slate-400">
                              ~{node.estimatedHours}h
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNode(node.topicId)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                              title="Remove topic"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preview Footer Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Inputs</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Set as Active Roadmap</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
