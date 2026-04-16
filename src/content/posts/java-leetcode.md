---
title: "Java grammar for OA"
published: 2026-04-13
draft: false
description: "Compact Java syntax and library calls that are easy to misremember under time pressure in online assessments."
tags: ["java", "leetcode", "interview-prep"]
category: Interview Prep
---

Short reference for **language mechanics** (types, collections APIs, conversions). It is not an algorithms playbook.

---

## Imports

```java
import java.util.*;
```

`java.util.*` pulls in `List`, `Map`, `Set`, `Queue`, `Deque`, `PriorityQueue`, `ArrayDeque`, `LinkedList`, `Arrays`, `Collections`, `Comparator`, `Objects`. Add `java.util.stream.*` only if you actually use streams.

---

## Generics and primitives

- Type parameters must be **reference types**: `List<Integer>`, not `List<int>`.
- `int[]` is a **single** array object; it is **not** autoboxed to `Integer[]`.
- Compare strings with **`s1.equals(s2)`**, not `==` (unless you mean reference identity).

---

## `Arrays` (static helpers on arrays)

```java
Arrays.sort(a);                          // int[], long[], char[], etc.
Arrays.sort(a, from, to);                // half-open range [from, to)
Arrays.sort(intervals, comparator);      // int[][], Integer[][], etc.

Arrays.binarySearch(a, key);            // sorted first; returns index or negative insertion point
Arrays.fill(a, v);
Arrays.copyOf(a, newLen);
Arrays.equals(a, b);
Arrays.toString(a);                     // 1D
Arrays.deepToString(a);                 // nested arrays
```

`substring(begin, end)` on `String` uses **end-exclusive** indices; `Arrays.sort` ranges are **half-open** `[from, to)`.

---

## `String` and `StringBuilder`

```java
s.length();                 // not .size()
s.charAt(i);
s.substring(i);           // from i to end
s.substring(i, j);        // [i, j)

char[] c = s.toCharArray();
String t = new String(c);

StringBuilder sb = new StringBuilder();
sb.append(x);
sb.reverse();
sb.toString();

String joined = String.join(" ", words);   // Iterable<? extends CharSequence>
```

---

## `List`

```java
List<Integer> list = new ArrayList<>();
list.add(x);
list.get(i);
list.set(i, v);
list.remove(list.size() - 1);   // pop back
Collections.sort(list);
Collections.sort(list, Collections.reverseOrder());
```

`Arrays.asList(...)` and `List.of(...)` give **fixed-size** lists. To mutate length, wrap: `new ArrayList<>(Arrays.asList(...))`.

---

## `Map` and `Set`

```java
Map<Character, Integer> m = new HashMap<>();
m.put(k, m.getOrDefault(k, 0) + 1);
m.merge(k, 1, Integer::sum);
m.computeIfAbsent(k, key -> new ArrayList<>());
m.containsKey(k);

Set<Integer> seen = new HashSet<>();
seen.add(x);
seen.contains(x);
```

---

## `Queue`, `Deque`, stacks

`LinkedList` implements both `Queue` and `Deque`. `ArrayDeque` is usually preferred for stack and deque operations.

```java
Queue<int[]> q = new LinkedList<>();
q.offer(e);
q.poll();      // null if empty
q.peek();

Deque<Integer> dq = new ArrayDeque<>();
dq.offerLast(x);
dq.pollFirst();
// dq.peekFirst(), dq.peekLast()

Deque<Integer> st = new ArrayDeque<>();
st.push(x);
st.pop();
st.peek();
```

Avoid the legacy `Stack` class in new code.

---

## `PriorityQueue`

Default is a **min-heap** by natural order (for `Integer`, smallest first).

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
PriorityQueue<int[]> pqMax = new PriorityQueue<>((a, b) -> Integer.compare(b[0], a[0]));
```

Custom ordering must be **consistent** (define tie-breaking when two elements compare equal for your primary key).

---

## Comparators and `Integer.compare`

Prefer `Integer.compare(a, b)` over subtracting ints (avoids overflow and handles signs correctly).

```java
Arrays.sort(points, (p, q) -> {
    int c = Integer.compare(p[0], q[0]);
    return c != 0 ? c : Integer.compare(p[1], q[1]);
});

Arrays.sort(points,
    Comparator.comparingInt((int[] p) -> p[0]).thenComparingInt(p -> p[1]));
```

---

## Conversions (the parts people mix up)

**`int[]` and `List<Integer>`**

```java
List<Integer> list = new ArrayList<>();
for (int x : arr) list.add(x);

int[] out = list.stream().mapToInt(Integer::intValue).toArray();
```

**`Integer[]` and `List<Integer>`**

```java
List<Integer> list = Arrays.asList(boxed);           // fixed size
list = new ArrayList<>(Arrays.asList(boxed));       // mutable
Integer[] out = list.toArray(new Integer[0]);
```

**`String[]` and `List<String>`**

```java
List<String> list = new ArrayList<>(Arrays.asList(arr));
String[] out = list.toArray(new String[0]);
```

**Do not** pass a primitive `int[]` to `Arrays.asList` expecting a list of numbers: you get a **one-element** list containing that array (type `List<int[]>`), not `List<Integer>`.

---

## Math and constants

```java
Math.max(a, b);
Math.min(a, b);
Math.abs(x);

Integer.MIN_VALUE;
Integer.MAX_VALUE;
Long.MAX_VALUE;
```

Use **`long`** for accumulators when sums or products can exceed `int` range. For binary search indices, `int mid = lo + (hi - lo) / 2` avoids overflow in `lo + hi`.

---

## One-screen OA checklist

| You need | API to reach for |
| --- | --- |
| Sort primitive array | `Arrays.sort` |
| Sort `ArrayList` | `Collections.sort` |
| Stable frequency count | `HashMap` + `getOrDefault` / `merge` |
| Only lowercase a-z | `int[26]` and `c - 'a'` |
| Min / max heap | `PriorityQueue` / `reverseOrder` |
| FIFO | `Queue` + `LinkedList`, `offer` / `poll` |
| Stack | `Deque` + `ArrayDeque`, `push` / `pop` |
| Build answer string | `StringBuilder` |
