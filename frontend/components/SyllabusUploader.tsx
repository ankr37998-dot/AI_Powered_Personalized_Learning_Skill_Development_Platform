import React, { useState } from 'react';
import { ExtractedTopic, RoadmapNode } from '../types';
import { SAMPLE_SYLLABUS_TEXT } from '../constants';
import { geminiService } from '../services/geminiService';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface SyllabusUploaderProps {
  onRoadmapGenerated: (newRoadmap: RoadmapNode[]) => void;
  onCancel: () => void;
}

export const SyllabusUploader: React.FC<SyllabusUploaderProps> = ({
  onRoadmapGenerated,
  onCancel
}) => {
  const [syllabusText, setSyllabusText] = useState(SAMPLE_SYLLABUS_TEXT);
  const [learningGoal, setLearningGoal] = useState('Pass University Backend Architecture Exam & Master Production Node.js');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTopics, setExtractedTopics] = useState<ExtractedTopic[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse topics using Gemini
  const handleExtractTopics = async () => {
    if (!syllabusText.trim()) {
      setErrorMessage('Please provide syllabus content or upload a text file.');
      return;
    }
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const results = await geminiService.extractTopicsFromSyllabus(syllabusText);
      setExtractedTopics(results);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract topics from syllabus.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTopic = (index: number, updated: Partial<ExtractedTopic>) => {
    if (!extractedTopics) return;
    const clone = [...extractedTopics];
    clone[index] = { ...clone[index], ...updated };
    setExtractedTopics(clone);
  };

  const handleRemoveTopic = (index: number) => {
    if (!extractedTopics) return;
    const clone = extractedTopics.filter((_, i) => i !== index);
    setExtractedTopics(clone);
  };

  const handleAddCustomTopic = () => {
    const newTopic: ExtractedTopic = {
      id: `custom_${Date.now()}`,
      title: 'New Custom Topic',
      unitOrModule: 'Custom Module',
      description: 'Learner-added syllabus topic',
      confidence: 'high',
      prerequisites: []
    };
    setExtractedTopics([...(extractedTopics || []), newTopic]);
  };

  const handleConfirmAndBuildRoadmap = () => {
    if (!extractedTopics || extractedTopics.length === 0) return;

    // Convert extracted topics into roadmap sequence respecting prerequisites
    const nodes: RoadmapNode[] = extractedTopics.map((topic, index) => {
      return {
        topicId: topic.id,
        title: topic.title,
        unit: topic.unitOrModule,
        status: index === 0 ? 'available' : 'locked',
        order: index + 1,
        prerequisitesMet: index === 0
      };
    });

    onRoadmapGenerated(nodes);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Syllabus Parsing & Topic Alignment Engine</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">Upload or Ingest Course Syllabus</h2>
        <p className="text-sm text-slate-300">
          Our Vertex AI curriculum parser inspects syllabus modules, tags prerequisite dependencies, and aligns terminology with official engineering competencies.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Input form (when not yet confirmed extracted topics) */}
      {!extractedTopics ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Learning Goal / Target Exam
            </label>
            <input
              type="text"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="e.g., Master Node.js Event Loop and Build Distributed Services"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Syllabus Content (Plain Text, Markdown, or Course Units)
              </label>
              <button
                type="button"
                onClick={() => setSyllabusText(SAMPLE_SYLLABUS_TEXT)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Load CS-302 Node.js Syllabus Preset
              </button>
            </div>
            <textarea
              rows={9}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste syllabus modules, topics, or chapters here..."
              className="w-full font-mono text-xs bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExtractTopics}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract & Align Topics</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Extracted topics review & editing table */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-700">
            <div>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {extractedTopics.length} Topics Extracted
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Review, modify, or add topics before generating the verified roadmap.
              </p>
            </div>
            <button
              onClick={handleAddCustomTopic}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-600 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Topic</span>
            </button>
          </div>

          <div className="space-y-3">
            {extractedTopics.map((topic, idx) => (
              <div
                key={topic.id}
                className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Unit / Module</label>
                      <input
                        type="text"
                        value={topic.unitOrModule}
                        onChange={(e) => handleUpdateTopic(idx, { unitOrModule: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Topic Title</label>
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => handleUpdateTopic(idx, { title: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveTopic(idx)}
                    title="Remove topic"
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Learning Description</label>
                  <input
                    type="text"
                    value={topic.description}
                    onChange={(e) => handleUpdateTopic(idx, { description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Mapping Confidence:</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        topic.confidence === 'high'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : topic.confidence === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {topic.confidence}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">Order Index: #{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button
              onClick={() => setExtractedTopics(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Back to Syllabus Input
            </button>

            <button
              onClick={handleConfirmAndBuildRoadmap}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition"
            >
              <span>Confirm & Generate Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
