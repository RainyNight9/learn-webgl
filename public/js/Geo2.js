// data 的数据结构如下：
// {
//   a_Position: {
//     array:类型数组,
//     size:矢量长度, 
//     buffer:缓冲对象,
//     location:attribute变量,
//     needUpdate：true
//   },
//   a_Color: {
//     array:类型数组,
//     size:矢量长度, 
//     buffer:缓冲对象,
//     location:attribute变量,
//     needUpdate：true
//   },
//   ……    
// }
// array 存储所有的attribute 数据
// size 构成一个顶点的所有分量的数目
// buffer 用createBuffer() 方法建立的缓冲对象
// location 用getAttribLocation() 方法获取的attribute变量
// needUpdate 在连续渲染时，是否更新缓冲对象

// index数据结构：
// {
//   array:类型数组,
//   buffer:缓冲对象,
//   needUpdate：true    
// }


const defAttr = () => ({
  data: {}, // 顶点数据
  count: 0, // 顶点总数
  index: null, // 顶点索引数据
  // 默认为null，用drawArrays 的方式绘图
  // 若不为null，用drawElements 的方式绘图
  drawType: 'drawArrays' // 绘图方式
  // drawArrays 使用顶点集合绘图，默认
  // drawElements，使用顶点索引绘图
})
export default class Geo {
  constructor(attr) {
    Object.assign(this, defAttr(), attr)
  }
  // 在场景Scene 初始化时被调用
  init(gl, program) {
    this.initData(gl, program)
    this.initIndex(gl)
  }
  // 初始化顶点索引
  initData(gl) {
    for (let attr of Object.values(this.data)) {
      attr.buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer)
      gl.bufferData(gl.ARRAY_BUFFER, attr.array, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      attr.needUpdate = true
    }
  }
  // 初始化attribute变量
  initIndex(gl) {
    const { index } = this
    if (index) {
      this.count = index.array.length
      this.drawType = 'drawElements'
      index.buffer = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index.buffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index.array, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
      index.needUpdate = true
    } else {
      const { array, size } = this.data['a_Position']
      this.count = array.length / size
      this.drawType = 'drawArrays'
    }
  }
  // 更新方法，用于连续渲染
  update(gl, attrs) {
    this.updateData(gl, attrs)
    this.updateIndex(gl)
  }
  // 更新attribute变量
  updateData(gl, attrs) {
    for (let [key, attr] of Object.entries(this.data)) {
      const { buffer, size, needUpdate, array } = attr
      const location = attrs.get(key)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      if (needUpdate) {
        attr.needUpdate = false
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW)
      }
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(location)
    }
  }
  // 更新顶点索引
  updateIndex(gl) {
    const { index } = this
    if (index) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index.buffer)
      if (index.needUpdate) {
        index.needUpdate = false
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index.array, gl.STATIC_DRAW)
      }
    }
  }
  // 设置attribute数据
  setData(key, val) {
    const obj = this.data[key]
    if (!obj) { return }
    obj.needUpdate = true
    Object.assign(obj, val)
  }
  // 设置顶点索引数据
  setIndex(val) {
    const { index } = this
    if (val) {
      index.needUpdate = true
      index.array = val
      this.count = val.length
      this.drawType = 'drawElements'
    } else {
      const { array, size } = this.data['a_Position']
      this.count = array.length / size
      this.drawType = 'drawArrays'
    }
  }
}