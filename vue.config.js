const { defineConfig } = require('@vue/cli-service')

const path = require('path') //必须引入
const resolve = dir => path.join(__dirname, dir)//必须引入

module.exports = defineConfig({
  transpileDependencies: true,

  chainWebpack: config => {

    config.module
    .rule('svg')
    .exclude.add(resolve('src/icons')) //对应下面配置svg的路径
    .end();

    config.module
    .rule('icons')
    .test(/\.svg$/)
    .include.add(resolve('src/icons')) //对应下面配置svg的路径
    .end()
    .use('svg-sprite-loader')
    .loader('svg-sprite-loader')
    .options({
      symbolId: 'icon-[name]'
    });
  },

})
