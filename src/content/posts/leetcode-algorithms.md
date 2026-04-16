---
title: "LeetCode Algorithms"
published: 2026-03-03
draft: false
description: "Concise algorithm walkthroughs inspired by LeetCode problems."
tags: ["algorithms", "leetcode", "problem-solving"]
category: Algorithms
---

# Graph

## 1. DAG & Cycle Detection

### 1.1 Topological Sort
Use **indegrees** to repeatedly take nodes with **0 prerequisites**. If you cannot take all nodes, a **cycle** exists. Returns a valid order for a **DAG**.
Reference: [\[1\]](#ref-1)
```python
def topologicalSort(n: int, edges: List[List[int]]) -> List[int]:
    g = [[] for _ in range(n)]
    in_deg = [0] * n
    for x, y in edges:
        g[x].append(y)
        in_deg[y] += 1  # Count prerequisites for y

    topo_order = []
    q = deque(i for i, d in enumerate(in_deg) if d == 0)  # No prerequisites; ready to take
    while q:
        x = q.popleft()
        topo_order.append(x)
        for y in g[x]:
            in_deg[y] -= 1  # After taking x, one prerequisite of y is cleared
            if in_deg[y] == 0:  # All prerequisites of y are cleared
                q.append(y)  # Add to the queue

    if len(topo_order) < n:  # Cycle exists
        return []
    return topo_order

```

### 1.2 Three-Color DFS
Use colors: **0 = unvisited**, **1 = visiting**, **2 = done**. A **back-edge** to a visiting node means a **cycle**. If no cycle, you can reverse **postorder** for a topo order.
Reference: [\[1\]](#ref-1)
```python
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        g = [[] for _ in range(numCourses)]
        for a, b in prerequisites:
            g[b].append(a)

        colors = [0] * numCourses
        # Return True if a cycle is found
        def dfs(x: int) -> bool:
            colors[x] = 1  # x is in the visiting state
            for y in g[x]:
                # Case 1: colors[y] == 1 -> back edge, cycle found
                # Case 2: colors[y] == 0 -> unvisited, keep DFS
                # Case 3: colors[y] == 2 -> fully processed, no need to revisit
                if colors[y] == 1 or colors[y] == 0 and dfs(y):
                    return True  # Cycle found
            colors[x] = 2  # x fully processed; no cycle from x
            return False  # No cycle found

        for i, c in enumerate(colors):
            if c == 0 and dfs(i):
                return False  # Cycle exists
        return True  # No cycle
```

### 1.3 Applicable Scenarios
- **Detect cycles** in a directed graph.
- Need **course scheduling** style feasibility checks.
- Want **DFS-based** ordering or postorder reasoning.

### 1.4 Representative Problems
- [207. Course Schedule](https://leetcode.com/problems/course-schedule/)
- [210. Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [269. Alien Dictionary](https://leetcode.com/problems/alien-dictionary/)
- [802. Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)
- [1203. Sort Items by Groups Respecting Dependencies](https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/)

## 2. Union-Find

### 2.1 Template
Use **parent** pointers with **union by size** and **path compression** to maintain dynamic connectivity. Supports fast **find**, **union**, and **connected** checks (near O(1) amortized).
Reference: [\[2\]](#ref-2)

```python
class UnionFind:
    def __init__(self, n: int):
        # Start with n singleton sets {0}, {1}, ..., {n-1}
        # Each set's representative is itself with size 1
        self._fa = list(range(n))  # parent / representative
        self._size = [1] * n  # set size (stored at representative)
        self.cc = n  # number of connected components

    # Return the representative of x, with path compression
    def find(self, x: int) -> int:
        fa = self._fa
        # If fa[x] == x, x is the representative
        if fa[x] != x:
            fa[x] = self.find(fa[x])  # compress path to representative
        return fa[x]

    # Check if x and y are in the same set
    def is_same(self, x: int, y: int) -> bool:
        # If representatives match, they are in the same set
        return self.find(x) == self.find(y)

    # Merge the set of from_ into the set of to, return True if merged
    def merge(self, from_: int, to: int) -> bool:
        x, y = self.find(from_), self.find(to)
        if x == y:  # already in the same set
            return False
        self._fa[x] = y  # link representative x under y
        self._size[y] += self._size[x]  # update size on representative
        # No need to update _size[x]; find(x) == y from now on
        self.cc -= 1  # one less component
        return True

    # Return the size of the set containing x
    def get_size(self, x: int) -> int:
        return self._size[self.find(x)]  # size stored at representative

```

### 2.2 Applicable Scenarios
- **Dynamic connectivity** with repeated unions and queries.
- Need to track **connected components** in an undirected graph.
- **Grouping/merging** entities while querying group sizes.

### 2.3 Representative Problems
- [200. Number of Islands](https://leetcode.com/problems/number-of-islands/)
- [323. Number of Connected Components in an Undirected Graph](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/)
- [547. Number of Provinces](https://leetcode.com/problems/number-of-provinces/)
- [684. Redundant Connection](https://leetcode.com/problems/redundant-connection/)
- [765. Couples Holding Hands](https://leetcode.com/problems/couples-holding-hands/)

# Sliding Window

## 1. Fixed-Size Window

### 1.1 Template
Maintain a window of **fixed length k**. Each step: add the right element, update the answer when the window is formed, then remove the left element.  
Reference: [\[3\]](#ref-3)

```python
class Solution:
    def maxVowels(self, s: str, k: int) -> int:
        ans = vowel = 0
        for i, c in enumerate(s):  # enumerate right boundary i
            # 1) Right boundary enters the window
            if c in "aeiou":
                vowel += 1

            left = i - k + 1  # left boundary
            if left < 0:  # window size < k, not formed yet
                continue

            # 2) Update answer
            ans = max(ans, vowel)
            if ans == k:  # already at theoretical max
                break  # no need to continue

            # 3) Left boundary leaves the window
            if s[left] in "aeiou":
                vowel -= 1
        return ans

```

### 1.2 Applicable Scenarios
- **Max/min/count** over all length‑k substrings.
- **Rolling** statistics with a fixed window size.

### 1.3 Representative Problems
- [1456. Maximum Number of Vowels in a Substring of Given Length](https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/)
- [643. Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/)
- [438. Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string/)
- [567. Permutation in String](https://leetcode.com/problems/permutation-in-string/)
- [1343. Number of Sub-arrays of Size K and Average Greater Than or Equal to Threshold](https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/)

## 2. Variable-Size Window

### 2.1 Template
Expand the right boundary, and **shrink from the left** while the constraint is violated. Track the best window during the process.  
Reference: [\[4\]](#ref-4)

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        ans = left = 0
        window = set()  # characters between left and right
        for right, c in enumerate(s):
            # If c is already in the window, shrink until it is removed
            while c in window:
                window.remove(s[left])
                left += 1  # shrink window
            window.add(c)  # add c
            ans = max(ans, right - left + 1)  # update best length
        return ans
```

### 2.2 Applicable Scenarios
- **Longest/shortest** subarray or substring under a constraint.
- **Frequency‑based** constraints (distinct counts, character limits, etc.).

### 2.3 Exact‑K Trick
For “**exactly k**” constraints, compute `solve(k) - solve(k + 1)` where `solve(x)` counts **at most x**.  
Reference: [\[5\]](#ref-5)

### 2.4 Representative Problems
- [3. Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/)
- [76. Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/)
- [209. Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/)
- [424. Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/)
- [992. Subarrays with K Different Integers](https://leetcode.com/problems/subarrays-with-k-different-integers/)

# Binary Search

## 1. Template (First True / Lower Bound)
Find the **first index** where a **monotonic predicate** becomes true. Use `[lo, hi)` bounds to avoid off‑by‑one errors.  
Reference: [\[7\]](#ref-7)

```python
def lower_bound(lo: int, hi: int, ok) -> int:
    # Find first index in [lo, hi) that satisfies ok(i)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

## 2. Binary Search on Answer
When the answer is numeric and **feasibility is monotonic**, search the smallest feasible value.

```python
def min_feasible(lo: int, hi: int, feasible) -> int:
    # Answer in [lo, hi], feasible(x) is monotonic
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

## 3. Applicable Scenarios
- **First/last occurrence** in a sorted array.
- **Minimum/maximum** feasible value with monotonic constraints.
- **Rotated** or **partially ordered** arrays (with slight adaptations).

## 4. Representative Problems
- [704. Binary Search](https://leetcode.com/problems/binary-search/)
- [34. Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)
- [33. Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)
- [875. Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/)
- [1011. Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)

# Monotonic Queue

## 1. Template
Maintain a **deque of indices** whose values are **monotonic** (e.g., decreasing for max). Pop from the back to restore order, and pop from the front when indices fall out of the window.  
Reference: [\[6\]](#ref-6)

```python
from collections import deque

def maxSlidingWindow(nums: List[int], k: int) -> List[int]:
    dq = deque()  # indices, values decreasing
    ans = []
    for i, x in enumerate(nums):
        # Remove smaller values from the back
        while dq and nums[dq[-1]] <= x:
            dq.pop()
        dq.append(i)

        # Remove out-of-window indices from the front
        if dq[0] <= i - k:
            dq.popleft()

        # Window formed
        if i >= k - 1:
            ans.append(nums[dq[0]])
    return ans
```

## 2. Applicable Scenarios
- **Sliding window max/min** with O(n) total time.
- **Range max/min** over a moving window.
- **DP optimization** where transitions use a sliding max/min.

## 3. Representative Problems
- [239. Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)
- [1438. Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit](https://leetcode.com/problems/longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit/)
- [862. Shortest Subarray with Sum at Least K](https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k/)
- [1696. Jump Game VI](https://leetcode.com/problems/jump-game-vi/)
- [1425. Constrained Subsequence Sum](https://leetcode.com/problems/constrained-subsequence-sum/)

## Reference
1. <span id="ref-1"></span> [灵茶山艾府. (2024, March 5). 【算法题单】图论算法（DFS/BFS/拓扑排序/基环树/最短路/最小生成树/网络流）. LeetCode Discuss.](https://leetcode.cn/discuss/post/3581143/fen-xiang-gun-ti-dan-tu-lun-suan-fa-dfsb-qyux/)
2. <span id="ref-2"></span> [灵茶山艾府. (2024, April 23). 【算法题单】常用数据结构（前缀和/栈/队列/堆/字典树/并查集/树状数组/线段树）. LeetCode Discuss.](https://leetcode.cn/discuss/post/3583665/fen-xiang-gun-ti-dan-chang-yong-shu-ju-j-bvmv/)
3. <span id="ref-3"></span> [灵茶山艾府. (2024, June 13). 教你解决定长滑窗！适用于所有定长滑窗题目！. LeetCode.](https://leetcode.cn/problems/maximum-number-of-vowels-in-a-substring-of-given-length/solutions/2809359/tao-lu-jiao-ni-jie-jue-ding-chang-hua-ch-fzfo/)
4. <span id="ref-4"></span> [灵茶山艾府. (2022, November 9). 一个视频讲透滑动窗口！附题单！. LeetCode.](https://leetcode.cn/problems/longest-substring-without-repeating-characters/solutions/1959540/xia-biao-zong-suan-cuo-qing-kan-zhe-by-e-iaks/)
5. <span id="ref-5"></span> [灵茶山艾府. (2023, December 17). 【算法题单】滑动窗口与双指针（定长/不定长/单序列/双序列/三指针/分组循环）. LeetCode Discuss.](https://leetcode.cn/discuss/post/3578981/ti-dan-hua-dong-chuang-kou-ding-chang-bu-rzz7/)
6. <span id="ref-6"></span> [LeetCode. (n.d.). Sliding Window Maximum. LeetCode.](https://leetcode.com/problems/sliding-window-maximum/)
7. <span id="ref-7"></span> [CP-Algorithms. (n.d.). Binary Search. CP-Algorithms.](https://cp-algorithms.com/num_methods/binary_search.html)
