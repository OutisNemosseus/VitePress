---
title: 设计模式 · 策略模式
date: 2026-06-18
tags:
  - 设计模式
  - Python
---

# 策略模式

把「会变化的算法」抽出来，用回调或对象注入——和单调栈那篇的解耦思路其实是一回事。

```python
def checkout(items, discount):
    total = sum(items)
    return discount(total)

full_price = lambda t: t
half_off   = lambda t: t * 0.5

print(checkout([10, 20, 30], half_off))  # 30.0
```
