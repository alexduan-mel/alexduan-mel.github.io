---
title: "LeetCode Algorithms"
date: 2026-03-03
draft: true
summary: "Concise algorithm walkthroughs inspired by LeetCode problems."
tags: ["leetcode", "algorithms"]
---

# Graph

## 1. DAG & Cycle Detection

### 1.1 Topological Sort
Use **indegrees** to repeatedly take nodes with **0 prerequisites**. If you cannot take all nodes, a **cycle** exists. Returns a valid order for a **DAG**.
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

### 1.3 Representative Problems
- [207. Course Schedule](https://leetcode.com/problems/course-schedule/)
- [210. Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [269. Alien Dictionary](https://leetcode.com/problems/alien-dictionary/)
- [802. Find Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)
- [1203. Sort Items by Groups Respecting Dependencies](https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/)

## Reference
1. [灵茶山艾府](https://leetcode.cn/discuss/post/01LUak/)
