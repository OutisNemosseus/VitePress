import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import PostTags from './PostTags.vue'
import MonacoViewer from './MonacoViewer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    // 在每篇文章正文上方自动插入可点击的标签
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(PostTags)
    })
  },
  enhanceApp({ app }) {
    // 全局注册 IDE 代码查看器，自动生成的文章里直接用 <MonacoViewer />
    app.component('MonacoViewer', MonacoViewer)
  }
}
