# vue-environment-setup
<!-- Badges section here. -->
[![npm](https://img.shields.io/npm/v/vue-environment-setup.svg)](https://www.npmjs.com/package/vue-environment-setup)
[![npm](https://img.shields.io/npm/dm/vue-environment-setup.svg)](https://www.npmjs.com/package/vue-environment-setup)
[![Build Status](https://travis-ci.org/phinney001/vue-environment-setup.svg?branch=main)](https://travis-ci.org/phinney001/vue-environment-setup)

# 简介
`vue-environment-setup` 用于Vue项目自动化创建，依赖于:
+ [Node](https://nodejs.org/en)
+ [Vite](https://cn.vitejs.dev)
+ [ant-design-vue](https://2x.antdv.com/docs/vue/introduce-cn)

# 环境
  ```bash
  Node (version >= 14.x)
  ```

# 安装
  ```bash
  npm install vue-environment-setup -g
  ```

# 运行
  ```bash
  ves
  ```
# 生成路由
  + 默认路由文件路径：src/routes/index.tsx
  + 自定义路由文件路径：使用package.json中routes字段指向路由文件路径
  + 自定义配置模版目录：使用package.json中template字段指向模版目录，目录下必须存在三个文件：index.tsx、table.tsx、service.tsx
  + 在路由文件中添加路由，内容如: 
  ```javascript
  {
    path: '/parent',
    name: '父级路由中文名称',
    icon: 'smile',
    routes: [
      {
        path: '/parent/child',
        name: '子级路由中文名称',
        component: './Parent/Child',
        table: true, // 是否是一体化表格组件
        service: true, // 是否添加service文件
        cover: true, // 已有文件是否覆盖
      }
    ]
  }
  ```
  + 运行命令
  ```bash
  ves router
  ```