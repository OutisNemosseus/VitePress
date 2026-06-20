---
title: 标签
aside: false
---

<script setup>
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from './.vitepress/posts.data.js'

const selected = ref(null)

const allTags = computed(() => {
  const counts = {}
  posts.forEach(p => p.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
  return Object.keys(counts).sort().map(name => ({ name, count: counts[name] }))
})

const filtered = computed(() =>
  selected.value ? posts.filter(p => p.tags.includes(selected.value)) : posts
)

function pick(tag) {
  selected.value = tag
  const url = new URL(window.location.href)
  if (tag) url.searchParams.set('tag', tag)
  else url.searchParams.delete('tag')
  history.replaceState(null, '', url)
}

// 支持从文章里通过 /tags?tag=算法 跳转过来时自动选中
onMounted(() => {
  const t = new URLSearchParams(window.location.search).get('tag')
  if (t) selected.value = t
})
</script>

# 标签

<div class="tag-cloud">
  <button :class="['tag-btn', { active: !selected }]" @click="pick(null)">全部 ({{ posts.length }})</button>
  <button
    v-for="t in allTags"
    :key="t.name"
    :class="['tag-btn', { active: selected === t.name }]"
    @click="pick(t.name)"
  >#{{ t.name }} ({{ t.count }})</button>
</div>

<ul class="post-list">
  <li v-for="p in filtered" :key="p.url">
    <a :href="withBase(p.url)">{{ p.title }}</a>
    <span class="post-date">{{ p.date }}</span>
  </li>
</ul>
