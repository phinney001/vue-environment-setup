const fs = require('fs')
const path = require('path')
const { green, red } = require('ansi-colors')

class Router {

  /**
   * 英文字符串首字母大写
   * @param {*} str 英文字符串 
   * @returns {string}
   */
  getFirstLetterUpper(str) {
    if (typeof str === 'string' && str[0]) {
      return str[0].toUpperCase() + str.substr(1)
    }
    return ''
  }

  /**
   * 生成路由组件
   * @param {string} routerList 路由列表
   * @param {string} routePath 路由组件路径
   * @param {string} templatePath 模版目录路径：包含index.tsx、table.tsx、service.tsx
   */
  generateRoute(routerList, routePath, templatePath) {
    const tempPath = templatePath
    ? path.join(process.cwd(), templatePath)
    : path.join(__dirname, './template/blank')
    routerList.forEach(item => {
      const isComponent = item.name && item.component
      const newRoutePath = isComponent ? path.join(routePath, item.component) : routePath
      if (isComponent) {
        const fileName = item.component.split('/').pop()
        const newRouteComponentPath = path.join(newRoutePath, 'index.tsx')
        const newRouteServicePath = path.join(newRoutePath, 'service.tsx')
        const newComponentExists =fs.existsSync(newRouteComponentPath)
        const newServiceExists =fs.existsSync(newRouteServicePath)
        
        // 初始创建文件夹
        fs.mkdirSync(newRoutePath, { recursive: true })
        // 是否覆盖组件文件
        if (!newComponentExists || (newComponentExists && item.cover)) {
          console.log(green(`${fileName}/index.tsx creating. . .`))
          // 获取空白组件字符串
          let componentString = fs.readFileSync(
            path.join(tempPath, 'index.tsx'),
            'utf-8'
          )
          // 是否是表格类组件
          if (item.table) {
            componentString = fs.readFileSync(
              path.join(tempPath, 'table.tsx'),
              'utf-8'
            )
          }
          componentString = componentString.replace(/HEADERTITLE/g, item.name)
            .replace(/COMPONENT/g, fileName)
          fs.writeFileSync(path.join(newRoutePath, 'index.tsx'), componentString, 'utf-8')
          console.log(green(`${fileName}/index.tsx create completed.`))
        }

        // 是否覆盖service文件
        if (!newServiceExists || (newServiceExists && item.cover)) {
          // 是否添加service
          if (item.service) {
            console.log(green(`${fileName}/service.tsx creating. . .`))
            fs.writeFileSync(
              path.join(newRoutePath, 'service.tsx'),
              fs.readFileSync(
                path.join(tempPath, 'service.tsx'),
                'utf-8'
              ),
              'utf-8'
            )
            console.log(green(`${fileName}/service.tsx create completed.`))
          }
        }
      }
      // 如果有子级路由递归
      if (item.routes && item.routes.length) {
        this.generateRoute(item.routes, newRoutePath, templatePath)
      }
    })
  }

  /**
   * 生成路由命令
   */
  start() {
    // package.json routes/template路径配置
    const packageJson = require(path.join(process.cwd(), 'package.json'))
    const templatePath = packageJson?.template
    let routesRelativePath = packageJson?.routes

    // 路由文件路径
    if (!routesRelativePath) {
      routesRelativePath = '/src/routes/index.tsx'
    }
    // 绝对路径
    const routesPath = path.join(process.cwd(), routesRelativePath)

    if (fs.existsSync(routesPath)) {
      // 获取路由列表
      let routerListString = fs.readFileSync(routesPath, 'utf-8')
      const matchString = routerListString.match(/\[\] = \[([\s\S]*)\n\]/)?.[1]
      let routerList = []

      if (routesPath.endsWith('.tsx')) {
        const nameRegex = /component: '([\s\S]*?)'/
        const componentRegex = /component: '([\s\S]*?)'/g
        let newMatchString = matchString
        const importList = []
        routerList = matchString.match(componentRegex)?.map((str) => {
          const matchIndex = matchString.indexOf(str)
          const startIndex = matchString.lastIndexOf('{', matchIndex)
          const endIndex = matchString.indexOf('}', matchIndex)
          const componentConfigString = matchString.substr(startIndex, endIndex - startIndex + 1)
          const filePath = componentConfigString.match(nameRegex)?.[1]?.replace(/[.]/g, '')
          const fileName = filePath?.split('/').filter(Boolean).map(this.getFirstLetterUpper).join('')
          const space = ('    ').repeat(filePath?.split('/').filter(Boolean).length)
          newMatchString = newMatchString.replace(
            componentConfigString,
            componentConfigString
              .replace(str, `component: ${fileName}`)
              .replace(`${space}table: true,\r\n`, '')
              .replace(`${space}service: true,\r\n`, '')
              .replace(`${space}cover: true,\r\n`, '')
          )
          importList.push(`import ${fileName} from '@/pages${filePath}'`)
          return eval(`[${componentConfigString}]`)[0]
        })
        routerListString = routerListString.replace(matchString, newMatchString)
        importList.forEach(ip => {
          if (!routerListString.includes(ip)) {
            const lineStartIndex = routerListString.lastIndexOf('import ')
            const lineEndIndex = routerListString.indexOf('\n', lineStartIndex)
            const lastImportString = routerListString.substring(lineStartIndex, lineEndIndex)
            routerListString = routerListString.replace(`${lastImportString}`, `${lastImportString}\n${ip}`)
          }
        })
        if (importList?.length) {
          console.log(green(`${routesRelativePath} updating. . .`))
          fs.writeFileSync(routesPath, routerListString, 'utf-8')
          console.log(green(`${routesRelativePath} update completed.`))
        }
      }
      if (routerList?.length) {
        // 路由生成路径
        const routeBasePath = `${process.cwd()}/src/pages`
        // 生成路由
        this.generateRoute(routerList, routeBasePath, templatePath)
      } else {
        console.log(green('No need to update.'))
      }
    } else {
      console.log(red(`${routesPath} must exists.`))
    }
  }
}

module.exports = Router
