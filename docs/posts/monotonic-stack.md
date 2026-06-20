---
title: 单调栈 · 接雨水
date: 2026-06-19
tags:
  - 算法
  - Python
  - 栈
---

# 单调栈 · 接雨水

把「通用单调栈骨架」和「具体题目」解耦，骨架放在 class 外面，题目只负责写结算回调。

```python
# ============================================================
# 稳定层：通用单调栈骨架，放在 class 外面（和具体题目解耦）
# ============================================================
def monotonic_stack(arr, should_pop, on_pop):
    stack = []
    for i in range(len(arr)):
        while stack and should_pop(arr[stack[-1]], arr[i]):
            j = stack.pop()
            on_pop(j, i, stack)         # 结算回调
        stack.append(i)
    return stack


class Solution:
    def trap(self, height):
        total = 0

        def on_pop(j, i, stack):
            nonlocal total
            if not stack:               # 弹出后栈空 → 接不住水
                return
            left = stack[-1]            # 新栈顶 = 左墙
            width = i - left - 1
            bounded_height = min(height[left], height[i]) - height[j]
            total += width * bounded_height

        monotonic_stack(                # ← 现在直接调用，因为它在 class 外
            height,
            should_pop=lambda top, cur: top < cur,
            on_pop=on_pop,
        )
        return total
```

## 思路

- **稳定层** `monotonic_stack` 只关心“何时弹出”和“弹出时做什么”，对题目无感知。
- **业务层** `trap` 通过 `should_pop` / `on_pop` 两个回调注入逻辑。
