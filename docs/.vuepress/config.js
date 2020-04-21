module.exports = {
  title: '一个前端小青年的学习笔记',
  description: 'good good study, day day up',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'react源码解析', link: '/react源码解析/' },
      { text: 'javaScript', link: '/javaScript/' },
      { text: '数据结构与算法', link: '/数据结构与算法/'},
      { text: '设计模式', link: '/设计模式/' },
      { text: '前端性能优化', link: '/前端性能优化/' }
    ],
    sidebar: {
      '/react源码解析/': [
        '',
        'react暴漏的api'
      ],
      '/javaScript/': [
        '',
        'TALKABOUT',
        'PROTOTYPE',
        '模块化'
      ],
      '/数据结构与算法/': [
        '',
        '数据结构',
        '算法'
      ],
      '/设计模式/': [
        '',
        '单例模式',
        '策略模式',
        '代理模式',
        '迭代器模式'
      ],
      '/前端性能优化/': [
        '',
      ]
    }
  },
}