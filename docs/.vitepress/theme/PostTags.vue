<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter } = useData()
const tags = computed(() => frontmatter.value.tags || [])
</script>

<template>
  <div v-if="tags.length" class="post-tags">
    <a
      v-for="t in tags"
      :key="t"
      :href="withBase('/tags?tag=' + encodeURIComponent(t))"
      class="post-tag"
    >#{{ t }}</a>
  </div>
</template>
