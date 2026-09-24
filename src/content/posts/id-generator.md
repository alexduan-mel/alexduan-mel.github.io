---
title: "Unique ID Generator"
published: 2026-09-24
draft: false
tags: ["system-design", "distributed-systems"]
description: "An interview revision guide to distributed ID generation, Snowflake, clock pitfalls, and useful vocabulary."
category: System Design
---

## Design at a Glance

**Scope:** generate unique numerical IDs across multiple servers, fit them into 64 bits, keep them roughly ordered by creation time, and remain highly available. Use the chapter's target of 10,000 IDs per second as the starting point for capacity discussion.

Clarify what “ordered” means before choosing a design: increasing by exactly one, increasing within a worker, and sorting approximately by time are different requirements. Gaps are acceptable here.

| Approach | How it works | Trade-off to remember |
| --- | --- | --- |
| Multi-master replication | Give each database a different starting offset and increment by the number of generators. | Distributes generation, but changing membership is awkward and IDs do not reflect global creation order. |
| UUID | Generate identifiers independently on each node. | Avoids a central allocator, but uses 128 bits; random UUIDs do not sort by creation time. |
| Ticket server | Ask a dedicated database for an auto-incrementing ID. | Simple, but a single server is a bottleneck and a single point of failure. |
| Snowflake | Combine time, worker identity, and a local sequence. | Compact and roughly time ordered; requires careful worker assignment and clock handling. |

For these requirements, Snowflake is a useful choice to develop in the interview.

## Why the Alternatives Fall Short

### 1. Multiple counters need disjoint ID spaces

With two generators, use different offsets and a step of two:

```text
Generator A: 1, 3, 5, 7, ...
Generator B: 2, 4, 6, 8, ...
```

Disjoint sequences prevent collisions, but a busy A can produce `101` before B produces `4`. Uniqueness does not imply time ordering. Adding a third generator also requires a safe allocation plan; simply changing the step can overlap previously issued IDs.

A ticket server centralizes allocation instead. Redundancy is possible: [Flickr's ticket-server design](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/) uses separate odd/even generators. Replication alone does not automatically make two allocators safe.

### 2. UUIDs are 128 bits, regardless of their display format

A UUID occupies **128 bits = 16 bytes**. Its familiar 36-character form uses hexadecimal digits and hyphens; that text representation is different from its binary size.

Random UUIDv4 generation provides probabilistic uniqueness, not a mathematical guarantee that collisions are impossible. A sound random source matters.

**Modern clarification:** “UUIDs are not time ordered” is too broad. UUIDv7 includes a Unix-millisecond timestamp and supports time-oriented sorting, but remains 128 bits, so it still fails this chapter's 64-bit constraint. See [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html).

## Snowflake: Divide the ID into Fields

The classic layout leaves the sign bit at zero:

```text
| sign | timestamp | datacenter | worker | sequence |
|  1   |    41     |     5      |   5    |    12    |
```

| Field | Meaning |
| --- | --- |
| Timestamp | Milliseconds elapsed since a shared custom epoch. |
| Datacenter | 32 possible datacenter values. |
| Worker | 32 worker values per datacenter: 1,024 distinct worker identities overall. |
| Sequence | 4,096 values per worker per millisecond, numbered 0–4,095. |

```text
id = ((timestamp_ms - epoch_ms) << 22)
     | (datacenter_id << 17)
     | (worker_id << 12)
     | sequence
```

**Capacity arithmetic:** `2^41` milliseconds gives about 69.7 years from the epoch. `2^12 × 1,000` gives a theoretical 4,096,000 IDs/second/worker; this is a format limit, not a measured throughput guarantee.

**Trace one request:** read the clock → reject a backward timestamp → increment the sequence within the same millisecond, or reset it for a newer millisecond → wait for a later millisecond if the sequence is exhausted → pack the fields. Update timestamp and sequence atomically for concurrent callers.

This layout and generation flow follow [Twitter's original Snowflake implementation](https://github.com/twitter-archive/snowflake/blob/snowflake-2010/src/main/scala/com/twitter/service/snowflake/IdWorker.scala).

## Three Distinctions Worth Remembering

### 1. Time ordering is approximate across workers

The timestamp occupies the most significant used bits, so later encoded timestamps produce larger IDs. Within the same millisecond, worker identity takes precedence over the sequence; IDs from different workers do not establish exact event order. Clock skew can also make a later real-world event carry an earlier timestamp.

Snowflake therefore provides **rough time ordering**, not a globally coordinated, strictly increasing sequence. Twitter explicitly describes this goal in its [Snowflake announcement](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake).

### 2. Clock synchronization does not eliminate rollback risk

Keeping hosts synchronized with NTP helps limit skew, but correctness still needs an explicit policy for backward clock movement. Reusing a previous timestamp with a reset sequence under the same worker identity can reproduce an ID.

Operational follow-ups to reason through in an interview:

| Situation | Design response |
| --- | --- |
| Clock moves backward | Pause or reject generation until safe; define a bounded wait and alert on larger jumps. |
| Worker restarts | Ensure it cannot reuse an already-issued timestamp/sequence range under the same identity. |
| Two processes claim one worker identity | Enforce exclusive ownership, including during failover; a replacement must not overlap a still-running owner. |
| Sequence space runs out | Wait for time to advance; wrapping immediately would repeat IDs. |
| Timestamp range runs out | Plan an ID-format migration. Changing the epoch without separating old and new namespaces can create collisions. |

The central invariant is simple: **never issue the same `(timestamp, datacenter, worker, sequence)` tuple twice.** More sequence bits increase per-worker capacity; more worker bits increase the fleet size; more timestamp bits extend the lifetime. A fixed bit budget forces a trade-off.

### 3. A CPU counter is not a distributed clock

**TSC (Time Stamp Counter)** is a processor counter. On some multicore or multiprocessor systems, counters are not synchronized across cores; moving a thread between them can make readings inconsistent. Modern invariant, synchronized TSCs reduce these problems, so “multiple cores always break TSC” would be inaccurate.

Prefer operating-system clock APIs to direct TSC reads. A monotonic clock is useful for measuring local elapsed time, but it is not automatically a shared epoch across machines or restarts. Snowflake needs an epoch-based timestamp plus a rollback policy. See Microsoft's [high-resolution timestamp guidance](https://learn.microsoft.com/en-us/windows/win32/sysinfo/acquiring-high-resolution-time-stamps).

## Quick Revision Questions

1. Why do odd/even generators guarantee uniqueness but not global time ordering?
2. Why does UUIDv7 still fail a strict 64-bit requirement?
3. What happens on a worker's 4,097th request in the same millisecond?
4. How could a restart or duplicated worker identity violate uniqueness?
5. Why is NTP alone insufficient to make an ID generator correct?

**Interview wrap-up:** “I would use a Snowflake-style layout for compact IDs with approximate time ordering. Workers generate independently after identity assignment. The main correctness risks are identity reuse, clock rollback, and sequence exhaustion; I would define those failure policies before discussing throughput.”

## Vocabulary and Interview Phrases

| Word or phrase | Plain meaning | Example in context |
| --- | --- | --- |
| numerical /nuːˈmerɪk(ə)l/ | Expressed using numbers; “numeric” is also common in engineering. | “The service returns a numerical identifier.” |
| increment | Increase by a specified amount; also the amount of increase. | “Increment the sequence by one.” |
| replica | A copy of data or a service instance. | “A replica can take over after a failure.” |
| replication | The process of maintaining copies. | “Replication keeps database copies updated.” |
| collision | Two items receive the same identifier. | “Reusing a worker identity can cause an ID collision.” |
| collusion | Secret cooperation, usually for a dishonest purpose. | “Collusion between participants can undermine a protocol.” This is different from an ID collision. |
| mission-critical | Essential to the system's core operation. | “ID generation is mission-critical if every write depends on it.” |
| epoch | The reference instant from which a timestamp is measured. | “All workers use the same custom epoch.” |
| clock skew / clock rollback | Skew is a difference between clocks; rollback is one clock moving backward. | “Skew affects ordering; rollback can threaten uniqueness.” |

*Primary reference: Alex Xu, System Design Interview – An Insider’s Guide, Volume 1, Chapter 7, [Design a Unique ID Generator in Distributed Systems](https://bytebytego.com/courses/system-design-interview/design-a-unique-id-generator-in-distributed-systems). The linked engineering sources support the implementation details and additional notes on UUIDv7 and clock behavior.*

*Authorship note: This chapter summary was written and refined with AI assistance for personal study and interview review.*
