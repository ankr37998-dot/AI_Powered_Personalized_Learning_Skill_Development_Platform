import { CatalogTopic, LearningResource, AssessmentQuestion } from './types';

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

export const CURATED_CATALOG: CatalogTopic[] = [
  {
    id: 'topic_event_loop',
    title: 'Node.js Event Loop & Libuv Architecture',
    category: 'Backend Core',
    difficulty: 'intermediate',
    summary: 'Mechanics of the single-threaded event loop, 6 distinct phases, and libuv asynchronous OS abstraction.',
    prerequisiteIds: [],
    officialDocSources: [
      {
        title: 'The Node.js Event Loop, Timers, and process.nextTick()',
        url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
        authorityName: 'Node.js Official Documentation'
      },
      {
        title: 'Libuv Design Overview',
        url: 'https://docs.libuv.org/en/v1.x/design.html',
        authorityName: 'Libuv Documentation'
      }
    ]
  },
  {
    id: 'topic_microtasks',
    title: 'Microtasks: process.nextTick & Promises',
    category: 'Backend Core',
    difficulty: 'intermediate',
    summary: 'Order of execution between nextTickQueue, Promise microtask queue, and phase transitions.',
    prerequisiteIds: ['topic_event_loop'],
    officialDocSources: [
      {
        title: 'process.nextTick() API Docs',
        url: 'https://nodejs.org/api/process.html#processnexttickcallback-args',
        authorityName: 'Node.js API Reference'
      }
    ]
  },
  {
    id: 'topic_buffers_streams',
    title: 'Buffers, Binary Data & Backpressure',
    category: 'Data Flow',
    difficulty: 'advanced',
    summary: 'Raw memory allocation outside the V8 heap, zero-fill guarantees, stream pipelines, and backpressure signals.',
    prerequisiteIds: ['topic_event_loop'],
    officialDocSources: [
      {
        title: 'Stream Module & Backpressure Guide',
        url: 'https://nodejs.org/en/learn/modules/backpressuring-in-streams',
        authorityName: 'Node.js Official Guide'
      },
      {
        title: 'Buffer Module API',
        url: 'https://nodejs.org/api/buffer.html',
        authorityName: 'Node.js API Reference'
      }
    ]
  },
  {
    id: 'topic_cluster_scaling',
    title: 'Process Management, Clustering & IPC',
    category: 'Distributed Systems',
    difficulty: 'advanced',
    summary: 'Multi-core scaling via the cluster module, round-robin socket delegation, inter-process communication, and graceful exit.',
    prerequisiteIds: ['topic_buffers_streams', 'topic_microtasks'],
    officialDocSources: [
      {
        title: 'Cluster Module Specification',
        url: 'https://nodejs.org/api/cluster.html',
        authorityName: 'Node.js API Reference'
      }
    ]
  }
];

export const INITIAL_RESOURCES: LearningResource[] = [
  {
    id: 'res_1',
    topicId: 'topic_event_loop',
    title: 'What the heck is the event loop anyway? (JSConf)',
    url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
    platform: 'YouTube',
    type: 'video',
    difficulty: 'beginner',
    durationOrReadTime: '26 mins',
    qualityScore: 96,
    verificationStatus: 'verified_against_cited_references',
    lastCheckedDate: '2025-02-14',
    authorOrChannel: 'Philip Roberts',
    verificationReport: {
      resourceId: 'res_1',
      status: 'verified_against_cited_references',
      checkedAt: '2025-02-14T10:30:00Z',
      assessedContentSummary: 'Assessed public transcript segments covering Call Stack, Web APIs, Task Queue, and Event Loop tick dispatching.',
      officialDocLinks: [
        {
          title: 'HTML Standard - Event Loop & Task Queue',
          url: 'https://html.spec.whatwg.org/multipage/webappapis.html#event-loops',
          authority: 'WHATWG'
        },
        {
          title: 'Node.js Event Loop Guide',
          url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
          authority: 'Node.js Foundation'
        }
      ],
      findings: [
        'Accurately explains the distinction between synchronous call stack execution and async queues.',
        'Uses browser-centric abstractions (setTimeout WebAPI) which faithfully mirrors ECMAScript event loop fundamentals.'
      ],
      claims: [
        {
          claim: 'setTimeout callbacks run only after the synchronous call stack empties.',
          officialDocReference: 'WHATWG Section 8.1.6.1 step 4: Run the oldest task on one task queue.',
          officialDocUrl: 'https://html.spec.whatwg.org/multipage/webappapis.html',
          matchStatus: 'aligned',
          explanation: 'Call stack must clear before dequeuing the task.'
        }
      ],
      limitations: [
        'Does not detail Node.js multi-phase event loop (timers, poll, check) since lecture focuses on browser V8/WebAPIs.'
      ]
    }
  },
  {
    id: 'res_2',
    topicId: 'topic_event_loop',
    title: 'Official Node.js Event Loop, Timers, and process.nextTick Guide',
    url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
    platform: 'Node.js Official Docs',
    type: 'documentation',
    difficulty: 'intermediate',
    durationOrReadTime: '15 mins read',
    qualityScore: 99,
    verificationStatus: 'verified_against_cited_references',
    lastCheckedDate: '2025-02-20',
    authorOrChannel: 'Node.js Technical Steering Committee'
  },
  {
    id: 'res_3',
    topicId: 'topic_buffers_streams',
    title: 'Backpressuring in Streams: Complete Guide',
    url: 'https://nodejs.org/en/learn/modules/backpressuring-in-streams',
    platform: 'Node.js Guides',
    type: 'documentation',
    difficulty: 'advanced',
    durationOrReadTime: '12 mins read',
    qualityScore: 98,
    verificationStatus: 'verified_against_cited_references',
    lastCheckedDate: '2025-02-18',
    authorOrChannel: 'Node.js Documentation'
  },
  {
    id: 'res_4',
    topicId: 'topic_buffers_streams',
    title: 'Legacy Tutorial: "Buffer(size) is standard for raw memory in Node"',
    url: 'https://example.com/legacy-buffer-guide-2015',
    platform: 'Tech Blog Archive',
    type: 'article',
    difficulty: 'intermediate',
    durationOrReadTime: '8 mins read',
    qualityScore: 42,
    verificationStatus: 'potential_mismatch',
    lastCheckedDate: '2025-02-22',
    authorOrChannel: 'Archival Author',
    verificationReport: {
      resourceId: 'res_4',
      status: 'potential_mismatch',
      checkedAt: '2025-02-22T14:15:00Z',
      assessedContentSummary: 'Content advocates calling new Buffer(length) directly without explicit zero-initialization.',
      officialDocLinks: [
        {
          title: 'Node.js Deprecation Warning DEP0005',
          url: 'https://nodejs.org/api/deprecations.html#DEP0005',
          authority: 'Node.js Security Team'
        }
      ],
      findings: [
        'CRITICAL DEVIATION: Calling "new Buffer()" is deprecated and poses memory leak/security risks because uninitialized memory is exposed.',
        'Official recommendation requires Buffer.alloc(size) or Buffer.allocUnsafe(size).'
      ],
      claims: [
        {
          claim: 'Directly use `new Buffer(1024)` for high performance fast buffer creation.',
          officialDocReference: 'DEP0005: The Buffer() constructor has been deprecated due to security vulnerabilities.',
          officialDocUrl: 'https://nodejs.org/api/deprecations.html#DEP0005',
          matchStatus: 'deviates',
          explanation: 'Official Node.js documentation explicitly flags this constructor as deprecated and insecure.'
        }
      ],
      limitations: [
        'Analyzed text is from 2015 before modern Node.js 10+ Buffer API standards were finalized.'
      ]
    }
  },
  {
    id: 'res_5',
    topicId: 'topic_cluster_scaling',
    title: 'Node.js Cluster Module in Production',
    url: 'https://nodejs.org/api/cluster.html',
    platform: 'Node.js Docs',
    type: 'documentation',
    difficulty: 'advanced',
    durationOrReadTime: '20 mins read',
    qualityScore: 97,
    verificationStatus: 'verified_against_cited_references',
    lastCheckedDate: '2025-02-24',
    authorOrChannel: 'Node.js Core Team'
  }
];

export const INITIAL_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    topicId: 'topic_event_loop',
    subtopic: 'Event Loop Phases',
    questionText: 'During which phase of the Node.js event loop are setImmediate() callbacks executed?',
    options: [
      'Poll phase',
      'Timers phase',
      'Check phase',
      'Close callbacks phase'
    ],
    correctOptionIndex: 2,
    explanation: 'The check phase runs callbacks registered with setImmediate() immediately after the poll phase becomes idle or completes its FIFO batch.',
    officialDocCitation: {
      title: 'Node.js Event Loop - Check Phase',
      url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#check'
    }
  },
  {
    id: 'q2',
    topicId: 'topic_event_loop',
    subtopic: 'Microtask Execution Order',
    questionText: 'If both process.nextTick() and a resolved Promise.then() are registered in the same synchronous block, which executes first?',
    options: [
      'Promise.then() runs before process.nextTick()',
      'process.nextTick() queue is drained first before Promise microtasks',
      'They run in parallel on separate worker threads',
      'They are queued into the Timers phase FIFO'
    ],
    correctOptionIndex: 1,
    explanation: 'The nextTickQueue has priority over the Promise microtask queue; Node processes all nextTick callbacks before standard ECMAScript microtasks.',
    officialDocCitation: {
      title: 'process.nextTick() vs setImmediate()',
      url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#processnexttick-vs-setimmediate'
    }
  },
  {
    id: 'q3',
    topicId: 'topic_buffers_streams',
    subtopic: 'Buffer Allocation Safety',
    questionText: 'Why does Node.js strongly discourage the use of `new Buffer(size)` in favor of `Buffer.alloc(size)`?',
    options: [
      'new Buffer() cannot allocate more than 64KB',
      'new Buffer() does not zero-fill memory and can expose sensitive memory fragments from prior process allocations',
      'new Buffer() always compiles down to WebAssembly',
      'Buffer.alloc is slower but required by V8 garbage collector'
    ],
    correctOptionIndex: 1,
    explanation: 'Uninitialized memory allocated with old constructors or allocUnsafe contains pre-existing memory bytes, creating potential credential/data disclosure leaks.',
    officialDocCitation: {
      title: 'Buffer.alloc vs Buffer.allocUnsafe',
      url: 'https://nodejs.org/api/buffer.html#bufferallocunsafe-size'
    }
  },
  {
    id: 'q4',
    topicId: 'topic_buffers_streams',
    subtopic: 'Stream Backpressure Signals',
    questionText: 'When calling `writable.write(chunk)`, what does a return value of `false` signal to the producer?',
    options: [
      'The write operation failed with an unrecoverable I/O error',
      'The internal buffer has reached or exceeded `highWaterMark`; caller should pause writing until the `drain` event is emitted',
      'The stream has closed permanently',
      'The chunk size is smaller than the required byte length'
    ],
    correctOptionIndex: 1,
    explanation: 'Returning false indicates backpressure is active; incoming data is filling the internal queue and the producer should halt pushes until `drain`.',
    officialDocCitation: {
      title: 'Node.js Backpressuring in Streams',
      url: 'https://nodejs.org/en/learn/modules/backpressuring-in-streams'
    }
  },
  {
    id: 'q5',
    topicId: 'topic_cluster_scaling',
    subtopic: 'Cluster Socket Sharing',
    questionText: 'How does the Node.js Cluster module distribute incoming TCP server connections across workers on Linux by default?',
    options: [
      'Active worker threads take turns via mutex locking on port 80',
      'The primary process listens on the port and distributes sockets to workers via round-robin IPC',
      'Each worker independently binds to the same port with SO_REUSEPORT bypassing the master',
      'DNS-level round robin load balancer built into V8'
    ],
    correctOptionIndex: 1,
    explanation: 'By default (cluster.schedulingPolicy = cluster.SCHED_RR), the primary process accepts connections and hands descriptors off to worker processes via IPC.',
    officialDocCitation: {
      title: 'Cluster Module How It Works',
      url: 'https://nodejs.org/api/cluster.html#how-it-works'
    }
  }
];
