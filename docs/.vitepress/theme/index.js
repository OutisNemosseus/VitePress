import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import PostTags from './PostTags.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    // 在每篇文章正文上方自动插入可点击的标签
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(PostTags)
    })
  }
}
