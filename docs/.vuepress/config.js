module.exports = {
  title: '一个前端小青年的学习笔记',
  description: '小二,上酒',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'react源码解析', link: '/react源码解析/' },
    ],
    // sidebar: [
    //   {
    //     title: 'react源码解析', // 侧边栏名称
    //     collapsable: true, // 可折叠
    //     children: [
    //       '/react源码解析/', // 你的md文件地址
    //     ]
    //   },
    //   {
    //     title: 'CSS', 
    //     collapsable: true,
    //     children: [
    //       '/blog/CSS/搞懂Z-index的所有细节',
    //     ]
    //   },
    //   {
    //     title: 'HTTP',
    //     collapsable: true,
    //     children: [
    //       '/blog/HTTP/认识HTTP-Cookie和Session篇',
    //     ]
    //   },
    // ]
  },
}