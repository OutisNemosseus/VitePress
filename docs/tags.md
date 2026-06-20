---
title: 标签
aside: false
---

<script setup>
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from './.vitepress/posts.data.js'

// 多选：用数组存所有选中的标签
const selected = ref([])
// 匹配模式：'all' = 同时包含所有选中标签；'any' = 包含任一即可
const mode = ref('all')

const allTags = computed(() => {
  const counts = {}
  posts.forEach(p => p.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
  return Object.keys(counts).sort().map(name => ({ name, count: counts[name] }))
})

const filtered = computed(() => {
  if (selected.value.length === 0) return posts
  return posts.filter(p =>
    mode.value === 'all'
      ? selected.value.every(t => p.tags.includes(t))
      : selected.value.some(t => p.tags.includes(t))
  )
})

function isOn(tag) {
  return selected.value.includes(tag)
}

function toggle(tag) {
  if (isOn(tag)) {
    selected.value = selected.value.filter(t => t !== tag)
  } else {
    selected.value = [...selected.value, tag]
  }
  syncUrl()
}

function clearAll() {
  selected.value = []
  syncUrl()
}

function syncUrl() {
  const url = new URL(window.location.href)
  if (selected.value.length) url.searchParams.set('tag', selected.value.join(','))
  else url.searchParams.delete('tag')
  history.replaceState(null, '', url)
}

// 支持从文章里通过 /tags?tag=算法,Python 跳转过来时自动选中
onMounted(() => {
  const t = new URLSearchParams(window.location.search).get('tag')
  if (t) selected.value = t.split(',').map(s => s.trim()).filter(Boolean)
})
</script>

# 标签

<div class="tag-toolbar">
  <button :class="['tag-btn', { active: selected.length === 0 }]" @click="clearAll">全部 ({{ posts.length }})</button>
  <span class="tag-mode" v-if="selected.length > 1">
    <button :class="['mode-btn', { active: mode === 'all' }]" @click="mode = 'all'">同时满足</button>
    <button :class="['mode-btn', { active: mode === 'any' }]" @click="mode = 'any'">任一满足</button>
  </span>
</div>

<div class="tag-cloud">
  <button
    v-for="t in allTags"
    :key="t.name"
    :class="['tag-btn', { active: isOn(t.name) }]"
    @click="toggle(t.name)"
  >#{{ t.name }} ({{ t.count }})</button>
</div>

<p class="tag-result">共 {{ filtered.length }} 篇<span v-if="selected.length"> · 已选：{{ selected.join(' , ') }}</span></p>

<ul class="post-list">
  <li v-for="p in filtered" :key="p.url">
    <a :href="withBase(p.url)">{{ p.title }}</a>
    <span class="post-date">{{ p.date }}</span>
  </li>
</ul>
