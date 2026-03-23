---
title: "Bitwise Computation Tricks"
date: 2026-03-23
draft: false
summary: "Quick reference for common bitwise tricks and patterns."
tags: ["bitwise", "algorithms", "leetcode"]
---

## Bit Operations (Quick Map)
**Key idea**
- Bits are 0-indexed from the least significant bit (LSB).

**Common pattern**
- `x & y` keeps bits that are 1 in both.
- `x | y` sets bits that are 1 in either.
- `x ^ y` sets bits that differ.
- `~x` flips all bits (two's complement; beware sign in Python).
- `x << k` multiply by `2^k`.
- `x >> k` divide by `2^k` (floor for non-negative).

---

## Set / Clear / Toggle / Check a Bit
**Common pattern**
- Set k-th bit: `x |= (1 << k)`
- Clear k-th bit: `x &= ~(1 << k)`
- Toggle k-th bit: `x ^= (1 << k)`
- Check k-th bit: `((x >> k) & 1) == 1`

---

## Lowbit (Isolate Lowest Set Bit)
**Key idea**
- `x & -x` keeps only the lowest set bit.

```python
x = 0b1011000
low = x & -x   # 0b0001000
```

**Common pattern**
- Useful in Fenwick tree and bit decomposition.

---

## Clear Lowest Set Bit
**Key idea**
- `x & (x - 1)` clears the lowest set bit.

```python
x = 0b1011000
x = x & (x - 1)  # 0b1010000
```

---

## Power of Two Check
**Key idea**
- A power of two has exactly one set bit.

```python
is_power_of_two = (n > 0) and (n & (n - 1)) == 0
```

---

## Count Set Bits (Popcount)
**Common pattern**
- Python: `n.bit_count()`
- Kernighan loop:

```python
count = 0
while n:
    n &= n - 1
    count += 1
```

---

## XOR Tricks
**Key idea**
- `x ^ x = 0`, `x ^ 0 = x`, XOR is commutative.

**Common pattern**
- Single number in pairs:

```python
ans = 0
for x in nums:
    ans ^= x
```

**Common pattern**
- Two single numbers (others appear twice):

```python
xor_all = 0
for x in nums:
    xor_all ^= x

# Pick a differentiating bit (rightmost set bit)
diff = xor_all & -xor_all

a = b = 0
for x in nums:
    if x & diff:
        a ^= x
    else:
        b ^= x
# a and b are the two unique numbers
```

**Common pattern**
- Single number in triples (others appear three times):

```python
ones = twos = 0
for x in nums:
    ones = (ones ^ x) & ~twos
    twos = (twos ^ x) & ~ones
ans = ones
```

**Common pattern**
- Swap two numbers without temp:

```python
a ^= b
b ^= a
a ^= b
```

**Pitfall**
- XOR swap is mostly a trick; use a temp variable in real code for clarity.

---

## Range XOR via Prefix XOR
**Key idea**
- `xor(l..r) = pref[r] ^ pref[l - 1]`.

```python
pref = [0]
for x in nums:
    pref.append(pref[-1] ^ x)

# xor of nums[l..r]
res = pref[r + 1] ^ pref[l]
```

---

## XOR of 1..n (Pattern)
**Key idea**
- XOR from 1 to n repeats every 4.

```python
def xor_1_to_n(n: int) -> int:
    r = n % 4
    if r == 0:
        return n
    if r == 1:
        return 1
    if r == 2:
        return n + 1
    return 0
```

---

## Bit Mask Subsets (Set Operations)
**Common pattern**
- Check subset: `(mask & sub) == sub`
- Add element `k`: `mask |= (1 << k)`
- Remove element `k`: `mask &= ~(1 << k)`

---

## Submask Enumeration
**Key idea**
- Enumerate all submasks of `mask` in O(3^n) total over all masks.

```python
sub = mask
while sub:
    # use sub
    sub = (sub - 1) & mask
```

**Pitfall**
- This loop skips `sub = 0`; handle it separately if needed.

---

## Bitwise AND/OR Range (Quick Bounds)
**Key idea**
- Range AND decreases or stays the same as range grows.
- Range OR increases or stays the same as range grows.

**Common pattern**
- If `left` and `right` share a common prefix, AND keeps that prefix.
- Useful for problems like range AND (shift both until equal).

```python
def range_bitwise_and(left: int, right: int) -> int:
    shift = 0
    while left != right:
        left >>= 1
        right >>= 1
        shift += 1
    return left << shift
```
