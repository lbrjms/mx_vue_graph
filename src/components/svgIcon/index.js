import Vue from 'vue';
import SvgIcon from '@/components/svgIcon/index.vue';
// 全局注册组件
Vue.component('svg-icon', SvgIcon);
// 定义一个加载目录的函数
const requireAll = requireContext => requireContext.keys().map(requireContext);
const req = require.context('/src/icons/svg/', true, /\.svg$/);
// 加载目录下的所有 svg 文件
console.log('req.keys() :', req.keys());
requireAll(req);