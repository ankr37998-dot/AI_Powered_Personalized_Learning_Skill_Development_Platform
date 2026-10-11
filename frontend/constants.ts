import {
  CatalogTopic,
  LearningResource,
  AssessmentQuestion,
  ReportedResourceIssue,
  PlatformConfig,
} from "./types";

export const SAMPLE_SYLLABUS_TEXT = `Course Code: CS-302
Title: Advanced Backend Architecture & Node.js Internals
University Department of Computer Science

Module 1: Architecture & Asynchronous Runtimes
- Event loop mechanics: Timers, pending callbacks, poll, check, close phases
- Microtasks (process.nextTick, Promise resolution) vs Macrotasks
- Thread pool offloading with libuv (DNS, File I/O, Crypto)

Module 2: Memory & High-Throughput Streams
- Buffer allocation: Buffer.alloc vs Buffer.allocUnsafe and zero-filling safety
- Stream pipeline mechanics: Readable, Writable, Transform, Duplex
- Backpressure handling and drain events in high concurrency

Module 3: Scalability & Process Management
- Cluster module: Master-worker process coordination and IPC
- Zero-downtime graceful shutdown signals (SIGTERM, SIGINT)
- Worker threads for CPU-bound computations vs child processes`;

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  verificationStrictness: "strict",
  allowManualAssessmentOverride: false,
  maxDailyDoubtQueriesPerStudent: 100,
  maintenanceMode: false,
};

export const CURATED_CATALOG: CatalogTopic[] = [
  {
    id: "topic_event_loop",
    title: "Node.js Event Loop & Libuv Architecture",
    category: "Backend Core",
    difficulty: "intermediate",
    summary:
      "Mechanics of the single-threaded event loop, 6 distinct phases, and libuv asynchronous OS abstraction.",
    prerequisiteIds: [],
    keyCompetencies: [
      "Identify exactly which phase setImmediate vs setTimeout executes in",
      "Distinguish libuv thread pool operations from V8 JavaScript execution",
      "Diagnose event loop lag using perf_hooks",
    ],
    officialDocSources: [
      {
        title: "The Node.js Event Loop, Timers, and process.nextTick()",
        url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
        authorityName: "Node.js Official Documentation",
      },
      {
        title: "Libuv Design Overview",
        url: "https://docs.libuv.org/en/v1.x/design.html",
        authorityName: "Libuv Documentation",
      },
    ],
  },
  {
    id: "topic_microtasks",
    title: "Microtasks: process.nextTick & Promises",
    category: "Backend Core",
    difficulty: "intermediate",
    summary:
      "Order of execution between nextTickQueue, Promise microtask queue, and phase transitions.",
    prerequisiteIds: ["topic_event_loop"],
    keyCompetencies: [
      "Predict interleaved console logs of process.nextTick and Promise.resolve",
      "Prevent event loop starvation caused by recursive nextTick calls",
    ],
    officialDocSources: [
      {
        title: "process.nextTick() API Docs",
        url: "https://nodejs.org/api/process.html#processnexttickcallback-args",
        authorityName: "Node.js API Reference",
      },
    ],
  },
  {
    id: "topic_buffers_streams",
    title: "Buffers, Binary Data & Backpressure",
    category: "Data Flow",
    difficulty: "advanced",
    summary:
      "Raw memory allocation outside the V8 heap, zero-fill guarantees, stream pipelines, and backpressure signals.",
    prerequisiteIds: ["topic_event_loop"],
    keyCompetencies: [
      "Implement stream.pipeline to prevent file descriptor leaks",
      "Respect writable.write() return false and listen for drain event",
      "Audit code for deprecated and insecure new Buffer() usage",
    ],
    officialDocSources: [
      {
        title: "Stream Module & Backpressure Guide",
        url: "https://nodejs.org/en/learn/modules/backpressuring-in-streams",
        authorityName: "Node.js Official Guide",
      },
      {
        title: "Buffer Module API",
        url: "https://nodejs.org/api/buffer.html",
        authorityName: "Node.js API Reference",
      },
    ],
  },
  {
    id: "topic_cluster_scaling",
    title: "Process Management, Clustering & IPC",
    category: "Distributed Systems",
    difficulty: "advanced",
    summary:
      "Multi-core scaling via the cluster module, round-robin socket delegation, inter-process communication, and graceful exit.",
    prerequisiteIds: ["topic_buffers_streams", "topic_microtasks"],
    keyCompetencies: [
      "Design master-worker architecture with zero-downtime rolling restart",
      "Handle IPC messaging between child processes without race conditions",
      "Intercept SIGTERM/SIGINT and close open server listeners cleanly",
    ],
    officialDocSources: [
      {
        title: "Cluster Module Specification",
        url: "https://nodejs.org/api/cluster.html",
        authorityName: "Node.js API Reference",
      },
    ],
  },
];

export const INITIAL_RESOURCES: LearningResource[] = [
  // --- Node.js & Core Backend ---
  {
    id: "res_1",
    topicId: "topic_event_loop",
    subtopics: ["Event Loop Phases", "Task Queue", "Call Stack"],
    title: "What the heck is the event loop anyway? (JSConf EU)",
    url: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
    platform: "YouTube",
    type: "video",
    difficulty: "beginner",
    language: "English",
    durationOrReadTime: "26 mins",
    description:
      "A foundational visualization of the browser/v8 event loop, explaining how asynchronous queues interact with the single thread.",
    isOfficialSource: false,
    availabilityStatus: "available",
    publicationDate: "2014-10-09",
    lastCheckedDate: "2025-02-14",
    authorOrChannel: "Philip Roberts",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
    verificationReport: {
      id: "ver_init_1",
      resourceId: "res_1",
      resourceTitle: "What the heck is the event loop anyway? (JSConf EU)",
      resourceUrl: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
      topicId: "topic_event_loop",
      status: "verified_against_cited_references",
      errorCategory: "none",
      checkedAt: "2025-02-14T10:30:00Z",
      assessedContentScope:
        "Assessed public transcript segments covering Call Stack, Web APIs, Task Queue, and Event Loop tick dispatching.",
      contentAccessMethod: "public_transcript",
      officialDocLinks: [
        {
          title: "HTML Standard - Event Loop & Task Queue",
          url: "https://html.spec.whatwg.org/multipage/webappapis.html#event-loops",
          authority: "WHATWG",
        },
        {
          title: "Node.js Event Loop Guide",
          url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
          authority: "Node.js Foundation",
        },
      ],
      findings: [
        "Accurately explains the distinction between synchronous call stack execution and async queues.",
        "Uses browser-centric abstractions (setTimeout WebAPI) which faithfully mirrors ECMAScript event loop fundamentals.",
      ],
      claims: [
        {
          claim:
            "setTimeout callbacks run only after the synchronous call stack empties.",
          officialDocReference:
            "WHATWG Section 8.1.6.1 step 4: Run the oldest task on one task queue.",
          officialDocUrl:
            "https://html.spec.whatwg.org/multipage/webappapis.html",
          matchStatus: "aligned",
          explanation: "Call stack must clear before dequeuing the task.",
        },
      ],
      limitations: [
        "Does not detail Node.js multi-phase event loop (timers, poll, check) since lecture focuses on browser V8/WebAPIs.",
      ],
    },
  },
  {
    id: "res_2",
    topicId: "topic_event_loop",
    subtopics: [
      "Event Loop Phases",
      "Timers Phase",
      "Poll Phase",
      "Check Phase",
    ],
    title: "The Node.js Event Loop, Timers, and process.nextTick() Guide",
    url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
    platform: "Node.js Official Documentation",
    type: "documentation",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "15 mins read",
    description:
      "The authoritative official guide describing the six distinct event loop phases in Node.js, the poll phase FIFO, and setImmediate execution.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-20",
    authorOrChannel: "Node.js Technical Steering Committee",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
    verificationReport: {
      id: "ver_init_2",
      resourceId: "res_2",
      resourceTitle: "The Node.js Event Loop Guide",
      resourceUrl:
        "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
      topicId: "topic_event_loop",
      status: "verified_against_cited_references",
      errorCategory: "none",
      checkedAt: "2025-02-20T08:00:00Z",
      assessedContentScope:
        "Official Node.js documentation publication maintained by the runtime steering committee.",
      contentAccessMethod: "official_spec_ingest",
      officialDocLinks: [
        {
          title: "Node.js Event Loop Guide",
          url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
          authority: "Node.js Official",
        },
      ],
      findings: [
        "Serves as the benchmark specification authority for Node.js event-loop semantics.",
      ],
      claims: [
        {
          claim:
            "Node.js event loop runs in 6 distinct phases: timers, pending callbacks, idle/prepare, poll, check, close callbacks.",
          officialDocReference: "Node.js Official Guide: Phases Overview",
          officialDocUrl:
            "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
          matchStatus: "aligned",
          explanation: "Authoritative ground-truth reference.",
        },
      ],
      limitations: [
        "Primary source documentation; no external claims evaluated.",
      ],
    },
  },
  {
    id: "res_3",
    topicId: "topic_microtasks",
    subtopics: ["Microtask Execution Order", "nextTickQueue", "Promise Queue"],
    title: "Node.js process.nextTick() Official Specification",
    url: "https://nodejs.org/api/process.html#processnexttickcallback-args",
    platform: "Node.js API Reference",
    type: "documentation",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "10 mins read",
    description:
      "Authoritative reference explaining the nextTickQueue priority over the ECMAScript microtask queue and phase transitions.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-21",
    authorOrChannel: "Node.js Project",
    provenance: "curated",
    verificationStatus: "unable_to_verify",
  },
  {
    id: "res_4",
    topicId: "topic_buffers_streams",
    subtopics: ["Stream Backpressure Signals", "Drain Event", "HighWaterMark"],
    title: "Backpressuring in Streams: Complete Guide",
    url: "https://nodejs.org/en/learn/modules/backpressuring-in-streams",
    platform: "Node.js Guides",
    type: "documentation",
    difficulty: "advanced",
    language: "English",
    durationOrReadTime: "12 mins read",
    description:
      "In-depth explanation of how stream pipelines prevent memory bloat by honoring the return value of writable.write() and listening for the drain event.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-18",
    authorOrChannel: "Node.js Documentation Team",
    provenance: "curated",
    verificationStatus: "unable_to_verify",
  },
  {
    id: "res_5",
    topicId: "topic_buffers_streams",
    subtopics: ["Buffer Allocation Safety", "Zero-Filling Memory"],
    title: 'Legacy Tutorial: "Buffer(size) is standard for raw memory in Node"',
    url: "https://example.com/legacy-buffer-guide-2015",
    platform: "Tech Blog Archive",
    type: "article",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "8 mins read",
    description:
      "Outdated 2015 blog post instructing developers to invoke the deprecated new Buffer(size) constructor.",
    isOfficialSource: false,
    availabilityStatus: "available",
    publicationDate: "2015-04-12",
    lastCheckedDate: "2025-02-22",
    authorOrChannel: "Archival Author",
    provenance: "curated",
    verificationStatus: "potential_mismatch",
    verificationReport: {
      id: "ver_init_5",
      resourceId: "res_5",
      resourceTitle: "Legacy Tutorial Buffer Guide",
      resourceUrl: "https://example.com/legacy-buffer-guide-2015",
      topicId: "topic_buffers_streams",
      status: "potential_mismatch",
      errorCategory: "none",
      checkedAt: "2025-02-22T14:15:00Z",
      assessedContentScope:
        "Content advocates calling new Buffer(length) directly without explicit zero-initialization.",
      contentAccessMethod: "article_reader",
      officialDocLinks: [
        {
          title: "Node.js Deprecation Warning DEP0005",
          url: "https://nodejs.org/api/deprecations.html#DEP0005",
          authority: "Node.js Security Team",
        },
      ],
      findings: [
        'CRITICAL DEVIATION: Calling "new Buffer()" is deprecated and poses memory leak/security risks because uninitialized memory is exposed.',
        "Official recommendation requires Buffer.alloc(size) or Buffer.allocUnsafe(size).",
      ],
      claims: [
        {
          claim:
            "Directly use `new Buffer(1024)` for high performance fast buffer creation.",
          officialDocReference:
            "DEP0005: The Buffer() constructor has been deprecated due to security vulnerabilities.",
          officialDocUrl: "https://nodejs.org/api/deprecations.html#DEP0005",
          matchStatus: "deviates",
          explanation:
            "Official Node.js documentation explicitly flags this constructor as deprecated and insecure.",
        },
      ],
      limitations: [
        "Analyzed text is from 2015 before modern Node.js 10+ Buffer API standards were finalized.",
      ],
    },
  },
  {
    id: "res_6",
    topicId: "topic_cluster_scaling",
    subtopics: [
      "Cluster Socket Sharing",
      "IPC Coordination",
      "Zero-Downtime Rollout",
    ],
    title: "Node.js Cluster Module in Production",
    url: "https://nodejs.org/api/cluster.html",
    platform: "Node.js Docs",
    type: "documentation",
    difficulty: "advanced",
    language: "English",
    durationOrReadTime: "20 mins read",
    description:
      "Specification for the Node.js Cluster module, covering master-worker IPC, socket delegation, and SCHED_RR scheduling.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-24",
    authorOrChannel: "Node.js Core Team",
    provenance: "curated",
    verificationStatus: "unable_to_verify",
  },
  {
    id: "res_7_external_quiz",
    topicId: "topic_event_loop",
    subtopics: ["Event Loop Phases"],
    title: "External Practice: JS Event Loop Visual Quiz on DevPractice",
    url: "https://example.com/external-event-loop-quiz",
    platform: "DevPractice (External)",
    type: "mcq",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "15 mins",
    description:
      "External hosted interactive quiz covering visual call-stack tick execution. Scored on host platform.",
    isOfficialSource: false,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "DevPractice Team",
    provenance: "curated",
    isInternalAssessment: false,
    verificationStatus: "unable_to_verify",
  },
  {
    id: "res_8_internal_quiz",
    topicId: "topic_event_loop",
    subtopics: [
      "Event Loop Phases",
      "Microtask Execution Order",
      "Libuv Thread Pool",
    ],
    title: "CogniPath Verified Diagnostic: Event Loop & Asynchronous Runtimes",
    url: "#internal-assessment-event-loop",
    platform: "CogniPath Diagnostic Engine",
    type: "mcq",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "5 Questions • ~8 mins",
    description:
      "Scored internally with discrete subtopic tagging, official documentation citations, and explainable weak-topic diagnostics.",
    isOfficialSource: false,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "CogniPath Technical Steering",
    provenance: "curated",
    isInternalAssessment: true,
    verificationStatus: "verified_against_cited_references",
  },

  // --- Android & Kotlin Study Materials ---
  {
    id: "res_android_1",
    topicId: "android_compose",
    subtopics: ["Jetpack Compose", "Declarative UI", "Composables"],
    title: "Jetpack Compose Basics: Android Developer Codelab",
    url: "https://developer.android.com/codelabs/jetpack-compose-basics",
    platform: "Android Developers",
    type: "practice",
    difficulty: "beginner",
    language: "English",
    durationOrReadTime: "45 mins interactive",
    description:
      "Official Google codelab teaching composable functions, layout components, modifiers, state hoisting, and basic list rendering in Jetpack Compose.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "Google Android Team",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },
  {
    id: "res_android_2",
    topicId: "kotlin_coroutines",
    subtopics: ["Coroutines", "Dispatchers", "StateFlow"],
    title: "Kotlin Coroutines in Android Studio: Complete Guide",
    url: "https://developer.android.com/kotlin/coroutines",
    platform: "Android Developers",
    type: "documentation",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "20 mins read",
    description:
      "Authoritative guide to asynchronous programming on Android using Kotlin Coroutines, ViewModelScope, and structured concurrency.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "Google Android Engineering",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },

  // --- React & Web Development Study Materials ---
  {
    id: "res_react_1",
    topicId: "react_core",
    subtopics: ["Components", "Hooks", "State Management"],
    title: "Describing the UI: Official React.dev Interactive Tutorial",
    url: "https://react.dev/learn/describing-the-ui",
    platform: "React.dev",
    type: "documentation",
    difficulty: "beginner",
    language: "English",
    durationOrReadTime: "25 mins read",
    description:
      "The modern official React documentation covering JSX syntax, props, conditional rendering, and rendering lists with keys.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "React Core Team",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },
  {
    id: "res_react_2",
    topicId: "react_core",
    subtopics: ["useEffect", "Side Effects"],
    title: "Synchronizing with Effects: You Might Not Need an Effect",
    url: "https://react.dev/learn/you-might-not-need-an-effect",
    platform: "React.dev",
    type: "article",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "15 mins read",
    description:
      "Key guide on preventing infinite re-render loops and managing component state transitions idiomatically in modern React.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "Dan Abramov & React Team",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },

  // --- SQL & Relational Architecture Study Materials ---
  {
    id: "res_sql_1",
    topicId: "sql_databases",
    subtopics: ["SQL Queries", "Relational Joins", "Indexing"],
    title: "PostgreSQL Tutorial: Essential SQL Queries and Relational Modeling",
    url: "https://www.postgresql.org/docs/current/tutorial-sql.html",
    platform: "PostgreSQL Official Docs",
    type: "documentation",
    difficulty: "beginner",
    language: "English",
    durationOrReadTime: "30 mins read",
    description:
      "Official introduction to table definitions, primary keys, foreign keys, SELECT queries, WHERE filters, and relational JOIN operations.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "PostgreSQL Community",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },

  // --- Python & Machine Learning Study Materials ---
  {
    id: "res_python_1",
    topicId: "python_core",
    subtopics: ["Data Structures", "List Comprehensions", "OOP"],
    title: "The Official Python Tutorial: Data Structures & Modules",
    url: "https://docs.python.org/3/tutorial/datastructures.html",
    platform: "Python.org",
    type: "documentation",
    difficulty: "beginner",
    language: "English",
    durationOrReadTime: "20 mins read",
    description:
      "Core language documentation detailing Python lists, tuples, sets, dictionaries, and memory idioms.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "Python Software Foundation",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },
  {
    id: "res_pytorch_1",
    topicId: "pytorch_basics",
    subtopics: ["Tensors", "Autograd", "Neural Networks"],
    title: "PyTorch Deep Learning 60 Minute Blitz: Official Tutorial",
    url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
    platform: "PyTorch.org",
    type: "practice",
    difficulty: "intermediate",
    language: "English",
    durationOrReadTime: "60 mins hands-on",
    description:
      "Hands-on guide to tensors, GPU acceleration, automatic differentiation (autograd), and training your first neural network classifier.",
    isOfficialSource: true,
    availabilityStatus: "available",
    lastCheckedDate: "2025-02-25",
    authorOrChannel: "PyTorch Core Team",
    provenance: "curated",
    verificationStatus: "verified_against_cited_references",
  },
];

export const INITIAL_REPORTED_ISSUES: ReportedResourceIssue[] = [
  {
    id: "rep_1",
    resourceId: "res_5",
    resourceTitle:
      'Legacy Tutorial: "Buffer(size) is standard for raw memory in Node"',
    reportedBy: "Alex Rivera",
    reportedAt: "2025-02-25T11:20:00Z",
    reason: "outdated_api",
    studentNotes:
      "Author instructs students to call new Buffer() which crashes in modern Node 16+ or throws security warnings.",
    status: "pending_review",
  },
];

export const INITIAL_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    topicId: "topic_event_loop",
    subtopic: "Event Loop Phases",
    difficulty: "intermediate",
    questionText:
      "During which phase of the Node.js event loop are setImmediate() callbacks executed?",
    options: [
      "Poll phase",
      "Timers phase",
      "Check phase",
      "Close callbacks phase",
    ],
    correctOptionIndex: 2,
    explanation:
      "The check phase runs callbacks registered with setImmediate() immediately after the poll phase becomes idle or completes its FIFO batch.",
    officialDocCitation: {
      title: "Node.js Event Loop - Check Phase",
      url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#check",
    },
  },
  {
    id: "q2",
    topicId: "topic_event_loop",
    subtopic: "Event Loop Phases",
    difficulty: "intermediate",
    questionText:
      "If the event loop enters the poll phase and there are NO timers scheduled and the poll queue is empty, what happens next?",
    options: [
      "The process immediately terminates with code 0",
      "If setImmediate() scripts are queued, the event loop ends the poll phase and proceeds to the check phase",
      "It immediately loops back to the timers phase without waiting",
      "It spawns a new V8 isolate thread",
    ],
    correctOptionIndex: 1,
    explanation:
      "When the poll phase becomes idle, if setImmediate() callbacks exist, the event loop will exit poll and advance to the check phase to run them.",
    officialDocCitation: {
      title: "Node.js Poll Phase Specification",
      url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#poll",
    },
  },
  {
    id: "q3",
    topicId: "topic_event_loop",
    subtopic: "Microtask Execution Order",
    difficulty: "intermediate",
    questionText:
      "If both process.nextTick() and a resolved Promise.then() are registered in the same synchronous block, which executes first?",
    options: [
      "Promise.then() runs before process.nextTick()",
      "process.nextTick() queue is drained first before Promise microtasks",
      "They run in parallel on separate worker threads",
      "They are queued into the Timers phase FIFO",
    ],
    correctOptionIndex: 1,
    explanation:
      "The nextTickQueue has priority over the Promise microtask queue; Node processes all nextTick callbacks before standard ECMAScript microtasks.",
    officialDocCitation: {
      title: "process.nextTick() vs setImmediate()",
      url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#processnexttick-vs-setimmediate",
    },
  },
  {
    id: "q4",
    topicId: "topic_event_loop",
    subtopic: "Microtask Execution Order",
    difficulty: "advanced",
    questionText:
      "What is the danger of executing recursive calls to `process.nextTick()` inside a callback?",
    options: [
      "It causes a stack overflow in the V8 call stack immediately",
      "It starves the event loop I/O, preventing the poll phase from ever being reached",
      "It corrupts the libuv thread pool handles",
      "It automatically schedules a SIGINT process signal",
    ],
    correctOptionIndex: 1,
    explanation:
      "Because Node processes all nextTick callbacks before proceeding to the next event loop phase, recursively scheduling nextTicks creates continuous starvation of I/O.",
    officialDocCitation: {
      title: "Node.js Starvation Warning: process.nextTick()",
      url: "https://nodejs.org/api/process.html#processnexttickcallback-args",
    },
  },
  {
    id: "q5",
    topicId: "topic_buffers_streams",
    subtopic: "Buffer Allocation Safety",
    difficulty: "intermediate",
    questionText:
      "Why does Node.js strongly discourage the use of `new Buffer(size)` in favor of `Buffer.alloc(size)`?",
    options: [
      "new Buffer() cannot allocate more than 64KB",
      "new Buffer() does not zero-fill memory and can expose sensitive memory fragments from prior process allocations",
      "new Buffer() always compiles down to WebAssembly",
      "Buffer.alloc is slower but required by V8 garbage collector",
    ],
    correctOptionIndex: 1,
    explanation:
      "Uninitialized memory allocated with old constructors or allocUnsafe contains pre-existing memory bytes, creating potential credential/data disclosure leaks.",
    officialDocCitation: {
      title: "Buffer.alloc vs Buffer.allocUnsafe",
      url: "https://nodejs.org/api/buffer.html#bufferallocunsafe-size",
    },
  },
  {
    id: "q6",
    topicId: "topic_buffers_streams",
    subtopic: "Stream Backpressure Signals",
    difficulty: "advanced",
    questionText:
      "When calling `writable.write(chunk)`, what does a return value of `false` signal to the producer?",
    options: [
      "The write operation failed with an unrecoverable I/O error",
      "The internal buffer has reached or exceeded `highWaterMark`; caller should pause writing until the `drain` event is emitted",
      "The stream has closed permanently",
      "The chunk size is smaller than the required byte length",
    ],
    correctOptionIndex: 1,
    explanation:
      "Returning false indicates backpressure is active; incoming data is filling the internal queue and the producer should halt pushes until `drain`.",
    officialDocCitation: {
      title: "Node.js Backpressuring in Streams",
      url: "https://nodejs.org/en/learn/modules/backpressuring-in-streams",
    },
  },
  {
    id: "q7",
    topicId: "topic_buffers_streams",
    subtopic: "Stream Backpressure Signals",
    difficulty: "advanced",
    questionText:
      "What is the recommended modern method to safely pipe streams with automatic backpressure and error teardown?",
    options: [
      "readable.pipe(writable)",
      "stream.pipeline(source, transform, destination, callback)",
      "process.nextTick(() => readable.pipe(writable))",
      "async for (const chunk of readable) { writable.write(chunk); } without listening to drain",
    ],
    correctOptionIndex: 1,
    explanation:
      "stream.pipeline() properly forwards errors, cleans up unclosed file descriptors, and handles backpressure drain events without memory leaks.",
    officialDocCitation: {
      title: "stream.pipeline API Reference",
      url: "https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback",
    },
  },
  {
    id: "q8",
    topicId: "topic_cluster_scaling",
    subtopic: "Cluster Socket Sharing",
    difficulty: "advanced",
    questionText:
      "How does the Node.js Cluster module distribute incoming TCP server connections across workers on Linux by default?",
    options: [
      "Active worker threads take turns via mutex locking on port 80",
      "The primary process listens on the port and distributes sockets to workers via round-robin IPC",
      "Each worker independently binds to the same port with SO_REUSEPORT bypassing the master",
      "DNS-level round robin load balancer built into V8",
    ],
    correctOptionIndex: 1,
    explanation:
      "By default (cluster.schedulingPolicy = cluster.SCHED_RR), the primary process accepts connections and hands descriptors off to worker processes via IPC.",
    officialDocCitation: {
      title: "Cluster Module How It Works",
      url: "https://nodejs.org/api/cluster.html#how-it-works",
    },
  },
];
