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

```python
count = [1, 0, 3]    # List: unhashable (error if used as key)
key = tuple(count)   # Tuple: hashable (safe as dict key)
res[key].append(s)
```

**Pitfall**
- Don’t use a list or other mutable type as a dictionary key.

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
