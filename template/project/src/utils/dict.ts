import { session, isArray, isNotNullOrUndefined } from 'phinney-toolkit'
import moment from 'moment'

// 词典缓存/获取
export const dict = (name: string, value?: any) => {
  const hasValue = isNotNullOrUndefined(value)
  const dictValues = session.get('DICT_MAP') || {}
  const dictName = name?.toUpperCase()
  if (hasValue) {
    dictValues[dictName] = value
    session.set('DICT_MAP', dictValues)
  }
  return dictValues[dictName]
}

// 获取开始结束时间对象
export const getStartEndTime = (times: any[], start = 'startTime', end = 'endTime') => {
  if (isArray(times) && times.length === 2) {
    return {
      [start]: `${moment(times[0]).format('YYYY-MM-DD')} 00:00:00`,
      [end]: `${moment(times[1]).format('YYYY-MM-DD')} 23:59:59`,
    }
  }
  return {}
}
