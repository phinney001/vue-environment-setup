import { getAxis, getGrid, getTooltip, objectMerge } from 'phinney-toolkit'

// 图表公共配置
export const config = {
  grid: getGrid({
    top: 20
  }),
  xAxis: getAxis({
    line: '#d9d9d9',
    tick: {
      color: '#d9d9d9',
      center: true,
    },
    label: '#666',
  }),
  yAxis: getAxis({
    line: false,
    tick: false,
    split: '#d9d9d9',
    label: '#666',
  }),
  tooltip: getTooltip({
    line: {
      color: '#d9d9d9'
    },
  })
}

/**
 * 获取折线图配置
 * @param options 折线图配置
 */
export const getLine = (options: any = {}) => {
  return objectMerge({
    grid: {
      ...config.grid
    },
    xAxis: {
      ...config.xAxis
    },
    yAxis: {
      ...config.yAxis
    },
    tooltip: {
      trigger: 'axis',
      ...config.tooltip
    },
    series: {
      type: 'line',
      symbol: 'circle',
      symbolSize: 10,
    },
  }, options)
}

/**
 * 获取柱状图配置
 * @param options 柱状图配置
 */
export const getBar = (options: any = {}) => {
  return objectMerge({
    grid: {
      ...config.grid
    },
    xAxis: {
      ...config.xAxis
    },
    yAxis: {
      ...config.yAxis
    },
    tooltip: {
      trigger: 'axis',
      ...config.tooltip
    },
    series: {
      type: 'bar',
    },
  }, options)
}

/**
 * 获取饼图配置
 * @param options 饼图配置
 */
export const getPie = (options: any = {}) => {
  return objectMerge({
    legend: {
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      bottom: 0
    },
    series: {
      type: 'pie',
      radius: '60%',
    },
  }, options)
}

/**
 * 获取环形图配置
 * @param options 环形图配置
 */
export const getRing = (options: any = {}) => {
  return objectMerge({
    legend: {
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      bottom: 0,
    },
    series: {
      type: 'pie',
      radius: ['60%', '75%'],
    },
  }, options)
}

/**
 * 获取烛形图配置
 * @param options 烛形图配置
 */
export const getCandle = (options: any = {}) => {
  return objectMerge({
    grid: {
      ...config.grid,
      bottom: 40,
    },
    xAxis: {
      ...config.xAxis
    },
    yAxis: {
      ...config.yAxis
    },
    tooltip: {
      trigger: 'axis',
      ...config.tooltip
    },
    dataZoom: [
      {
        type: 'inside',
      },
      {
        show: true,
        type: 'slider',
        left: 40,
        right: 50,
        bottom: 0,
      }
    ],
    series: {
      type: 'candlestick',
    },
  }, options)
}
