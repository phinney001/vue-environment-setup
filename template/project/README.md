# PROJECTNAME

## 安装依赖

```
npm install
```

## 开发模式运行

```
npm run dev
```
or
```
npm run start
```

## 编译项目

```
npm run build
```

## 运行编译后项目

```
npm run serve
```

## 环境和依赖
- node
- vite
- vue
- [ant-design-vue](https://2x.antdv.com/components/overview-cn) - Ant Design Vue

## 目录结构
- public `公共目录`
  - favicon.ico `图标`
- src
  - assets `资源存放`
  - components `组件存放`
    - CustomModal `自定义弹窗组件及方法`  
    - DynamicForm `动态表单组件`  
    - Exception `状态组件`
    - FilterForm `过滤表单组件`
    - IntegrationTable `一体化表格组件`
    - WaterMark `水印组件`
  - layouts `公共布局`
    - PassportLayout `未登录公共布局`
    - UserLayout `登录后公共布局`
    - config.ts `公共配置常量`
  - pages `页面组件`
  - routes `路由配置`
    - index.tsx `路由列表`
    - RouteAuth.tsx `路由验证组件`
  - store `存储共享`
    - index.tsx `store服务`
  - utils `工具包`
    - chart.ts `echarts图表快捷方法`
    - dict.ts `公共词典`
    - request.ts `公共请求服务`
  - access.ts `用户权限验证`
  - main.less `公共样式`
  - main.tsx `入口文件`
  - theme.less `公共样式常量`
  - shims-vue.d.ts `ts类型扩展文件`
- index.html `网页入口模板`
- tsconfig.json `typescript配置` 
- vite.config.ts `vite 配置`  
