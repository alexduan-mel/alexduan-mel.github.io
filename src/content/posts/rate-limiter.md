---
title: "Rate Limiter"
published: 2026-02-09
draft: false
tags: ["system-design", "distributed-systems", "rate-limiting"]
description: "Rate limiter design notes: algorithm trade-offs, atomic Redis operations, shared state, and failure handling."
category: System Design
---

These are my review notes from Chapter 4 of *System Design Interview – An Insider’s Guide* by Alex Xu, with additional Redis implementation clarifications. The parts I found most useful to unpack were atomicity, shared state, and what “centralized Redis” actually means.

A rate limiter controls how frequently a client can perform an action—for example, five login attempts per minute per account or 100 API requests per minute per API key. It helps protect backend capacity, reduce abuse, and control costs. It is one layer of defense; an application limiter alone cannot stop an attack that saturates the network before requests reach it.

## 1. Clarify the Rule Before Choosing an Algorithm

A requirement such as “100 requests per minute” is incomplete. First ask:

- **Who and what?** Limit by user, API key, IP address, or a combination? Does the rule apply to one endpoint or all requests?
- **What time semantics?** A fixed calendar minute, any rolling 60 seconds, or an average rate with bursts?
- **Where?** One server, multiple instances, or multiple regions? Enforce at the gateway or in application middleware?
- **How strict?** Is temporary overage acceptable? What latency and availability are required?
- **What happens at the limit?** Reject immediately or queue work? Count all attempts or only admitted requests?

I initially assumed a server-side API limiter without saying so. The interview lesson is to make that assumption explicit. Client-side throttling can reduce unnecessary requests, but authoritative enforcement belongs on infrastructure we control.

For these notes, assume multiple gateway instances enforce a shared per-client quota and reject excess requests immediately. Queuing is an alternative discussed under leaky bucket.

## 2. Choose an Algorithm by Traffic Shape

| Algorithm | State and behavior | Main trade-off |
| --- | --- | --- |
| Token bucket | Refill tokens at a steady rate; each admitted request consumes one | Allows a controlled burst up to bucket capacity |
| Leaky bucket, queue variant | Buffer requests in a bounded queue and drain at a fixed rate | Smooths output, but adds waiting time and rejects when full |
| Fixed window counter | Count requests in each fixed interval | Simple and compact, but allows boundary bursts |
| Sliding window log | Keep timestamps of admitted requests in the rolling interval | Exact rolling count, with memory proportional to retained requests |
| Sliding window counter | Weight the previous window’s count and add the current count | Compact, but estimates rolling usage |

### Token bucket: separate sustained rate from burst size

A bucket with capacity 20 and refill rate 5 tokens per second can admit 20 requests immediately when full, then sustain about five per second. Unused tokens accumulate only up to capacity.

This does not mean “at most five requests in every one-second interval.” Capacity and refill rate express different parts of the policy.

### Leaky bucket: absorb bursts, smooth output

In the queue-based version, a burst can enter the queue if space is available, but requests leave at a fixed rate. The trade-off is queueing delay. Saying “bursts are not allowed” misses the distinction between bursty arrivals and smooth departures.

### Fixed window: understand the boundary

With a limit of five requests per minute, five requests just before `12:01` and five just after it are all allowed. Each fixed minute satisfies the limit, while a rolling 60-second interval can contain all ten.

Fixed windows remain useful when their simplicity and boundary behavior fit the requirement. They do not enforce “at most N requests in any continuous T-second interval.”

### Sliding windows: accuracy versus state

A sliding window log removes timestamps outside the interval, counts those remaining, and records the current request if admitted.

A sliding window counter approximates that count:

```text
estimated usage = current count + previous count × (1 − elapsed fraction)
```

For example, 15 seconds into a 60-second window, with 80 requests in the previous window and 10 in the current one:

```text
estimated usage = 10 + 80 × 0.75 = 70
```

To admit another request under a limit of 100, check whether the estimate plus one is at most 100. The estimate assumes traffic was spread evenly across the previous window; concentrated traffic can make it overcount or undercount.

## 3. Start with a Shared-State Design

```text
Client → Gateway / rate limiter → API server, if allowed
                   |
                   +→ Shared Redis state → allow / reject decision
                   |
                   +→ HTTP 429, if rejected
```

The gateway identifies the client, loads the applicable rule, and asks Redis to perform an atomic state update and decision. The gateway then forwards or rejects the request; Redis does not forward HTTP traffic.

Keep **rules** and **usage state** distinct. Rules describe the quota and algorithm and can be distributed through configuration. Usage state changes on each request and must be coordinated for a shared quota. Instances also need a consistent rule version so they interpret that state the same way.

A logical state key might include the policy, client identifier, and endpoint group. A fixed-window counter also needs the window identifier. Expiration cleans up inactive state; the algorithm defines when a window ends.

If two instances independently allow 100 requests for the same API key, together they may allow 200. Sharing state gives both instances access to the same quota. Local counters are still useful for per-instance protection or deliberately partitioned quotas; they simply do not enforce an uncoordinated global limit.

## 4. Atomic Commands and Atomic Decisions

The distinction that initially confused me was that **Redis `INCR` is atomic, but a sequence of application operations is not automatically atomic**.

Suppose the limit is 10 and the counter is 9:

```text
Request A                  Request B
read 9                     read 9
check 9 < 10: allow        check 9 < 10: allow
increment                  increment
```

Both requests pass, even though only one slot remained. The entire check-and-update decision needs coordination.

Redis can execute a short Lua script without other commands interleaving. For a counter that tracks admitted requests, the conceptual operation is:

```text
Atomically:
  read the current window's counter, treating a missing key as zero
  if count >= limit: return REJECT
  increment the counter
  if newly created: set expiration for that window
  return ALLOW
```

This is pseudocode, not a complete implementation. Window selection and expiration must agree, and expiration should not restart on every request for a fixed-window policy.

There is also an **increment-first** approach: use the value returned by `INCR` and allow only values at or below the limit. That avoids the read-before-increment race, but counts rejected attempts too. Separately issuing `INCR` and `EXPIRE` risks leaving an unexpired key if the caller fails between them. Redis’s [counter and rate-limiter documentation](https://redis.io/docs/latest/commands/incr/) explains this pattern and its Lua fix.

The principle is to make the state transition required by the chosen algorithm atomic—not to assume every counter needs a preliminary read.

## 5. Sorted Sets and Lua Have Different Jobs

For a sliding window log, a Redis sorted set represents time-ordered request history. Use timestamps as scores and unique request identifiers as members so requests with identical timestamps do not overwrite each other.

The decision requires several steps:

```text
remove expired entries → count entries → check limit → add if allowed
```

A sorted set supplies the data structure. Lua can make those steps one atomic operation. Choosing the data structure alone does not prevent concurrent requests from both passing the check.

Use a consistent time source and define the interval boundary—for example, retain timestamps in `(now − window, now]`. Clock disagreement between limiter instances can otherwise change which requests count.

## 6. Shared Redis: Availability, Capacity, and Consistency

“Centralized” describes logically shared state. It does not require one physical machine.

| Concern | Mechanism | Limitation to remember |
| --- | --- | --- |
| Redundant copies | Replication | Copies can lag behind the primary |
| Recovery from a failed primary | Failover | Recently acknowledged updates may be lost |
| More aggregate capacity | Sharding across primaries | A single hot quota key still belongs to one shard |
| Correct concurrent decisions | Atomic operations on the owning primary | Atomicity alone does not guarantee durability across failover |

Normal quota decisions should use the authoritative primary, not a potentially stale replica. Redis uses asynchronous replication, so failover can lose recent usage updates and admit extra requests. See the [Redis replication documentation](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/).

Sharding spreads different clients’ keys across nodes. It does not automatically solve a heavily contended global quota. Redis Cluster also requires keys used together in a script to share a hash slot, which matters if one decision updates several quotas. See [Redis Cluster scaling](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/).

Across regions, a shared authoritative decision adds network latency and makes availability depend on connectivity. Regional quota allocations reduce coordination but can leave capacity unused in one region while another reaches its allocation. Choose according to the required strictness rather than assuming shared Redis solves every distributed-system problem.

## 7. Define Rejection and Failure Behavior

When a client exceeds its quota, return HTTP `429 Too Many Requests`. Where a retry time can be calculated, include `Retry-After`; document any additional quota headers. Clients should honor the delay and use backoff with jitter to avoid synchronized retries. The [HTTP 429 specification](https://www.rfc-editor.org/rfc/rfc6585#section-4) defines this response.

A limiter dependency failure is a different situation from a known quota violation. Choose a policy explicitly:

- **Fail open:** allow traffic when the limiter is unavailable, preserving access but weakening protection.
- **Fail closed:** deny requests when the quota cannot be checked, preserving protection but reducing availability.
- **Local fallback:** temporarily enforce a conservative per-instance limit, accepting that it is not an exact shared quota.

Use short dependency timeouts so an unavailable limiter does not stall every request. Monitor decision latency, rejection rate by rule, Redis errors, and fallback usage. A rejection spike may indicate abuse, but it may also mean a rule is too restrictive.

## What I Want to Remember

The design follows a chain of decisions: **define the quota → choose its time semantics → make each decision atomic → coordinate shared state → decide what failures may relax**.

For an interview, I would explain one complete request path and its trade-offs before expanding into clustering. For review notes, the most valuable examples are the ones that expose a misconception: fixed-window boundaries, two requests racing for one remaining slot, and replication lag during failover.

*Primary reference: Alex Xu, System Design Interview – An Insider’s Guide, Chapter 4. The Redis and HTTP links above support the additional implementation notes.*

*Authorship note: These notes reflect my review of the chapter and were consolidated and refined with AI assistance.*
