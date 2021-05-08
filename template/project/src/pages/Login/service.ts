import request from '@/utils/request'

// 登录
export async function login(data?: any) {
  // return request.post('/login', data)
  return Promise.resolve({
    access_token: 'sdfakhjhdfkahsfjkdhsk',
    roles: []
  })
}

// 获取菜单
export async function queryMenus() {
  // return request.get('/menu')
  return Promise.resolve([])
}


// 修改密码
export async function changePassword(data?: any) {
  // return request.post('/update-password', data)
  return Promise.resolve({ httpStatus: 200 })
}