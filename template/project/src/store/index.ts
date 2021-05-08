import { createStore } from 'vuex'

/**
 * @example
 * 在组件中使用：
 * const store = useStore()
 * console.log(store.state.test)
 */
export default createStore({
  state: {
    test: 666
  },
  mutations: {
    setConfig(state, value) {
      state.test = value
    },
  },
  actions: {},
  modules: {}
})