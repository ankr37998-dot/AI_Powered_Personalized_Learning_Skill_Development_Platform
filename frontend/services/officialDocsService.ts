import { CanonicalDocReference } from '../types';

/**
 * Curated Canonical Documentation Catalog
 * Real excerpts strictly sourced from official Node.js (nodejs.org) and WHATWG specs.
 */
export const CANONICAL_DOCS_CATALOG: CanonicalDocReference[] = [
  {
    id: 'doc_event_loop_phases',
    canonicalUrl: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
    title: 'Node.js Event Loop, Timers, and process.nextTick()',
    topicId: 'topic_event_loop',
    subtopicTag: 'Event Loop Phases',
    authorityName: 'Node.js Foundation / OpenJS',
    lastCheckedDate: '2025-02-20',
    canonicalExcerpt: `Phases Overview:
- timers: executes callbacks scheduled by setTimeout() and setInterval().
- pending callbacks: executes I/O callbacks deferred to the next loop iteration.
- idle, prepare: only used internally.
- poll: retrieve new I/O events; execute almost all I/O related callbacks.
- check: setImmediate() callbacks are invoked here.
- close callbacks: some close callbacks, e.g. socket.on('close', ...).
process.nextTick() is not technically part of the event loop. Instead, the nextTickQueue will be processed after the current operation is completed, regardless of the current phase.`
  },
  {
    id: 'doc_whatwg_event_loop',
    canonicalUrl: 'https://html.spec.whatwg.org/multipage/webappapis.html#event-loops',
    title: 'WHATWG HTML Standard: Section 8.1.6 Event loops',
    topicId: 'topic_event_loop',
    subtopicTag: 'Task Queue',
    authorityName: 'WHATWG Living Standard',
    lastCheckedDate: '2025-02-15',
    canonicalExcerpt: `An event loop has one or more task queues. A task queue is a set of tasks.
Microtask queue: Each event loop has a microtask queue. When the JavaScript execution stack is empty, perform a microtask checkpoint, processing all microtasks queued until the queue is completely drained.`
  },
  {
    id: 'doc_nexttick_spec',
    canonicalUrl: 'https://nodejs.org/api/process.html#processnexttickcallback-args',
    title: 'Node.js Process API Reference: process.nextTick()',
    topicId: 'topic_microtasks',
    subtopicTag: 'Microtask Execution Order',
    authorityName: 'Node.js API Reference',
    lastCheckedDate: '2025-02-21',
    canonicalExcerpt: `process.nextTick(callback[, ...args])
The callback is queued in the nextTickQueue and will be invoked after the current JavaScript stack has run to completion, but BEFORE the event loop yields or proceeds to the next phase. Recursive calls to process.nextTick() can starve the event loop by preventing the poll phase from ever being reached.`
  },
  {
    id: 'doc_buffer_alloc_dep0005',
    canonicalUrl: 'https://nodejs.org/api/deprecations.html#DEP0005',
    title: 'Node.js Deprecation Warning DEP0005: Buffer() constructor',
    topicId: 'topic_buffers_streams',
    subtopicTag: 'Buffer Allocation Safety',
    authorityName: 'Node.js Security Core',
    lastCheckedDate: '2025-02-22',
    canonicalExcerpt: `DEP0005: The Buffer() constructor has been deprecated since Node.js v6.0.0 due to security vulnerabilities.
Calling 'new Buffer(number)' allocates uninitialized memory that can contain sensitive data from previous allocations (including passwords, keys, and private data).
Standard replacements:
- Buffer.alloc(size): allocates zero-filled, safe memory.
- Buffer.allocUnsafe(size): allocates non-zero-filled memory, only to be used when immediately overwritten completely with new data.`
  },
  {
    id: 'doc_streams_backpressure',
    canonicalUrl: 'https://nodejs.org/en/learn/modules/backpressuring-in-streams',
    title: 'Backpressuring in Streams: Official Architecture Guide',
    topicId: 'topic_buffers_streams',
    subtopicTag: 'Stream Backpressure Signals',
    authorityName: 'Node.js Official Documentation',
    lastCheckedDate: '2025-02-18',
    canonicalExcerpt: `Backpressure occurs when data written to a Writable stream exceeds its highWaterMark internal buffer limit.
When writable.write(chunk) returns false, the write buffer has become congested and the caller MUST cease pushing data until the stream emits the 'drain' event.
Using stream.pipeline(readable, transform, writable, callback) handles all backpressure signals and ensures file descriptor cleanup automatically.`
  },
  {
    id: 'doc_cluster_spec',
    canonicalUrl: 'https://nodejs.org/api/cluster.html',
    title: 'Node.js Cluster Module Specification',
    topicId: 'topic_cluster_scaling',
    subtopicTag: 'Cluster Socket Sharing',
    authorityName: 'Node.js API Reference',
    lastCheckedDate: '2025-02-24',
    canonicalExcerpt: `The cluster module allows easy creation of child processes that share server ports.
By default on all platforms except Windows (cluster.schedulingPolicy = cluster.SCHED_RR), the primary process listens on a port, accepts new connections, and distributes them across the workers in a round-robin approach.
Workers communicate with the master via inter-process communication (IPC) channels built on libuv pipe handles.`
  }
];

export const officialDocsService = {
  /**
   * Retrieves relevant canonical documentation references for a specific topic and optional subtopic
   */
  getReferencesForTopic(topicId: string, subtopic?: string): CanonicalDocReference[] {
    const matched = CANONICAL_DOCS_CATALOG.filter((doc) => doc.topicId === topicId);
    if (subtopic && subtopic !== 'all') {
      const subMatch = matched.filter(
        (doc) => doc.subtopicTag && doc.subtopicTag.toLowerCase().includes(subtopic.toLowerCase())
      );
      if (subMatch.length > 0) return subMatch;
    }
    return matched;
  },

  /**
   * Retrieves a canonical documentation reference by canonical URL
   */
  getReferenceByUrl(url: string): CanonicalDocReference | undefined {
    return CANONICAL_DOCS_CATALOG.find(
      (doc) => doc.canonicalUrl.toLowerCase() === url.toLowerCase()
    );
  },

  /**
   * Validates if a cited URL originates from an approved authoritative domain
   */
  isAuthoritativeDomain(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const approvedDomains = [
        'nodejs.org',
        'html.spec.whatwg.org',
        'tc39.es',
        'developer.mozilla.org',
        'docs.libuv.org'
      ];
      return approvedDomains.some((d) => host === d || host.endsWith('.' + d));
    } catch {
      return false;
    }
  }
};
