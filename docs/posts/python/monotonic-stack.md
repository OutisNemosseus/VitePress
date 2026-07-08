---
title: Monotonic Stack
date: 2026-07-08
tags:
  - Python
  - 算法
  - 单调栈
  - 接雨水
  - 双指针
source: monotonic_stack.py
---

<script setup>
import { withBase } from 'vitepress'
</script>

# Monotonic Stack

> 由 `source/monotonic_stack.py` 自动生成 · Python

::: tip 题目
接雨水 —— 给定每个柱子的高度，求下雨后能接住多少单位的水。
:::

<details class="section-fold section-warning">
<summary>错误处</summary>

弹栈后忘了判断栈是否为空，导致 stack[-1] 越界。

</details>

<details class="section-fold section-danger">
<summary>遗忘处</summary>

width = i - left - 1 里的 -1 容易漏掉。

</details>

::: info 延展
类似题——柱状图中最大的矩形、每日温度、下一个更大元素。
:::

<a :href="withBase('/code-pages/python/monotonic-stack.html')" target="_blank" rel="noopener" class="code-newtab-btn">↗ 在新标签页打开编辑器</a>

<details class="code-fold" open>
<summary>📄 显示 / 隐藏代码</summary>

<iframe :src="withBase('/code-pages/python/monotonic-stack.html')" width="100%" height="1600px" style="border:1px solid #3c3c3c;border-radius:8px" title="monotonic_stack.py - Monaco Editor"></iframe>

</details>
