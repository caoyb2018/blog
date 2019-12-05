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
      { text: 'javaScript', link: '/javaScript/' }
    ],
    sidebar: {
      '/react源码解析/': [
        '',
        'CREATEELEMENT'
      ],
      '/javaScript/': [
        '',
        'TALKABOUT',
        'PROTOTYPE',
      ],
      // '/css/': [
      //   'three',
      //   'four'
      // ]
    }
  },
}