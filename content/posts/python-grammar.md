---
title: "Python Grammar"
date: 2026-03-08
draft: false
summary: "Concise notes on Python grammar and syntax."
tags: ["python", "grammar"]
---

## Tuples as Dictionary Keys
**Key idea**
- Dictionary keys must be **hashable** (immutable).
- Lists are **mutable** → not hashable.
- Tuples are **immutable** → hashable.

**Common pattern**
- Use a tuple as a stable **fingerprint** (e.g., Group Anagrams).
- Convert tuple to list when you need **mutability**.

```python
count = [1, 0, 3]    # List: unhashable (error if used as key)
key = tuple(count)   # Tuple: hashable (safe as dict key)
res[key].append(s)

t = (1, 2, 3)
lst = list(t)        # Tuple -> list for updates
```

**Pitfall**
- Don’t use a list or other mutable type as a dictionary key.

---

## divmod
**Key idea**
- `divmod(a, b)` returns `(a // b, a % b)` in one step.

**Common pattern**
- Use when you need **both** quotient and remainder (base conversion, pagination, grouping).

```python
q, r = divmod(17, 5)  # q = 3, r = 2
```

**Import**
- Built-in; no import needed.
- (Rare) `from builtins import divmod`

**Pitfall**
- For negative numbers, Python's `//` and `%` follow floor division rules.

---

## Strings
**Key idea**
- Strings are **immutable**; methods return a new string.

**Common pattern**
- Normalize case with `lower()` / `upper()` before comparison.
- Validate characters with `isalpha()` / `isdigit()` / `isalnum()`.

```python
s = "Hello123"
print(s.lower())      # "hello123"
print(s.upper())      # "HELLO123"
print(s.isalpha())    # False (contains digits)
print(s.isdigit())    # False (contains letters)
print(s.isalnum())    # True (letters + digits)
```

**Pitfall**
- `isalpha()` and `isdigit()` return `False` if the string is empty.

---

## Collections (Common Imports)
**Key idea**
- Most OA environments (e.g., HackerRank) need **explicit imports**.

**Common pattern**
- Start with the usual `collections` and `heapq` tools:

```python
from collections import defaultdict, Counter, deque
from heapq import heappush, heappop
```

**Quick reference**
- `collections.defaultdict` — dict with default factory
- `collections.Counter` — frequency counter
- `collections.deque` — fast queue/stack
- `heapq` — priority queue (min-heap)

**Built-ins (no import)**
- `dict`, `list`, `set`, `tuple`

**Easy way to remember (OA)**
- If you need **counts** or **queues**, import `collections`.
- If you need a **priority queue**, import `heapq`.

---

## Common Methods (LeetCode)
**List**
| Method | Use |
| --- | --- |
| `append(x)` | push to end |
| `pop()` / `pop(i)` | remove end / index |
| `extend(iterable)` | add many |
| `insert(i, x)` | insert at index |
| `remove(x)` | remove first match |
| `sort()` / `reverse()` | in-place order |

**Set**
| Method | Use |
| --- | --- |
| `add(x)` | insert |
| `remove(x)` / `discard(x)` | delete (error vs no error) |
| `pop()` | remove arbitrary |
| `update(iterable)` | add many |
| `intersection(...)` | common items |
| `union(...)` | all items |
| `difference(...)` | subtract items |

**Dict / defaultdict**
| Method | Use |
| --- | --- |
| `get(k, default)` | safe lookup |
| `setdefault(k, default)` | init if missing |
| `pop(k)` / `popitem()` | remove |
| `update(other)` | merge |
| `keys()` / `values()` / `items()` | iterate |

**Deque**
| Method | Use |
| --- | --- |
| `append(x)` / `appendleft(x)` | push right / left |
| `pop()` / `popleft()` | pop right / left |
| `extend(iterable)` / `extendleft(iterable)` | add many |
| `rotate(k)` | shift positions |

**Stack (list or deque)**
| Method | Use |
| --- | --- |
| `append(x)` | push |
| `pop()` | pop |
