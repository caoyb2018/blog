module.exports = {
  title: '一个前端小青年的学习笔记',
  description: 'good good study, day day up',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'jsx到html', link: '/jsx到html/' },
      // { text: 'javaScript', link: '/javaScript/' },
      { text: '数据结构与算法', link: '/数据结构与算法/'},
      // { text: '设计模式', link: '/设计模式/' },
      // { text: '前端性能优化', link: '/前端性能优化/' },
      // { text: '一个很闷骚的网站', link: 'http://daily.cybqd.com' }
    ],
    sidebar: {
      '/jsx到html/': [
        '',
        '前置理念',
        'jsx和react.createElement',
        '创建根节点',
        '创建Fiber树',
        'render阶段',
        'diff算法',
        'commit阶段'
      ],
      '/javaScript/': [
        '',
        'TALKABOUT',
        'PROTOTYPE',
        '模块化',
        '作用域和闭包',
        'this和对象原型'
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
        '迭代器模式',
        '发布-订阅模式'
      ],
      '/前端性能优化/': [
        '',
        '数据存储'
      ]
    }
  },
}