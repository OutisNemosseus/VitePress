---
title: Quicksort
date: 2026-06-20
tags:
  - Python
  - 代码
source: quicksort.py
---

<script setup>
const code = "def quicksort(arr):\n    \"\"\"经典快速排序：选基准、分区、递归。\"\"\"\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)\n\n\nif __name__ == \"__main__\":\n    print(quicksort([3, 6, 1, 8, 2, 9, 4]))\n"
</script>

# Quicksort

> 由 `source/quicksort.py` 自动生成 · Python

<MonacoViewer :code="code" language="python" filename="quicksort.py" />
