<template>
  <div class="customToolbarContainer">
  
    <!-- 画布的顶部工具栏 -->
    <div class="top-tools">
      <el-col :span="4">
        <div
          style="
            text-align: left;
            font-weight: 700;
            font-size: 22px;
          "
        >
          WX GRAPH Editor
        </div>
      </el-col>
      <el-col :span="12" class="tools-group">
        <el-tooltip
          v-for="item in tools.items"
          :key="item.icon_id"
          :content="item.name"
        >
          <el-button
            type="text"
            :class="['iconfont','icon-'+item.font_class,'tool_item']"
            @click="callToolsAction(item.action,item.params)"
          />
        </el-tooltip>
      </el-col>
    </div>
     <!-- 左侧节点-->
    <div class="toolbarContainer">
      
      <el-collapse v-model="activeNames">
        <el-collapse-item name="1" title="基础节点" class="general-toolbar">
          <span
            v-for="item in generalToolbarItems"
            :style="item['style']"
            :class="item['class']"
            :key="item['index']"
            ref="generalToolItems"
          >
            <span class="generalTooltitle">{{ item["text"] }}</span>
          </span>
        </el-collapse-item>
        <el-collapse-item name="2" title="电力图标" class="general-toolbar" >
          <div style="width: 100%;height: 200px;">
            <svg-icon  icon-class="1-002" size="40"></svg-icon>

          </div>
        </el-collapse-item>

      </el-collapse>
    </div>
    
    <!-- 中心画布 -->
    <div
      class="graphContainer"
      id="graphContainer"
      ref="container"
      :class="{ 'graphContainer-background': showBackground }"
    ></div>
    <!-- 右侧栏 -->
    <div class="right-bar">
      <div class="json-viewer">
        <h4 style="text-align: center">Json数据结构</h4>
        <json-viewer
          :value="jsonData"
          style="height: 80%"
          copyable
          sort
        ></json-viewer>
      </div>
    </div>
  </div>
</template>
<script>
import tools from "./toolbar/tools.js";
import toolsMethods from "./toolbar/methods"
// 导入自定义图标数组

import { generalToolbarItems } from "./general-shape";
import * as R from "ramda";
import mx from "mxgraph";
import _ from "lodash";
const mxgraph = mx({});
const {
  // mxStencilRegistry,
  // mxStencil,
  mxEvent,
  mxGraph,
  mxEditor,
  mxUtils,
  mxRubberband,
  mxKeyHandler,
  mxGraphHandler,
  mxConstants,
  mxImage,
  mxCellState,
  mxConnectionHandler,
  // mxCodec,
  mxRectangleShape,
  mxPoint,
  mxClipboard,
  mxCellTracker,
  mxUndoManager,
  mxClient,
  mxEdgeHandler,
  mxPerimeter,
  // mxOutline,
  mxEventObject,
  mxGeometry,
  mxCell,
  mxShape,
  mxConstraintHandler,
  mxEllipse,
  // mxTriangle,
  mxFastOrganicLayout,
  mxHierarchicalLayout,
  mxCompactTreeLayout,
  mxMorphing,
  mxCircleLayout,
  mxSvgCanvas2D,
  mxImageExport,
  mxConnectionConstraint,
  mxPolyline,
  mxVertexHandler,
  mxRectangle,
  mxImageShape,
  // ActiveXObject,
} = mxgraph;
// 配置自定义事件
Object.assign(mxEvent, {
  NORMAL_TYPE_CLICKED: "NORMAL_TYPE_CLICKED",
});
export default {
  computed: {
    // 组元素
    generalToolbarItems: () => generalToolbarItems,
  },
  mixins:[toolsMethods],
  components: {},
  data() {
    return {
      tools,
      graph: null,
      editor: null,
      palettes: {},
      graphXml: "",
      activeNames: ["1", "2", "3"],
      isNode: false,
      cellStyle: "",
      graphX: 100,
      graphY: 10,
      undoMng: "",
      textValue: "",
      uploadDataVisible: false,
      isOutputXml: false,
      edgeStyle: "orthogonalEdgeStyle",
      outline: "",
      idSeed: 0,
      normalIdSeed: 0,
      // configOrder: 0,
      jsonData: {
        cells: {
          nodes: [],
          groups: [],
        },
        edges: [],
      },
      showBackground: true,
      currentNormalType: {},
      normalTypePosition: {
        top: "0",
        left: "0",
      },
    };
  },
  methods: {
    // 创建画布并进行初始化
    createGraph() {
      // 创建graph
      // 方式一：直接构建graph实例
      // this.graph = new mxGraph(this.$refs.container)
      this.editor = new mxEditor();
      this.graph = this.editor.graph;
      this.editor.setGraphContainer(this.$refs.container);
      // 配置默认全局样式
      this.configureStylesheet(this.graph);
      // 去锯齿效果
      mxRectangleShape.prototype.crisp = true;
      // 定义全局变量，如。用于触发建立新的连接的活动区域的最小尺寸（以像素为单位），该部分（100％）的小区区域被用于触发新的连接，以及一些窗口和“下拉菜菜单选择
      mxConstants.MIN_HOTSPOT_SIZE = 16;
      // mxConstants.DEFAULT_HOTSPOT = 1; ..
      //cell创建支持传入html
      this.graph.setHtmlLabels(true);
      this.graph.setDropEnabled(true);
      this.graph.setSplitEnabled(false);
      // 有效的拖放操作，则返回true
      this.graph.isValidDropTarget = (target, cells, evt) => {
        if (
          this.graph.isSplitEnabled() &&
          this.graph.isSplitTarget(target, cells, evt)
        ) {
          console.log("拖放");
          return true;
        }
      };

      // 禁用分组的收缩功能 方法1:
      // this.graph.isCellFoldable = (cell) => {
      //   return false
      // }
      // 禁用分组的收缩功能 方法2:
      this.graph.foldingEnabled = false;
      // 组内的子元素是否随父元素变化而变化
      this.graph.recursiveResize = true;

      // 设置连线时的预览路径及样式
      this.graph.connectionHandler.createEdgeState = () => {
        // 设置预览的连接线,第三个参数为连接成功后连接线上的label
        var edge = this.graph.createEdge(null, null, null, null, null);
        // edge.style += `;edgeStyle=orthogonalEdgeStyle `
        return new mxCellState(
          this.graph.view,
          edge,
          this.graph.getCellStyle(edge)
        );
      };

      // 是否开启旋转
      mxVertexHandler.prototype.livePreview = true;
      mxVertexHandler.prototype.rotationEnabled = true;
      // 设置旋转按钮
      mxVertexHandler.prototype.createSizerShape = function (
        bounds,
        index,
        fillColor
      ) {
        if (this.handleImage != null) {
          bounds = new mxRectangle(
            bounds.x,
            bounds.y,
            this.handleImage.width,
            this.handleImage.height
          );
          let shape = new mxImageShape(bounds, this.handleImage.src);
          // Allows HTML rendering of the images
          shape.preserveImageAspect = true;
          return shape;
        } else if (index == mxEvent.ROTATION_HANDLE) {
          // return new mxDoubleEllipse(bounds, fillColor || mxConstants.HANDLE_FILLCOLOR, mxConstants.HANDLE_STROKECOLOR);
          // 设置旋转图标
          bounds = new mxRectangle(bounds.x, bounds.y, 15, 15);
          let rotationShape = new mxImageShape(bounds, "icon/rotate.svg");
          rotationShape.preserveImageAspect = true;
          return rotationShape;
        } else {
          return new mxRectangleShape(
            bounds,
            fillColor || mxConstants.HANDLE_FILLCOLOR,
            mxConstants.HANDLE_STROKECOLOR
          );
        }
      };
      // 设置旋转角度（解决默认旋转180度的bug）
      mxVertexHandler.prototype.getRotationHandlePosition = function () {
        let padding = this.getHandlePadding();
        return new mxPoint(
          this.bounds.x +
            this.bounds.width -
            this.rotationHandleVSpacing +
            padding.x / 2,
          this.bounds.y + this.rotationHandleVSpacing - padding.y / 2
        );
      };
      // 设置默认组
      // groupBorderSize 设置图形和它的子元素的边距
      let group = new mxCell(
        "Group",
        new mxGeometry(),
        "group;fontColor=white;"
      );
      group.setVertex(true);
      // 设置组可连接
      group.setConnectable(true);
      // group.setCellsResizable(false);
      this.editor.defaultGroup = group;
      this.editor.groupBorderSize = 80;

      // 是否根元素
      this.graph.isValidRoot = function (cell) {
        return this.isValidDropTarget(cell);
      };

      // // 是否可以被选中
      // this.graph.isCellSelectable = function (cell) {
      //   return !this.isCellLocked(cell);
      // };

      // 返回元素
      this.graph.getLabel = function (cell) {
        var tmp = mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
        if (this.isCellLocked(cell)) {
          // 如元素被锁定 返回空标签
          return "";
        } else if (this.isCellCollapsed(cell)) {
          var index = tmp.indexOf("</h1>");
          if (index > 0) {
            tmp = tmp.substring(0, index + 5);
          }
        }
        return tmp;
      };

      // 目标是否有效
      this.graph.isValidDropTarget = function (cell) {
        // console.log(cell, cells, evt);
        return this.isSwimlane(cell);
      };

      // 是否根元素
      this.graph.isValidRoot = function (cell) {
        return this.isValidDropTarget(cell);
      };

      // 是否可以被选中
      this.graph.isCellSelectable(true);

      // 允许重复连接
      this.graph.setMultigraph(true);
      // 禁止连接线晃动(即连线两端必须在节点上)
      this.graph.setAllowDanglingEdges(false);
      // 允许连线的目标和源是同一元素
      this.graph.setAllowLoops(false);
      //边被拖动时始终保持连接
      this.graph.setDisconnectOnMove(false);
      // 选择基本元素开启
      this.graph.setEnabled(true);
      // 动态改变样式
      this.graph.getView().updateStyle = true;
      // 鼠标框选
      this.rubberBand = new mxRubberband(this.graph);
      this.graph.setResizeContainer(true);

      // 开启画布平滑移动
      // this.graph.setPanning(true);
      this.graph.setPanning = true;
      // 开启提示
      this.graph.setTooltips(false);
      // 允许连线
      this.graph.setConnectable(true);
      //移动元素的步长
      this.graph.gridSize = 3;
      this.graph.setBorder(160);

      // 开启方块上的文字编辑功能
      this.graph.setCellsEditable(true);
      // 禁止双击修改内容(弃用)
      // this.graph.dblClick = (evt, cell) => {
      //   var model = this.graph.getModel();
      //   if (model.isVertex(cell)) {
      //     return false;
      //   }
      // };
      // Disables synchronous loading of resources
      // 可用于禁用HTML的泳道标签，避免冲突(返回false即可)
      // 判断是否为泳道标签
      // this.graph.isHtmlLabel = function (cell) {
      //   return this.isSwimlane(cell);
      // };
      //准备撤销还原功能
      // 构造具有给定历史记录大小的新撤消管理器。默认100步
      this.undoMng = new mxUndoManager();
      let listener = (sender, evt) => {
        this.undoMng.undoableEditHappened(evt.getProperty("edit"));
      };
      this.graph.getModel().addListener(mxEvent.UNDO, listener);
      this.graph.getView().addListener(mxEvent.UNDO, listener);
      if (this.graph == null || this.graph == undefined) {
        return;
      }
      // 从value中获取显示的内容(如果节点的value为空则显示节点的title)
      this.graph.convertValueToString = (cell) => {
        return cell["value"] ? cell["value"] : cell["title"];
      };
    },
    // 布局
    graphLayout(self, layoutType) {
      
      self.graph.getModel().beginUpdate();
      try {
        if (layoutType === "randomLayout") {
          // 随机布局
          console.log('mxFastOrganicLayout',mxFastOrganicLayout );
          // mxFastOrganicLayout.prototype.minDistanceLimit = 100;
          // // eslint-disable-next-line new-cap
          // var layout = new mxFastOrganicLayout(self.graph);
          // layout.forceConstant = 500;
          // layout.execute(self.graph.getDefaultParent());
        } else if (layoutType === "hierarchicalLayout") {
          // 分层布局
          mxHierarchicalLayout.prototype.intraCellSpacing = 300;
          mxHierarchicalLayout.prototype.fineTuning = false;
          mxHierarchicalLayout.prototype.traverseAncestors = false;
          mxHierarchicalLayout.prototype.resizeParent = true;
          // 无关系实体之间的间距
          mxHierarchicalLayout.prototype.interHierarchySpacing = 200;
          // 层级之间的距离
          mxHierarchicalLayout.prototype.interRankCellSpacing = 800;

          // eslint-disable-next-line new-cap
          var hierarchicallayout = new mxHierarchicalLayout(
            self.graph,
            mxConstants.DIRECTION_NORTH
          );
          hierarchicallayout.execute(self.graph.getDefaultParent());
        } else if (layoutType === "compactTreeLayout") {
          // 树形布局
          // eslint-disable-next-line new-cap
          var compactTreelayout = new mxCompactTreeLayout(self.graph);
          compactTreelayout.execute(self.graph.getDefaultParent());
        } else if (layoutType === "circleLayout") {
          // 圆形布局
          // eslint-disable-next-line new-cap
          var circleLayout = new mxCircleLayout(self.graph, 400);
          circleLayout.execute(self.graph.getDefaultParent());
        }
      } finally {
        // 是否开启布局动画
        // if (animate) {
          // eslint-disable-next-line new-cap
          var morph = new mxMorphing(self.graph, 20, 7.7, 40);
          morph.addListener(mxEvent.DONE, () => {
            self.graph.getModel().endUpdate();
          });
          morph.startAnimation();
        // } else {
        //   self.graph.getModel().endUpdate();
        // }
      }
    },
    // 初始化基础节点
    initGeneralTool() {
      var generalToolbarDomArray = this.$refs.generalToolItems;
      // 判断是否为数组且数组是否为空
      if (
        !(
          generalToolbarDomArray instanceof Array ||
          generalToolbarDomArray.length <= 0
        )
      ) {
        return;
      }
      generalToolbarDomArray.forEach((dom, domIndex) => {
        var toolItem = this.generalToolbarItems[domIndex];
        var { width, height } = toolItem;
        var itemClass = toolItem.class;
        //新增基础节点
        var generalDropHandler = (graph, evt, dropCell, x, y) => {
          const drop = !R.isNil(dropCell);
          // drop && this.$message.info(`${toolItem['title']}节点进入${dropCell.title}`);
          const realX = drop ? x - dropCell.geometry.x : x;
          const realY = drop ? y - dropCell.geometry.y : y;
          const { width, height } = toolItem;
          const styleObj = toolItem.style;
          const style = Object.keys(styleObj)
            .map((attr) => `${attr}=${styleObj[attr]}`)
            .join(";");
          const parent = drop ? dropCell : this.graph.getDefaultParent();
          this.graph.getModel().beginUpdate();
          try {
            let vertex = this.graph.insertVertex(
              parent,
              null,
              null,
              realX - width / 2,
              realY - height / 2,
              width,
              height,
              style + ";whiteSpace=wrap;word-break=break-all"
            );
            vertex.title =
              `<div style='word-break:break-all'>` +
              toolItem["title"] +
              "</div>";
            vertex.dropAble = toolItem["dropAble"];
            vertex.id = toolItem["id"] + "-" + toolItem["idSeed"];
            toolItem["idSeed"]++;
            vertex["isGroup"] = toolItem["id"].includes("group") ? true : false;
          } finally {
            this.graph.getModel().endUpdate();
          }
        };
        // 设置节点被拖拽时的样式(预览)
        var generalcreateDragPreview = () => {
          var elt = document.createElement("div");
          elt.style.width = `${width}px`;
          elt.style.height = `${height}px`;
          elt.style.transform = "translate(-50%,-50%)";
          elt.className = itemClass;
          return elt;
        };
        // 允许拖拽
        let ds = mxUtils.makeDraggable(
          dom,
          this.graph,
          generalDropHandler,
          generalcreateDragPreview(),
          0,
          0,
          true,
          true
        );
        ds.setGuidesEnabled(true);
      });
    },
    // 基础配置函数
    eventCenter() {
      // 给graph添加事件
      // 监听自定义事件
      this.graph.addListener(mxEvent.NORMAL_TYPE_CLICKED, (sender, evt) => {
        let cell = evt.properties.cell.state.cell;
        this.currentNormalType = cell;
      });
      // this.graph.addListener(mxEvent.VERTEX_START_MOVE, (sender, evt) => {
      //   console.log('VERTEX_START_MOVE', sender, evt);
      // });
      // 画布平移事件
      this.graph.addListener(mxEvent.PAN, (sender, evt) => {
        console.log("画布平移了", sender, evt);
      });
      // 新增节点事件
      this.graph.addListener(mxEvent.ADD_CELLS, (sender, evt) => {
        this.$nextTick(() => {
          let addCell = evt.properties.cells[0];
          if (addCell.vertex) {
            // 判断是否为组节点
            if (addCell.isGroup) {
              // this.$message.info("添加了一个组");
              let groupObj = _.pick(addCell, [
                "id",
                "title",
                "parent",
                "geometry",
              ]);
              this.jsonData["cells"]["groups"].push(groupObj);
            } else {
              let nodeObj = _.pick(addCell, [
                "id",
                "title",
                "parent",
                "geometry",
              ]);
              this.jsonData["cells"]["nodes"].push(nodeObj);
              // this.$message.info("添加了一个节点");
            }
            //  向jsonData中更新数据
          } else if (addCell.edge) {
            console.log(addCell);
            let lineObj = _.pick(addCell, [
              "id",
              "edge",
              "source",
              "parent",
              "geometry",
              "value",
            ]);
            this.jsonData["edges"].push(lineObj);
            this.$message.info("添加了一条线");
          }
        });
      });

      //拖动节点的事件
      this.graph.addListener(mxEvent.CELLS_MOVED, (sender, evt) => {
        // console.log(this.graph, 'graph');
        let cellsName = [];
        this.$nextTick(() => {
          evt.properties.cells.forEach((item) => {
            item.parent.id.includes("group") && cellsName.push(item.title);
          });
          // evt.properties.cells[0].parent.id !== "1" &&
          //   this.$message.info(
          //     `${[...cellsName]}节点进入${evt.properties.cells[0].parent.title}`
          //   );
        });
      });
      // 删除节点触发事件
      this.graph.addListener(mxEvent.CELLS_REMOVED, (sender, evt) => {
        this.$nextTick(() => {
          let removeCells = evt.properties.cells;
          console.log(removeCells, "removeCells");
          removeCells.forEach((item) => {
            // 拿每一个cellId在jsonData中进行遍历,并进行移除
            if (item.vertex) {
              // 判断是否为组节点
              if (item.isGroup) {
                this.$message.info(`移除了${item.id}组`);
                this.jsonData["cells"]["groups"].splice(
                  this.jsonData["cells"]["groups"].findIndex((jsonItem) => {
                    return jsonItem.id === item.id;
                  }),
                  1
                );
              } else {
                this.$message.info(`移除${item.id}节点`);
                this.jsonData["cells"]["nodes"].splice(
                  this.jsonData["cells"]["nodes"].findIndex((jsonItem) => {
                    return jsonItem.id === item.id;
                  }),
                  1
                );
              }
            } else if (item.edge) {
              this.$message.info("移除了线");
              this.jsonData["edges"].splice(
                this.jsonData["edges"].findIndex((jsonItem) => {
                  return jsonItem.id === item.id;
                }),
                1
              );
            }
            // this.jsonData.forEach(item)
          });
        });
      });
    },
    // 配置鼠标事件
    configMouseEvent() {
      this.graph.addMouseListener({
        currentState: null,
        previousStyle: null,

        mouseDown: (sender, evt) => {
          if (!evt.state) {
            console.log("点击了画布");
            return;
          } else if (evt.state.cell.edge) {
            console.log("点击了连线");
            return;
          }

          const cell = evt.state.cell;
          let clickNormalType = false;
          if (cell.style !== undefined) {
            clickNormalType = cell.style.includes("normalType");
          }
          if (clickNormalType) {
            // 使用 mxGraph 事件中心，注册自定义事件
            this.graph.fireEvent(
              new mxEventObject(mxEvent.NORMAL_TYPE_CLICKED, "cell", evt)
            );
          } else {
            return;
          }
        },

        mouseMove: (sender, me) => {
          // console.log('mouseMove')
          this.graphX = Math.ceil(me.graphX);
          this.graphY = Math.ceil(me.graphY);
        },

        mouseUp: (sender, evt) => {
          console.log("mouseUp");
          if (evt.sourceState === undefined) {
            return false;
          } else {
            var cell = evt.sourceState.cell;
            // console.log(cell);
            //  var cell = this.graph.getSelectionCell();
            if (cell) {
              this.textValue = cell["value"] ? cell["value"] : cell["title"];
              console.log(this.textValue, "cellValue");
              console.log("cellValuie", cell);
              cell.vertex ? (this.isNode = true) : (this.isNode = false);
              var getcellStyle = cell.getStyle() ? cell.getStyle() : null;
              if (!this.isNode) {
                // 点击的不是节点
                getcellStyle
                  ? (this.edgeStyle = getcellStyle)
                  : "orthogonalEdgeStyle";
              } else {
                // 点击的是节点
                // console.log('getcellStyle', getcellStyle);
                if (getcellStyle) {
                  var arr = getcellStyle.split(";");
                  // arr.pop()
                  var styleObject = {};
                  arr.forEach((item) => {
                    styleObject[item.split("=")[0]] = item.split("=")[1];
                  });
                  this.cellStyle = styleObject;
                }
              }
            } else {
              this.$message.error("请选择节点或者连线");
            }
          }
        },
      });
    },
    //配置键盘事件
    configKeyEvent() {
      // 启动盘事件键
      this.keyHandler = new mxKeyHandler(this.graph);
      // 键盘按下删除键绑定事件
      this.keyHandler.bindKey(46, () => {
        this.deleteNode();
      });
      this.keyHandler.bindControlKey(65, () => {
        this.graph.selectAll();
      });
      this.keyHandler.bindControlKey(67, () => {
        this.copy();
      });
      this.keyHandler.bindControlKey(88, () => {
        this.cut();
      });
      this.keyHandler.bindControlKey(86, () => {
        this.paste();
      });
      this.keyHandler.bindControlKey(89, () => {
        this.goForward();
      });
      this.keyHandler.bindControlKey(90, () => {
        this.goBack();
      });
    },
    //配置右键菜单栏
    configMenu() {
      // 禁用浏览器默认的右键菜单栏
      mxEvent.disableContextMenu(this.$refs.container);
      this.graph.popupMenuHandler.factoryMethod = (menu) => {
        menu.addItem("输出所有节点", null, () => {
          Object.values(this.graph.getModel().cells).forEach((cell) => {
            console.log(cell);
          });
        });

        menu.addSeparator();
        menu.addItem("复制", null, () => {
          this.copy();
        });

        menu.addItem("粘贴", null, () => {
          this.paste();
        });

        menu.addSeparator();
        menu.addItem("组合", null, () => {
          this.enGroup();
        });

        menu.addItem("分解", null, () => {
          this.graph.ungroupCells(this.graph.getSelectionCells());
        });
        menu.addSeparator();
        menu.addItem("流动的线(测试)", null, () => {
          let cell = this.graph.getSelectionCell();
          if (cell && cell.edge) {
            let state = this.graph.view.getState(cell);
            state.shape.node
              .getElementsByTagName("path")[0]
              .removeAttribute("visibility");
            state.shape.node
              .getElementsByTagName("path")[0]
              .setAttribute("stroke-width", "6");
            state.shape.node
              .getElementsByTagName("path")[0]
              .setAttribute("stroke", "lightGray");
            state.shape.node
              .getElementsByTagName("path")[1]
              .setAttribute("class", "flow");
          } else {
            this.$message.error("请选择连线");
          }
        });
        menu.addSeparator();
        // menu.addItem('配置完成', null, () => {
        //   let cell = this.graph.getSelectionCell().children[0];
        //   let cellArrayStyle = cell.getStyle().split(';');
        //   cellArrayStyle.shift();
        //   let cellStyle = {};
        //   cellArrayStyle.forEach(item => {
        //     cellStyle[item.split('=')[0]] = item.split('=')[1];
        //   });
        //   let cellImage = cellStyle['image'].replace('unselect', 'selected');
        //   this.graph.setCellStyles(mxConstants.STYLE_IMAGE, cellImage, [cell]);
        //   this.graph.refresh(cell);
        // });
        menu.addItem("全选", null, () => {
          this.graph.selectAll();
        });
        menu.addItem("选中所有节点", null, () => {
          this.graph.selectCells(true, false);
        });
        menu.addItem("选中所有连线", null, () => {
          this.graph.selectCells(false, true);
        });
        // 分割符号
        menu.addSeparator();
        menu.addItem("修改样式", null, () => {
          var cell = this.graph.getSelectionCell();
          if (cell) {
            cell.vertex ? (this.isNode = true) : (this.isNode = false);
            var getcellStyle = cell.getStyle() ? cell.getStyle() : "";
            if (getcellStyle) {
              var arr = getcellStyle.split(";");
              //弹出最后一个空样式
              // arr.pop()
              var styleObject = {};
              arr.forEach((item) => {
                styleObject[item.split("=")[0]] = item.split("=")[1];
              });
              this.cellStyle = styleObject;
              // if (this.isNode) {

              // }
            }
          } else {
            this.$message.error("请选择节点或者连线");
          }
        });
      };
    },
    //  配置全局样式
    configureStylesheet(graph) {
      // 设置节点的文字可被移动
      graph.vertexLabelsMovable = false;
      // 设置鼠标悬浮至节点或者连线时高亮显示的颜色
      new mxCellTracker(graph, "#409eff");
      var style = new Object();
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_LABEL;
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
      style[mxConstants.STYLE_IMAGE_ALIGN] = mxConstants.ALIGN_CENTER;
      style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = mxConstants.ALIGN_CENTER;
      // style[mxConstants.STYLE_SPACING_TOP] = 6;
      style[mxConstants.STYLE_SPACING_LEFT] = 5;
      // style[mxConstants.STYLE_GRADIENTCOLOR] = 'skyblue'; // 渐变颜色
      style[mxConstants.STYLE_STROKECOLOR] = "#5d65df"; // 线条颜色
      style[mxConstants.STYLE_FILLCOLOR] = "#FFFFFF";
      style[mxConstants.STYLE_FONTCOLOR] = "#1d258f"; // 字体颜色
      style[mxConstants.STYLE_FONTFAMILY] = "Verdana"; // 字体风格
      style[mxConstants.STYLE_FONTSIZE] = "12"; // 字体大小
      style[mxConstants.STYLE_FONTSTYLE] = "0"; // 斜体字
      style[mxConstants.WORD_WRAP] = "normal"; // 文字换行    word-break: break-all;
      style[mxConstants["word-break"]] = "break-all"; // 文字换行
      style[mxConstants.STYLE_WHITE_SPACE] = "wrap"; // 文字换行
      style[mxConstants.STYLE_ROUNDED] = false; // 圆角
      style[mxConstants.STYLE_IMAGE_WIDTH] = "28"; // 图片宽度
      style[mxConstants.STYLE_IMAGE_HEIGHT] = "28"; // 图片高度
      style[mxConstants.STYLE_OPACITY] = "100"; // 节点透明度(不包含字体)
      graph.getStylesheet().putDefaultVertexStyle(style);

      style = new Object();
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
      style[mxConstants.STYLE_FILLCOLOR] = "#409eff";
      // style[mxConstants.STYLE_GRADIENTCOLOR] = '#409eff';
      style[mxConstants.STYLE_STROKECOLOR] = "#409eff";
      style[mxConstants.STYLE_FONTCOLOR] = "#000000";
      style[mxConstants.STYLE_ROUNDED] = false;
      style[mxConstants.STYLE_OPACITY] = "80";
      style[mxConstants.STYLE_STARTSIZE] = "30";
      style[mxConstants.STYLE_FONTSIZE] = "16";
      style[mxConstants.STYLE_FONTSTYLE] = 1;
      graph.getStylesheet().putCellStyle("group", style);

      style = new Object();
      style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
      style[mxConstants.STYLE_FONTCOLOR] = "#774400";
      style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
      style[mxConstants.STYLE_PERIMETER_SPACING] = "6";
      style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
      style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
      style[mxConstants.STYLE_FONTSIZE] = "10";
      style[mxConstants.STYLE_FONTSTYLE] = 2;
      style[mxConstants.STYLE_IMAGE_WIDTH] = "16";
      style[mxConstants.STYLE_IMAGE_HEIGHT] = "16";
      style[mxConstants.STYLE_BACKGROUNDCOLOR] = "transparent";
      graph.getStylesheet().putCellStyle("port", style);

      style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = "#FFFFFF";
      style[mxConstants.STYLE_STROKEWIDTH] = "2";
      style[mxConstants.STYLE_ROUNDED] = true;
      // 获取全局Edge、label样式
      var edgeStyle = this.graph.getStylesheet().getDefaultEdgeStyle();
      let labelStyle = this.graph.getStylesheet().getDefaultVertexStyle();
      // labelStyle[mxConstants.STYLE_WHITE_SPACE] = 'wrap'; //自动换行
      console.log(labelStyle, "labelStyle");
      // 设置连线风格(设置为正交折线)
      edgeStyle["edgeStyle"] = "orthogonalEdgeStyle";

      // 选中 cell/edge 后的伸缩大小的点/拖动连线位置的点的颜色
      // style[mxConstants.STYLE_WHITE_SPACE] = 'wrap'

      mxConstants.HANDLE_FILLCOLOR = "#409eff";
      mxConstants.HANDLE_STROKECOLOR = "transparent";
      mxConstants.STYLE_ANCHOR_POINT_DIRECTION = "anchorPointDirection";
      mxConstants.STYLE_STYLE_ROTATION = "rotation";
      // 是否缩放网格
      mxGraphHandler.prototype.scaleGrid = true;
      mxGraph.prototype.pageBreakDashed = false;

      // 指定是否应使用其他单元格对齐当前所选内容的右侧，中间或左侧。默认为false。
      mxGraphHandler.prototype.guidesEnabled = true;
      mxGraphHandler.prototype.htmlPreview = false;
      mxGraphHandler.prototype.allowLivePreview = true;
      // 指定预览形状的颜色。默认为黑色。
      mxGraphHandler.prototype.previewColor = "red";
      // 应该使用实时预览的最大单元数。默认值为0，表示没有实时预览。
      mxGraphHandler.prototype.maxLivePreview = 100;

      // Alt 按下禁用导航线
      mxGraphHandler.prototype.useGuidesForEvent = function (me) {
        return !mxEvent.isAltDown(me.getEvent());
      };
      // 导航线颜色
      mxConstants.GUIDE_COLOR = "#1a73e8";
      // 导航线宽度
      mxConstants.GUIDE_STROKEWIDTH = 2;
      // 导航线自动连接到目标
      mxEdgeHandler.prototype.snapToTerminals = true;
      // 选中线条时的虚线颜色
      mxConstants.EDGE_SELECTION_COLOR = "#99ccff";
      // mxConstants.DEFAULT_INVALID_COLOR = 'yellow';
      // mxConstants.INVALID_CONNECT_TARGET_COLOR = 'yellow';
      // 连线(未满足连线要求)时预览的颜色
      mxConstants.INVALID_COLOR = "#99ccff";
      // 连线(满足连线要求)时预览的颜色
      mxConstants.VALID_COLOR = "blue";
      // mxConstants.GUIDE_COLOR = 'yellow';
      // mxConstants.LOCKED_HANDLE_FILLCOLOR = '#24bcab';
      // 选中节点时选中框的颜色
      mxConstants.VERTEX_SELECTION_COLOR = "#99ccff";

      //折叠-/展开+图标大小
      // mxGraph.prototype.collapsedImage = new mxImage('images/collapsed.gif', 15, 15);
      // mxGraph.prototype.expandedImage = new mxImage('images/expanded.gif', 15, 15);

      // 配置节点中心的连接图标(注釋掉即可指定錨點連接到另一個節點的錨點上)
      mxConnectionHandler.prototype.connectImage = new mxImage(
        "./icon/connectionpoint.png",
        14,
        14
      );
      // 显示中心端口图标
      graph.connectionHandler.targetConnectImage = false;
      // 是否开启浮动自动连接
      this.graph.connectionHandler.isConnectableCell = function () {
        return true;
      };
      // 设定锚点的位置、可编辑状态和图标
      mxConstraintHandler.prototype.pointImage = new mxImage(
        "icon/dot.svg",
        10,
        10
      );
      // 设置锚点上的高亮颜色
      mxConstraintHandler.prototype.createHighlightShape = function () {
        return new mxEllipse(null, "#409eff99", "#409eff99", 15);
      };

      mxShape.prototype.constraints = [
        new mxConnectionConstraint(new mxPoint(0, 0), true),
        new mxConnectionConstraint(new mxPoint(0.25, 0), true),
        new mxConnectionConstraint(new mxPoint(0.5, 0), true),
        new mxConnectionConstraint(new mxPoint(0.75, 0), true),
        new mxConnectionConstraint(new mxPoint(0, 0.25), true),
        new mxConnectionConstraint(new mxPoint(0, 0.5), true),
        new mxConnectionConstraint(new mxPoint(0, 0.75), true),
        new mxConnectionConstraint(new mxPoint(1, 0), true),
        new mxConnectionConstraint(new mxPoint(1, 0.25), true),
        new mxConnectionConstraint(new mxPoint(1, 0.5), true),
        new mxConnectionConstraint(new mxPoint(1, 0.75), true),
        new mxConnectionConstraint(new mxPoint(0, 1), true),
        new mxConnectionConstraint(new mxPoint(0.25, 1), true),
        new mxConnectionConstraint(new mxPoint(0.5, 1), true),
        new mxConnectionConstraint(new mxPoint(0.75, 1), true),
        new mxConnectionConstraint(new mxPoint(1, 1), true),
      ];
      mxPolyline.prototype.constraints = null;
    },

    
    //复制
    copy() {
      let selectionCells = this.graph.getSelectionCells();
      mxClipboard.copy(this.graph, selectionCells);
    },
    //粘贴
    paste() {
      mxClipboard.paste(this.graph);
    },
    //剪切
    cut() {
      var cells = [];
      cells = this.graph.getSelectionCells();
      mxClipboard.cut(this.graph, cells);
    },
   
   
    exportModelSvg() {
        let scale = this.graph.view.scale;
        let bounds = this.graph.getGraphBounds();
        let border = 10;
        // Prepares SVG document that holds the output
        let svgDoc = mxUtils.createXmlDocument();
        let root =
          svgDoc.createElementNS != null
            ? svgDoc.createElementNS(mxConstants.NS_SVG, "svg")
            : svgDoc.createElement("svg");
  
        if (root.style != null) {
          root.style.backgroundColor = "#FFFFFF";
        } else {
          root.setAttribute("style", "background-color:#FFFFFF");
        }
  
        if (svgDoc.createElementNS == null) {
          root.setAttribute("xmlns", mxConstants.NS_SVG);
        }
        let width = Math.ceil((bounds.width * scale) / scale + 2 * border);
        let height = Math.ceil((bounds.height * scale) / scale + 2 * border);
        root.setAttribute("class", "svg-container");
        root.setAttribute("width", width + "px");
        root.setAttribute("height", height + "px");
        root.setAttribute("viewBox", "0 0 " + width + " " + height);
        root.setAttribute("xmlns:xlink", mxConstants.NS_XLINK);
        root.setAttribute("version", "1.1");
  
        // Adds group for anti-aliasing via transform
        let group =
          svgDoc.createElementNS != null
            ? svgDoc.createElementNS(mxConstants.NS_SVG, "g")
            : svgDoc.createElement("g");
        group.setAttribute("transform", "translate(0.5,0.5)");
        root.appendChild(group);
        svgDoc.appendChild(root);
  
        // Renders graph. Offset will be multiplied with state's scale when painting state.
        let svgCanvas = new mxSvgCanvas2D(group);
        svgCanvas.translate(
          Math.floor(border / scale - bounds.x),
          Math.floor(border / scale - bounds.y)
        );
        svgCanvas.scale(scale);
  
        let imgExport = new mxImageExport();
        imgExport.drawState(
          this.graph.getView().getState(this.graph.model.root),
          svgCanvas
        );
  
        //let xml = encodeURIComponent(mxUtils.getXml(root)); //no need
        let xml = mxUtils.getXml(root);
        return xml;
      },
   
    handleScroll(e) {
      if (e.wheelDelta === 120) {
        this.graph.zoomIn();
      } else {
        this.graph.zoomOut();
      }
    },
  },
  mounted() {
    // 检测浏览器兼容性
    if (!mxClient.isBrowserSupported()) {
      this.$message.error(
        "当前浏览器不支持拓扑图功能，请更换浏览器访问，建议使用Chrome浏览器访问!"
      );
    } else {
      // Overridden to define per-shape connection points
      mxGraph.prototype.getAllConnectionConstraints = function (terminal) {
        if (terminal != null && terminal.shape != null) {
          if (terminal.shape.stencil != null) {
            if (terminal.shape.stencil.constraints != null) {
              return terminal.shape.stencil.constraints;
            }
          } else if (terminal.shape.constraints != null) {
            return terminal.shape.constraints;
          }
        }
        return null;
      };
      this.createGraph();
      this.eventCenter();
      this.configMouseEvent();
      this.configMenu();
      this.$nextTick(() => {
        this.initGeneralTool();
        this.configKeyEvent();
      });
    }
    document
      .getElementById("graphContainer")
      .addEventListener("mousewheel", this.handleScroll, true); // 监听（绑定）滚轮滚动事件
  },
  destroyed() {
    document
      .getElementById("graphContainer")
      .removeEventListener("mousewheel", this.handleScroll); //  离开页面清除（移除）滚轮滚动事件
    this.graph.destroy();
  },
};
</script>
<style lang="less">
.tool_item {
  font-size: 20px;
  font-weight: 600
}
@import "./general-shap.css";
.customToolbarContainer {
  width: 100%;
  height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;

  .toolbarContainer {
    padding-top: 50px;
    font-size: 20px;
    background: #efefef;
    text-align: center;
    background-color: #fff;
    border-right: 1px solid #ededed;
    width: 10%;
    position: relative;
    box-sizing: border-box;
    overflow-y: scroll;
    .general-toolbar {
      .el-collapse-item__wrap .el-collapse-item__content {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-content: space-around;
        .common {
          width: 30%;
          cursor: pointer;
          // padding: 10px;
          height: 50px;
          white-space: wrap;
          text-align: center;
          position: relative;
          .generalTooltitle {
            position: absolute;
            bottom: -10px;
            left: 0;
            width: 100%;
            // transform: translateX(-50%);
          }
        }
      }
    }
    .custom-toolbar {
      .custom-node {
        display: inline-block;
        margin: 10px 0 0 0;
        width: 28%;
        height: 60px;
        border: 1px solid #000000;
        padding: 5px 0;
        img {
          // width: 34px;
          height: 34px;
        }
      }
      .rectangle-node {
        width: 45%;
        height: 40px;
        margin: 10px 0 0 0;
        background-color: #ffff;
        position: relative;
        border: 1px solid #000000;
        padding: none;
        img {
          position: absolute;
          left: 0;
          // width: none;
          height: 35px;
          top: 50%;
          transform: translateY(-50%);
        }
        .node-title {
          position: absolute;
          left: 60%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      }
      .el-collapse-item__content {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-content: space-around;
        span {
          cursor: pointer;
        }
      }
    }
  }
  .toolbarContainer::-webkit-scrollbar {
    display: none;
  }
  .graphContainer {
    margin-top: 50px;
    height: 100% !important;
    line-height: 100%;
    position: relative;
    overflow: hidden;
    background-color: #fff !important;
    flex: 1;
  }
  .graphContainer-background {
    background-image: url("../assets/grid.gif");
  }
  .top-tools {
    position: absolute;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    top: 0;
    left: 0;
    padding: 0 20px 0 0px;
    width: 100%;
    z-index: 1000;
    background-color: #fff;
    height: 50px;
    // border-bottom: 1px solid #ededed;
    box-shadow: 0px 2px 8px -4px #c4c7c1;
    .select-edgetype {
      width: 100px;
      margin-right: 10px;
    }
  }
  .mxRubberband {
    background-color: rgb(58, 58, 207);
    position: absolute;
  }
  
  .right-bar {
    width: 260px;
    background-color: #fff;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    border-left: 1px solid #ededed;
    padding-top: 50px;
    box-sizing: border-box;
    .json-viewer {
      overflow: auto;
      position: absolute;
      top: 35%;
      width: 260px;
      height: 70%;
      bottom: 0;
      right: 0;
    }
  }
  .tools-group {
    display: flex;
    justify-content: center;
    button {
      margin-left: 22px;
    }
  }
  .aside-button-group {
    width: 100%;
    position: sticky;
    top: 0px;
    background: #ffffff;
    box-sizing: border-box;
    z-index: 1000;
    border: 1px solid #ededed;
    border-left: none;
  }
}

table.mxPopupMenu {
  background: #fff;
  cursor: pointer;
  border: 1px solid #ededed;
  padding: 5px;
}

div.mxPopupMenu {
  position: absolute;
}
.shapgroud {
  .el-collapse-item__content {
    display: flex;
    flex-wrap: wrap;
  }
  svg g path {
    fill: transparent;
  }
  .stencil-node {
    width: 20%;
  }
  svg g path {
    stroke: #515151;
    -webkit-text-fill-color: #515151;
  }
}

.flow {
  stroke-dasharray: 8;
  animation: dash 0.5s linear;
  animation-iteration-count: infinite;
}
@keyframes dash {
  to {
    stroke-dashoffset: -16;
  }
}
.group-item {
  cursor: pointer;
  height: 40px;
  margin: 5px 0;
  line-height: 40px;
  width: 80%;
  display: inline-block;
  border: 1px solid #eeee;
}
.svg-icon-box {
          width: 32px;
          height: 32px;
          color: red;
}
</style>
