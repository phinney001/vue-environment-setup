const fs = require('fs')
const path = require('path')
const { prompt } = require('inquirer')
const Router = require('./router.js')
const Menu = require('./menu.js')
const { green } = require('ansi-colors')

class VueCli {
  /**
   * 拷贝目录
   * @param {string} oldPath 旧目录路径
   * @param {string} newPath 新目录路径
   */
  copyDir(oldPath, newPath, projectName) {
    const fileList = fs.readdirSync(oldPath)
    // 初始创建文件夹
    fs.mkdirSync(newPath, { recursive: true })
    // 文件循环复制
    fileList.forEach(filePath => {
      const oldFilePath = path.join(oldPath, filePath)
      const newFilePath = path.join(newPath, filePath)
      // 判断是否是文件
      if (fs.statSync(oldFilePath).isFile()) {
        // 复制文件
        let newFileString = fs.readFileSync(oldFilePath, 'utf-8')
        newFileString = newFileString.replace(/PROJECTNAME/g, projectName)
        fs.writeFileSync(newFilePath, newFileString, 'utf-8')
      } else {
        // 如果是文件夹递归
        this.copyDir(oldFilePath, newFilePath, projectName)
      }
    })
  }

  /**
   * 初始化
   * @param {string} projectName 当前项目名称
   */
  async init(projectName) {
    // 问题列表
    const answers = await prompt([
      ...(!projectName
        ? [{
          name: 'project-name-en',
          type: 'input',
          message: '请输入项目英文名称：'
        }]
        : []
      ),
      {
        name: 'project-name-cn',
        type: 'input',
        message: '请输入项目中文名称：'
      },
    ])
    // 项目文件夹名称
    if (!projectName) projectName = answers['project-name-en']
    // 项目模板地址
    const templatePath = path.join(__dirname, './template/project')
    // 项目地址
    const projectPath = path.join(process.cwd(), projectName)

    // 判断文件夹是否存在
    if (fs.existsSync(projectPath)) {
      const confirm = await prompt({
        name: 'cover',
        type: 'confirm',
        message: `${projectPath}已经存在，是否要覆盖？`
      })
      if (!confirm.cover) return
    }

    // 拷贝文件
    this.copyDir(templatePath, projectPath, answers['project-name-cn'])
    fs.renameSync(
      path.join(projectPath, '.ignore'),
      path.join(projectPath, '.gitignore'),
    )
    console.log(green('项目创建成功！'))
  }

  /**
   * 安装环境
   */
  start() {
    const projectName = Array.from(process.argv).slice(2).join(' ')
    // 是否是操作路由
    if (projectName === 'router') {
      const router = new Router()
      router.start()
    } else if (projectName === 'menu') {
      const menu = new Menu()
      menu.start()
    } else {
      this.init(projectName)
    }
  }
}

const RC = new VueCli()
RC.start()
