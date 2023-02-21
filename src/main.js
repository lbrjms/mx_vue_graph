import Vue from 'vue'
import App from './App.vue'

import "./style/iconfont.css"

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

import JsonViewer from 'vue-json-viewer'
Vue.use(JsonViewer)

import '@/components/svgIcon/index.js' // svg icon


Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
