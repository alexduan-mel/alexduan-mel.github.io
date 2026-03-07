---
title: "LeetCode Algorithms"
date: 2026-03-03
draft: false
summary: "Concise algorithm walkthroughs inspired by LeetCode problems."
tags: ["leetcode", "algorithms"]
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

## Reference
[1]: https://leetcode.cn/discuss/post/3581143/fen-xiang-gun-ti-dan-tu-lun-suan-fa-dfsb-qyux/
[2]: https://leetcode.cn/discuss/post/3583665/fen-xiang-gun-ti-dan-chang-yong-shu-ju-j-bvmv/

## Reference
1. <a id="ref-1"></a> [1] 灵茶山艾府. (2024, March 5). 【算法题单】图论算法（DFS/BFS/拓扑排序/基环树/最短路/最小生成树/网络流）. LeetCode Discuss.
2. <a id="ref-2"></a> [2] 灵茶山艾府. (2024, April 23). 【算法题单】常用数据结构（前缀和/栈/队列/堆/字典树/并查集/树状数组/线段树）. LeetCode Discuss.
