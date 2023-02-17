export default {
  methods: {
    callToolsAction(name, params) {
      let methods = this.$options.methods;
      console.log("dddd :", params, methods);
      let self = this;
      methods[name](self, params);
    },
    // 组合
    enGroup(self) {
      self.editor.graph.setSelectionCell(self.editor.groupCells());
      // this.editor.groupCells(null, 0, this.graph.getSelectionCells());
    },
    // 删除节点
    deleteNode(self) {
      var cells = self.graph.getSelectionCells();
      self.graph.removeCells([...cells]);
    },
    // 是否展示网格
    showGrid(self) {
      self.showBackground = !self.showBackground;
    },
    // 前进
    goForward(self) {
      self.undoMng.redo();
    },
    // 撤退
    goBack(self) {
      self.undoMng.undo();
    },
    // 放大
    zoomIn(self) {
      self.graph.zoomIn();
    },
    // 缩小
    zoomOut(self) {
      self.graph.zoomOut();
    },
    // 等比例缩放
    autoSize(self) {
      // 方法一
      // this.editor.execute('actualSize');
      //方法二：
      self.graph.zoomActual();
      self.graph.fit(); //自适应
      self.graph.center(); //将画布放到容器中间
    },
    // 生成图片
    showImage(self) {
      self.editor.execute("show"); //直接页面跳转,并以svg流程图
      // 下载svg流程图
      const svg = self.exportModelSvg();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      let link = document.createElement("a");
      link.href = url;
      link.download = "model.svg";
      link.click();
    },
    
  },
};
