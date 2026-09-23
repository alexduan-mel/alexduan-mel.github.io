---
title: "Key-Value Store"
published: 2026-09-23
draft: false
tags: ["system-design", "distributed-systems", "databases"]
description: "A concise revision guide to key-value store design, consistency, failure recovery, and interview vocabulary."
category: System Design
---

## Design at a Glance

**Scope:** `get(key)` and `put(key, value)` for small values, large datasets, low latency, high availability, and tunable consistency.

| Design question | Technique | Trade-off to remember |
| --- | --- | --- |
| How does data fit across servers? | Consistent hashing with virtual nodes | Limits redistribution when membership changes; virtual nodes improve balance and accommodate different server capacities. |
| How does data survive node failures? | Replicate each key to N distinct physical servers | Extra storage and synchronization; spread copies across failure domains. |
| How many replies are enough? | Configurable read/write quorums | More required replies can increase latency and reduce availability. |
| What happens during a partition? | Choose consistency or availability for affected operations | Reject or delay operations that cannot preserve consistency, or accept potentially divergent data and reconcile later. |

**CAP caveat:** the consistency–availability choice applies during network partitions. Strong consistency does not require every replica to acknowledge every write, and a partition need not stop the entire cluster. See the [CAP paper](https://cs.nyu.edu/~apanda/classes/sp25/papers/gilbert02brewers.pdf).

## Three Distinctions Worth Remembering

### 1. Quorum overlap is not a complete consistency guarantee

- **N:** replica count; **W:** write acknowledgments required; **R:** read responses required.
- `R + W > N` ensures read/write overlap within the **same replica set**. Example: `N = 3, R = 2, W = 2`.
- `W = 1` means wait for one acknowledgment, not maintain only one copy.

Overlap alone does not establish linearizability: concurrent writes, version ordering, and failures still matter. Sloppy quorums can use substitute nodes outside the usual replica set, so the overlap argument may no longer hold.

### 2. Detecting a conflict is different from resolving it

Vector clocks track causality. With counters ordered as `[A, B]`:

```text
[1, 0] → [2, 0]    descendant: supersedes the older version
[2, 0] vs [1, 1]   concurrent: neither supersedes the other
```

A descendant has every counter at least as large, with at least one larger. Concurrent versions need an application merge policy; the clock cannot choose the correct business value.

### 3. Recovery mechanisms have separate jobs

| Mechanism | Job |
| --- | --- |
| Gossip / heartbeats | Spread membership and liveness information; timeouts indicate suspected failure. |
| Sloppy quorum | Use reachable substitutes when normal replicas are unavailable. |
| Hinted handoff | Retain temporary writes and deliver them to intended replicas after recovery. |
| Anti-entropy / Merkle trees | Locate differing data ranges and repair replicas without transferring all data. |

These distinctions follow the [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf). A Merkle tree detects differences; version reconciliation determines what to retain.

## Trace One Request

**Across nodes:** client → coordinator → responsible replicas → wait for W acknowledgments or R read responses → return a result, reconciling versions when necessary. The coordinator is a per-request role, not necessarily one central server.

**Inside a replica:**

- **Write:** append to a commit log → update the in-memory table → flush later to an immutable SSTable on disk.
- **Read:** check memory and relevant SSTables → reconcile versions. Bloom filters skip files that definitely lack the key; “possibly present” still requires a lookup.

The log supports crash recovery; the acknowledgment/flush policy determines durability. This storage path is described in the chapter and the [Cassandra storage-engine documentation](https://cassandra.apache.org/doc/stable/cassandra/architecture/storage-engine.html).

## Quick Revision Questions

1. Why must replicas use distinct physical servers despite virtual nodes?
2. With `N = 3, W = 2, R = 2`, what changes if a substitute node accepts a write?
3. Can vector clocks merge two conflicting shopping-cart updates automatically?
4. Which mechanism handles temporary missed writes, and which detects longer-term replica divergence?

## Vocabulary and Interview Phrases

### General Vocabulary

| Word | Plain meaning | Example in context |
| --- | --- | --- |
| propagate | Spread information between nodes | “Updates propagate asynchronously to replicas.” |
| stale | Outdated | “A lagging replica may return stale data.” |
| infeasible | Not practical or achievable | “Keeping the entire dataset in memory is infeasible.” |
| heterogeneity | Differences in capabilities or characteristics | “Virtual nodes help accommodate hardware heterogeneity.” |
| reconcile | Resolve differences into an agreed result | “The application reconciles conflicting versions.” |
| downside / upside | Disadvantage / advantage | “The upside is availability; the downside is reconciliation complexity.” |
| inevitable | Unavoidable | “At scale, individual node failures are inevitable.” |
| insufficient | Not enough | “One acknowledgment is insufficient when W is two.” |
| decentralize | Distribute control across participants | “Gossip helps decentralize membership management.” |
| sloppy | Loose or relaxed | “A sloppy quorum relaxes which nodes may respond.” |
| handoff | Transfer of responsibility or data | “The temporary node performs a handoff after recovery.” |
| proportional | Changing in a constant ratio | “Assign virtual nodes in proportion to server capacity.” |
| negligible | Small enough to ignore for the decision | “Measure whether the added latency is negligible.” |

### Technical Terms and Useful Phrases

| Term or phrase | Meaning and usage |
| --- | --- |
| quorum consensus | In this chapter, completing reads/writes after enough replica replies. Do not equate quorum counts alone with a full consensus protocol such as Raft. |
| D2 descends from D1 | D2 was derived from D1, directly or through intermediate updates. Also say: “D2 is a descendant of D1.” |
| single point of failure | A component whose failure alone can make the service unavailable. Example: “A sole coordinator would be a single point of failure.” |

*Primary reference: Alex Xu, System Design Interview – An Insider’s Guide, Chapter 6, [Design a Key-Value Store](https://bytebytego.com/courses/system-design-interview/design-a-key-value-store). The CAP, Dynamo, and Cassandra links above support the additional implementation notes.*

*Authorship note: This revision guide was refined with AI assistance.*
