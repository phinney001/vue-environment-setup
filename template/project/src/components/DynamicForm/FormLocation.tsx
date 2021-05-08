import { defineComponent, onMounted, ref, watch } from 'vue'
import { Input } from 'ant-design-vue'

declare const BMap: any

/**
 * 坐标接口
 * lng 经度
 * lat 维度
 */
export interface Coord {
  lng: number
  lat: number
}

/**
 * 地图事件接口
 * point 地图坐标点
 */
export interface MapEvent {
  point: Coord
  [key: string]: any
}

/**
 * 地址信息接口
 * address 详细地址
 */
export interface MapGeocoder {
  address: string
  [key: string]: any
}

/**
 * 地图实例接口
 * clearOverlays 清除地图覆盖物
 * addOverlay 添加地图覆盖物
 * panTo 移动至某坐标点
 * centerAndZoom 居中并设置地图缩放
 * addControl 添加控件
 * enableScrollWheelZoom 是否启用滚轮缩放
 * addEventListener 地图事件监听
 */
export interface MapProps {
  clearOverlays: () => void
  addOverlay: (marker: any) => void
  panTo: (point: any) => void
  centerAndZoom: (point: any, zoom: number) => void
  addControl: (data: any) => void
  enableScrollWheelZoom: (bool: boolean) => void
  addEventListener: (eventName: string, eventFunc: Function) => void
  [key: string]: any
}

/**
 * 选点地图props
 * height 地图高度
 * center 地图中心坐标数组
 * zoom 地图缩放度
 * config 地图其他配置
 * searchText 地图搜索文本
 * point 地图标记点
 */
export interface FormLocationProps {
  height?: number
  center?: [number, number]
  zoom?: number
  config?: any
  searchText?: string
  point?: Coord
  ref?: (refs: FormLocationRefs) => void
  [key: string]: any
}

/**
 * 选点地图props
 * address 地图标记点地址
 * coord 地图标记点坐标
 */
export interface FormLocationRefs {
  address?: string
  coord?: Coord
}

const FormLocation = defineComponent((props, { attrs }: { attrs: FormLocationProps, [key: string]: any }) => {
  const { height = 600, center, zoom = 13, config = {}, searchText, point, onRef  } = attrs

  const timestamp = ref(Date.now())
  const map = ref()
  const address = ref()
  const coord: any = ref(point)

  // 暴露给父组件数据
  onRef?.({
    address,
    coord,
  })

  // 初始化地图
  const initMap = () => {
    const baiduMap: MapProps = new BMap.Map(`baiduMap${timestamp.value}`, config)
    baiduMap.centerAndZoom(new BMap.Point(...(center || [113.694882, 34.80107])), zoom)
    baiduMap.addControl(new BMap.NavigationControl())
    baiduMap.enableScrollWheelZoom(true)
    map.value = baiduMap
    baiduMap.addEventListener('click', (e: MapEvent) => {
      coord.value =  e?.point
    })
  }

  // 画标记点
  const drawPoint = (points: Coord) => {
    if (map.value && points.lng && points.lat) {
      // 添加标记
      map.value.clearOverlays()
      const mPoint = new BMap.Point(points.lng, points.lat)
      const marker = new BMap.Marker(mPoint)
      map.value.addOverlay(marker)
      map.value.panTo(mPoint)
      // 获取地址
      const geocoder = new BMap.Geocoder()
      geocoder.getLocation(points, (res: MapGeocoder) => {
        address.value = res?.address
      })
    }
  }

  // 关键词搜索
  const handleSearch = (value: string) => {
    if (map.value) {
      map.value.clearOverlays()
      const local = new BMap.LocalSearch(map.value, {
        renderOptions: { map: map.value, panel: `baiduMapResult${timestamp.value}` },
        pageCapacity: 6,
        // onInfoHtmlSet: (res: MapGeocoder) => {
        //   console.log(res)
        // },
      })
      local.search(value)
    }
  }

  // 初始化
  onMounted(() => {
    initMap()
  })

  // 初始画标记点
  watch([map, coord], () => {
    if (map.value && coord.value) {
      drawPoint(coord.value)
    }
  })

  // 初始关键词搜索
  watch([map, searchText], () => {
    if (map.value && searchText) {
      handleSearch(searchText)
    }
  })

  // 中心点变化更新
  watch([map, center], () => {
    if (map.value && center) {
      map.value.panTo(new BMap.Point(...center))
    }
  })

  return () => (
    <div style={{ position: 'relative' }}>
      <Input
        value={searchText}
        placeholder="输入关键字搜索"
        onChange={(e: any) => handleSearch(e.target.value)}
        style={{ width: '200px', position: 'absolute', right: 0, zIndex: 10 }}
      />
      <div
        id={`baiduMapResult${timestamp.value}`}
        style={{ width: '200px', height: '500px', position: 'absolute', top: '40px', right: 0, zIndex: 12 }}
      />
      <div style={{ width: '100%', height: height + 'px' }} id={`baiduMap${timestamp.value}`} />
    </div>
  )
})

export default FormLocation
