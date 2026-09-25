---
title: "URL Shortener"
published: 2026-09-25
draft: false
tags: ["system-design", "distributed-systems", "url-shortening"]
description: "A concise revision guide to URL shortening, code generation, redirects, Bloom filters, and interview vocabulary."
category: System Design
---

## Design at a Glance

**Scope:** create short links and redirect visitors; clarify traffic, retention, analytics, and whether destinations can change.

| Decision | Revision point |
| --- | --- |
| API | `POST /links` creates a link; `GET /{code}` redirects. |
| Storage | Persist `code → destination`; cache popular mappings. |
| Code generation | Compare truncated hashing with Base62 encoding of unique IDs. |
| Scaling | Stateless servers behind a load balancer; replicate and shard storage as needed. |

### Size the Code Space

Using the chapter’s assumptions:

```text
100 million new links/day ≈ 1,160 writes/second
10 redirects/write       ≈ 11,600 reads/second
10 years of retention    ≈ 365 billion mappings
62^6 ≈ 56.8 billion < 365 billion < 62^7 ≈ 3.52 trillion
```

Seven Base62 characters provide enough capacity. At 100 bytes per destination, URLs alone require about 36.5 TB; indexes, metadata, and replicas add overhead. These are averages, not peak traffic estimates.

### Trace Both Requests

**Create:** validate destination → optionally reuse an existing mapping → generate a unique ID → Base62-encode → persist → return the short link.

**Redirect:** lookup cache → on a miss, query storage and populate cache → return a redirect with `Location`. Return `404` for an unknown code. The browser then requests the destination.

## Code Generation: Hashing vs. Encoding

| Approach | Mechanism | Main trade-off |
| --- | --- | --- |
| Truncated hash | Hash the destination, shorten the output, retry with a changed input on collision | Requires collision handling. |
| Unique ID + Base62 | Represent a unique integer using `0–9`, `a–z`, and `A–Z` | Requires reliable ID allocation; sequential IDs produce guessable codes. |

**Implementation caveats:** Base62 encodes the ID, not the destination. Storage supplies the destination; decoding cannot recover it. Do not truncate an encoded ID if uniqueness depends on that ID. Seven hexadecimal characters provide only `16^7` possibilities, not `62^7`.

Enforce code uniqueness atomically in storage. Two creators can both pass a separate “does this code exist?” check. Capacity alone also does not prevent hash collisions before the code space fills.

### Base62 Creation Flow

After validating the destination URL, the creation path is:

```text
                 Long URL
                    │
                    ▼
          ┌───────────────────┐
          │ Existing mapping? │
          └─────────┬─────────┘
                    │
          ┌─────────┴─────────┐
         Yes                  No
          │                   │
          ▼                   ▼
 ┌─────────────────┐  ┌─────────────────────┐
 │ Return existing │  │ Generate a globally │
 │ short URL       │  │ unique integer ID   │
 └─────────────────┘  └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ Encode ID in Base62 │
                      │ e.g. 11157 → 2TX    │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ Persist ID, code,   │
                      │ and destination URL │
                      └──────────┬──────────┘
                                 │ success
                                 ▼
                      ┌─────────────────────┐
                      │ Return short URL    │
                      │ e.g. short.test/2TX │
                      └─────────────────────┘
```

The existing-mapping check is optional: include it when repeated submissions should reuse a link. For the alphabet `0–9, a–z, A–Z`, repeated division by 62 gives remainders `59, 55, 2`; reverse them and map to characters to get `2TX`. The ID determines the code; the saved mapping determines the destination.

## 301 vs. 302: Meaning and Cache Policy

| Status | Meaning | Design consequence |
| --- | --- | --- |
| `301 Moved Permanently` | The destination is permanent | Heuristic caching is permitted; repeat visits may bypass the shortener, reducing load and visibility into clicks. |
| `302 Found` | The destination is temporary | Useful when future visits should recheck the shortener, but explicit cache controls can still permit caching. |

For redirects that must reach the service on each visit, use an appropriate policy such as `Cache-Control: no-store`. **302 alone does not guarantee a fresh request or complete analytics.** These caching distinctions follow [HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4) and [HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5).

## Bloom Filter: An Optional Lookup Optimization

A Bloom filter answers whether a candidate code may already exist:

- **Definitely absent:** skip the preliminary existence lookup and attempt the insert.
- **Possibly present:** check storage; the answer may be a false positive.

It stores membership information, not URL mappings, and cannot resolve collisions. Its no-false-negative property applies to inserted elements: an out-of-date filter may miss a newly created code. Keep the atomic uniqueness check even when using a filter. See the [Redis Bloom filter documentation](https://redis.io/docs/latest/data-types/probabilistic/bloom-filter/).

## Quick Revision Questions

1. Why can a seven-character code space still suffer collisions?
2. What guarantees uniqueness in the Base62 approach?
3. How could redirect caching affect click analytics?
4. Why does a Bloom filter not make a separate check-then-insert safe?

## Vocabulary and Interview Phrases

| Word or phrase | Plain meaning | Example in context |
| --- | --- | --- |
| sanity check | A quick check that a result is reasonable | “As a sanity check, compare the code space with the expected number of links.” |
| facilitate | Make something easier or possible | “The API facilitates communication between clients and the service.” |
| back-of-the-envelope estimation | A rough calculation; 粗略估算 / 快速量级估算 | “Use a back-of-the-envelope estimation to size storage.” |
| eliminate | Remove completely | “Unique IDs eliminate code collisions if the encoding preserves uniqueness.” |
| functional | Working as intended; also related to required behavior | “Creating links and redirecting visitors are functional requirements.” |
| concrete example | A specific example rather than an abstract description | “Walk through a concrete example of a cache miss.” |
| malicious | Intentionally harmful | “Rate limiting helps control malicious link-creation traffic.” |

*Primary reference: Alex Xu, System Design Interview – An Insider’s Guide, Chapter 8, [Design a URL Shortener](https://bytebytego.com/courses/system-design-interview/design-a-url-shortener). The HTTP and Redis links above support the additional implementation notes.*

*Authorship note: This revision guide was refined with AI assistance.*
