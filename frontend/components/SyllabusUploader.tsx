import React, { useState, useRef, useEffect } from 'react';
import {
  ExtractedTopic,
  RoadmapNode,
  SubjectUnitGroup,
  SyllabusDraft,
  SyllabusFileMetadata
} from '../types';
import { SAMPLE_SYLLABUS_TEXT } from '../constants';
import { geminiService } from '../services/geminiService';
import { syllabusService } from '../services/syllabusService';
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
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  BookOpen,
  Edit3,
  X,
  AlertTriangle
} from 'lucide-react';

interface SyllabusUploaderProps {
  onRoadmapGenerated: (newRoadmap: RoadmapNode[]) => void;
  onCancel: () => void;
}

type IngestionTab = 'upload' | 'manual';

export const SyllabusUploader: React.FC<SyllabusUploaderProps> = ({
  onRoadmapGenerated,
  onCancel
}) => {
  // Input Step States
  const [activeTab, setActiveTab] = useState<IngestionTab>('upload');
  const [learningGoal, setLearningGoal] = useState(
    'Pass University Backend Architecture Exam & Master Production Node.js'
  );

  // Option A (Upload) states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<SyllabusFileMetadata | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option B (Manual Entry) states
  const [manualSubjectName, setManualSubjectName] = useState('Module 1: Core System Architecture');
  const [manualTopicInput, setManualTopicInput] = useState('');
  const [manualSubjects, setManualSubjects] = useState<
    { id: string; subject: string; topics: string[] }[]
  >([
    {
      id: 'subj_1',
      subject: 'Module 1: Architecture & Asynchronous Runtimes',
      topics: [
        'Event loop mechanics: Timers, pending callbacks, poll, check, close phases',
        'Microtasks (process.nextTick, Promise resolution) vs Macrotasks',
        'Thread pool offloading with libuv (DNS, File I/O, Crypto)'
      ]
    },
    {
      id: 'subj_2',
      subject: 'Module 2: Memory & High-Throughput Streams',
      topics: [
        'Buffer allocation: Buffer.alloc vs Buffer.allocUnsafe and zero-filling safety',
        'Stream pipeline mechanics: Readable, Writable, Transform, Duplex',
        'Backpressure handling and drain events in high concurrency'
      ]
    }
  ]);

  // Review & Extracted Topics State
  const [groups, setGroups] = useState<SubjectUnitGroup[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const existing = syllabusService.getDraft();
    if (existing && existing.groups && existing.groups.length > 0) {
      setHasSavedDraft(true);
    }
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Handle file drop or selection
  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    const validation = syllabusService.validateFile(file);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'Invalid file.');
      return;
    }

    setSelectedFile(file);
    setFileMetadata(validation.metadata || null);

    try {
      const text = await syllabusService.readTextFile(file);
      if (!text.trim()) {
        setErrorMessage('The selected file contains no readable text.');
        return;
      }
      setFileTextContent(text);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not extract text from the file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileMetadata(null);
    setFileTextContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Option B: Manual subject & topic helpers
  const handleAddManualTopic = (subjectId: string) => {
    if (!manualTopicInput.trim()) return;
    setManualSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, topics: [...s.topics, manualTopicInput.trim()] } : s))
    );
    setManualTopicInput('');
  };

  const handleRemoveManualTopic = (subjectId: string, topicIdx: number) => {
    setManualSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: s.topics.filter((_, idx) => idx !== topicIdx) } : s
      )
    );
  };

  const handleAddManualSubject = () => {
    if (!manualSubjectName.trim()) return;
    const newSubj = {
      id: `subj_${Date.now()}`,
      subject: manualSubjectName.trim(),
      topics: []
    };
    setManualSubjects((prev) => [...prev, newSubj]);
    setManualSubjectName('');
  };

  const handleRemoveManualSubject = (subjectId: string) => {
    setManualSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  // Run Vertex AI Topic Extraction
  const handleRunExtraction = async () => {
    setErrorMessage(null);
    let rawInputToProcess = '';

    if (activeTab === 'upload') {
      if (!fileTextContent.trim()) {
        setErrorMessage('Please upload a valid syllabus file (.txt, .md, .pdf) or paste syllabus text.');
        return;
      }
      rawInputToProcess = fileTextContent;
    } else {
      // Manual mode aggregation
      const hasTopics = manualSubjects.some((s) => s.topics.length > 0);
      if (!hasTopics) {
        setErrorMessage('Please add at least one subject with topics before extracting.');
        return;
      }
      rawInputToProcess = manualSubjects
        .map((s) => `${s.subject}:\n${s.topics.map((t) => `- ${t}`).join('\n')}`)
        .join('\n\n');
    }

    setIsProcessing(true);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 15 : p));
    }, 350);

    try {
      const extracted = await geminiService.extractTopicsFromSyllabus(rawInputToProcess);
      const grouped = syllabusService.groupTopicsBySubject(extracted);
      setUploadProgress(100);
      setGroups(grouped);
      showToast('Topics extracted successfully with Vertex AI Gemini 2.5 Flash');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'AI topic extraction failed. You can switch to Manual Entry fallback.'
      );
    } finally {
      clearInterval(progressTimer);
      setIsProcessing(false);
    }
  };

  // Review Page: Actions
  const handleToggleExpandGroup = (groupIdx: number) => {
    if (!groups) return;
    setGroups(
      groups.map((g, idx) => (idx === groupIdx ? { ...g, isExpanded: !g.isExpanded } : g))
    );
  };

  const handleUpdateGroupName = (groupIdx: number, newName: string) => {
    if (!groups) return;
    setGroups(
      groups.map((g, idx) => (idx === groupIdx ? { ...g, name: newName } : g))
    );
  };

  const handleAddSubjectToReview = () => {
    if (!groups) return;
    const newGroup: SubjectUnitGroup = {
      name: `New Subject Unit ${groups.length + 1}`,
      isExpanded: true,
      topics: [
        {
          id: `topic_${Date.now()}`,
          title: 'New Topic Title',
          unitOrModule: `New Subject Unit ${groups.length + 1}`,
          description: 'Description of expected skill competency',
          confidence: 'high',
          prerequisites: [],
          order: 1
        }
      ]
    };
    setGroups([...groups, newGroup]);
  };

  const handleRemoveSubjectFromReview = (groupIdx: number) => {
    if (!groups) return;
    setGroups(groups.filter((_, idx) => idx !== groupIdx));
  };

  const handleAddTopicToGroup = (groupIdx: number) => {
    if (!groups) return;
    const target = groups[groupIdx];
    const newTopic: ExtractedTopic = {
      id: `topic_${Date.now()}`,
      title: 'New Added Topic',
      unitOrModule: target.name,
      description: 'Learner-added syllabus topic',
      confidence: 'high',
      prerequisites: [],
      order: target.topics.length + 1
    };

    setGroups(
      groups.map((g, idx) => (idx === groupIdx ? { ...g, topics: [...g.topics, newTopic] } : g))
    );
  };

  const handleUpdateTopicInGroup = (
    groupIdx: number,
    topicIdx: number,
    updated: Partial<ExtractedTopic>
  ) => {
    if (!groups) return;
    setGroups(
      groups.map((g, gIdx) => {
        if (gIdx !== groupIdx) return g;
        return {
          ...g,
          topics: g.topics.map((t, tIdx) => (tIdx === topicIdx ? { ...t, ...updated } : t))
        };
      })
    );
  };

  const handleRemoveTopicFromGroup = (groupIdx: number, topicIdx: number) => {
    if (!groups) return;
    setGroups(
      groups.map((g, gIdx) => {
        if (gIdx !== groupIdx) return g;
        return {
          ...g,
          topics: g.topics.filter((_, tIdx) => tIdx !== topicIdx)
        };
      })
    );
  };

  const handleMoveTopic = (groupIdx: number, topicIdx: number, direction: 'up' | 'down') => {
    if (!groups) return;
    const group = groups[groupIdx];
    const newIdx = direction === 'up' ? topicIdx - 1 : topicIdx + 1;
    if (newIdx < 0 || newIdx >= group.topics.length) return;

    const reordered = [...group.topics];
    const temp = reordered[topicIdx];
    reordered[topicIdx] = reordered[newIdx];
    reordered[newIdx] = temp;

    setGroups(
      groups.map((g, gIdx) => (gIdx === groupIdx ? { ...g, topics: reordered } : g))
    );
  };

  // Draft Handling
  const handleSaveDraft = () => {
    if (!groups) return;
    const draft: SyllabusDraft = {
      id: `draft_${Date.now()}`,
      savedAt: new Date().toISOString(),
      learningGoal,
      sourceType: activeTab,
      fileName: fileMetadata?.name,
      groups
    };
    syllabusService.saveDraft(draft);
    setHasSavedDraft(true);
    showToast('Syllabus draft saved. You can restore it anytime.');
  };

  const handleRestoreDraft = () => {
    const draft = syllabusService.getDraft();
    if (!draft) return;
    setLearningGoal(draft.learningGoal || learningGoal);
    setGroups(draft.groups);
    showToast(`Restored draft from ${new Date(draft.savedAt).toLocaleDateString()}`);
  };

  // Final Confirmation & Roadmap Generation
  const handleConfirmTopics = () => {
    if (!groups || groups.length === 0) return;
    const flat = syllabusService.flattenGroups(groups);
    if (flat.length === 0) {
      setErrorMessage('Please ensure there is at least one topic before proceeding.');
      return;
    }

    // Transform confirmed topics into sequential roadmap nodes
    const roadmapNodes: RoadmapNode[] = flat.map((topic, index) => {
      return {
        topicId: topic.id,
        title: topic.title,
        unit: topic.unitOrModule,
        status: index === 0 ? 'available' : 'locked',
        order: index + 1,
        prerequisitesMet: index === 0
      };
    });

    syllabusService.clearDraft();
    onRoadmapGenerated(roadmapNodes);
  };

  // Count total topics and uncertain topics
  const totalTopicsCount = groups ? groups.reduce((acc, g) => acc + g.topics.length, 0) : 0;
  const uncertainTopicsCount = groups
    ? groups.reduce((acc, g) => acc + g.topics.filter((t) => t.confidence === 'uncertain').length, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-cyan-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Module 2: Syllabus Ingestion & Topic Review</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {groups ? 'Review & Edit Extracted Topics' : 'Ingest Course Syllabus & Learning Goals'}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              {groups
                ? 'Review extracted subjects, edit terminology, reorder modules, and flag uncertain topic mappings before generating your verified roadmap.'
                : 'Upload your course syllabus document (PDF/TXT) or manually enter topics. Our Vertex AI engine will extract competencies and sequence prerequisites.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {!groups && hasSavedDraft && (
              <button
                onClick={handleRestoreDraft}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Saved Draft</span>
              </button>
            )}

            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: INPUT PAGE (File Upload or Manual Entry) */}
      {!groups ? (
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-6">
          {/* Learning Goal Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              1. Target Learning Goal or Target Exam
            </label>
            <input
              type="text"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="e.g. Master Node.js Event Loop and Pass CS-302 University Exam"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Ingestion Mode Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Select Syllabus Ingestion Method
              </label>

              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    activeTab === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Option A: Upload File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                    activeTab === 'manual'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Option B: Manual Entry
                </button>
              </div>
            </div>
          </div>

          {/* OPTION A: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.md,.text"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                    isDragOver
                      ? 'border-indigo-400 bg-indigo-950/30'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
                  }`}
                >
                  <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-white">
                    Drag and drop syllabus file here, or{' '}
                    <span className="text-indigo-400 hover:underline">browse files</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Supported formats: Plain Text (.txt), Markdown (.md), PDF (.pdf). Maximum size: 5MB.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{fileMetadata?.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {fileMetadata ? `${(fileMetadata.size / 1024).toFixed(1)} KB` : ''} • Ready for AI extraction
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-xs text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Preset syllabus loader */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">Don't have a syllabus file ready?</span>
                <button
                  type="button"
                  onClick={() => {
                    setFileTextContent(SAMPLE_SYLLABUS_TEXT);
                    setFileMetadata({
                      name: 'CS-302_NodeJS_Internals.txt',
                      size: SAMPLE_SYLLABUS_TEXT.length,
                      type: 'text/plain',
                      lastModified: Date.now()
                    });
                    setSelectedFile(new File([SAMPLE_SYLLABUS_TEXT], 'CS-302_NodeJS_Internals.txt'));
                  }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Load Sample CS-302 Node.js Syllabus Preset
                </button>
              </div>

              {/* Text preview if loaded */}
              {fileTextContent && (
                <div className="mt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Extracted Text Preview:
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {fileTextContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* OPTION B: MANUAL SUBJECT & TOPIC ENTRY */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
                <div className="font-semibold text-cyan-400 mb-1">Manual Entry Instructions:</div>
                Define subjects/modules and add topics underneath each subject. You can edit, remove, and reorder them later in the Review screen.
              </div>

              {/* Add New Subject Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={manualSubjectName}
                  onChange={(e) => setManualSubjectName(e.target.value)}
                  placeholder="Subject or Module Name (e.g., Module 3: Scalability)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddManualSubject}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              {/* List of Manual Subjects with their Topics */}
              <div className="space-y-3">
                {manualSubjects.map((subj) => (
                  <div key={subj.id} className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-white text-xs">{subj.subject}</div>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualSubject(subj.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Topics under this subject */}
                    <ul className="space-y-1.5">
                      {subj.topics.length === 0 ? (
                        <li className="text-slate-500 text-[11px] italic">No topics added yet.</li>
                      ) : (
                        subj.topics.map((t, idx) => (
                          <li
                            key={idx}
                            className="bg-slate-800 p-2 rounded-lg text-xs text-slate-200 flex items-center justify-between"
                          >
                            <span>• {t}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveManualTopic(subj.id, idx)}
                              className="text-slate-500 hover:text-rose-400 ml-2"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>

                    {/* Quick Topic Add inside Subject */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add topic to this module..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddManualTopic(subj.id);
                          }
                        }}
                        onChange={(e) => setManualTopicInput(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddManualTopic(subj.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer for Step 1 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-white">
              Back to Dashboard
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRunExtraction}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vertex AI Extracting ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Topics & Continue to Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: EXTRACTED TOPICS REVIEW PAGE */
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {totalTopicsCount} Topics in {groups.length} Subjects
                </span>
                {uncertainTopicsCount > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{uncertainTopicsCount} Uncertain Mapping(s)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit titles, drag/reorder topics, resolve uncertain mappings, or add new subjects.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
              >
                <Save className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleAddSubjectToReview}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Subject</span>
              </button>
            </div>
          </div>

          {/* Grouped Subjects Accordion */}
          <div className="space-y-4">
            {groups.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Subject Header */}
                <div className="bg-slate-800/95 p-4 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center space-x-3 flex-1 mr-4">
                    <button
                      type="button"
                      onClick={() => handleToggleExpandGroup(groupIdx)}
                      className="text-slate-400 hover:text-white"
                    >
                      {group.isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleUpdateGroupName(groupIdx, e.target.value)}
                      className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-600 focus:border-indigo-500 focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {group.topics.length} topics
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddTopicToGroup(groupIdx)}
                      title="Add topic to this subject"
                      className="p-1.5 text-cyan-400 hover:bg-slate-700 rounded-lg text-xs flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubjectFromReview(groupIdx)}
                      title="Delete subject group"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Topics in Group */}
                {group.isExpanded && (
                  <div className="p-4 space-y-3 bg-slate-900/60">
                    {group.topics.length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-3 text-center">
                        No topics in this subject. Click "+" to add one.
                      </div>
                    ) : (
                      group.topics.map((topic, topicIdx) => {
                        const isUncertain = topic.confidence === 'uncertain';

                        return (
                          <div
                            key={topic.id}
                            className={`rounded-xl p-3.5 border transition ${
                              isUncertain
                                ? 'bg-amber-950/20 border-amber-500/40'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={topic.title}
                                    onChange={(e) =>
                                      handleUpdateTopicInGroup(groupIdx, topicIdx, {
                                        title: e.target.value
                                      })
                                    }
                                    placeholder="Topic title"
                                    className="font-bold text-xs text-white bg-transparent border-b border-slate-700 hover:border-slate-500 focus:border-indigo-500 focus:outline-none w-full"
                                  />

                                  {/* Confidence Pill */}
                                  <select
                                    value={topic.confidence}
                                    onChange={(e) =>
                                      handleUpdateTopicInGroup(groupIdx, topicIdx, {
                                        confidence: e.target.value as any
                                      })
                                    }
                                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-slate-900 ${
                                      topic.confidence === 'high'
                                        ? 'border-emerald-500 text-emerald-400'
                                        : topic.confidence === 'medium'
                                        ? 'border-indigo-500 text-indigo-400'
                                        : 'border-amber-500 text-amber-300'
                                    }`}
                                  >
                                    <option value="high">High Confidence</option>
                                    <option value="medium">Medium Confidence</option>
                                    <option value="uncertain">Uncertain Mapping</option>
                                  </select>
                                </div>

                                <input
                                  type="text"
                                  value={topic.description}
                                  onChange={(e) =>
                                    handleUpdateTopicInGroup(groupIdx, topicIdx, {
                                      description: e.target.value
                                    })
                                  }
                                  placeholder="Topic summary / key competency"
                                  className="text-xs text-slate-300 bg-transparent border-b border-slate-800 hover:border-slate-600 focus:border-indigo-500 focus:outline-none w-full"
                                />

                                {isUncertain && (
                                  <div className="text-[11px] text-amber-300/90 flex items-center space-x-1 pt-1">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>
                                      Uncertain mapping: AI detected ambiguous terminology. Please verify or correct the title.
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Ordering & Delete Actions */}
                              <div className="flex items-center space-x-1 text-slate-400">
                                <button
                                  type="button"
                                  disabled={topicIdx === 0}
                                  onClick={() => handleMoveTopic(groupIdx, topicIdx, 'up')}
                                  className="p-1 hover:text-white disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={topicIdx === group.topics.length - 1}
                                  onClick={() => handleMoveTopic(groupIdx, topicIdx, 'down')}
                                  className="p-1 hover:text-white disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTopicFromGroup(groupIdx, topicIdx)}
                                  className="p-1 hover:text-rose-400"
                                  title="Remove Topic"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Confirm & Back Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setGroups(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Back to Ingestion Source
            </button>

            <button
              type="button"
              onClick={handleConfirmTopics}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition"
            >
              <span>Confirm Topics & Generate Roadmap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
