const defAttr = () => ({
  gl: null, // webgl上下文对象
  vertices: [], // 顶点数据集合，在被赋值的时候会做两件事
  // 1、更新count 顶点数量，数据运算尽量不放渲染方法里
  // 2、向缓冲区内写入顶点数据

  geoData: [], // 模型数据，对象数组，可解析出 vertices 顶点数据
  size: 3, // 顶点分量的数目
  attrName: 'a_Position',
  uniName: 'u_IsPOINTS',
  uniforms: {}, // uniform变量集合
  count: 0, // 顶点数量
  types: ['POINTS'], // 绘图方式，可以用多种方式绘图
  circleDot: false, // 是否是圆点
  u_IsPOINTS: null, // uniform变量
  source: [], // 数据源
  sourceSize: 0, // 顶点数量，数据源尺寸
  elementBytes: 4, // 元素字节数
  categorySize: 0, // 类目尺寸
  attributes: {}, // attribute属性集合
})

export default class Poly {
  constructor(attr) {
    Object.assign(this, defAttr(), attr)
    this.init()
  }
  init() {
    const { attrName, size, gl, circleDot } = this
    if (!gl) { return }
    // 缓冲对象
    const vertexBuffer = gl.createBuffer();
    // 绑定缓冲对象
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 写入数据
    this.updateBuffer()

    // 获取attribute 变量
    const a_Position = gl.getAttribLocation(gl.program, attrName)
    // 修改attribute 变量
    gl.vertexAttribPointer(a_Position, size, gl.FLOAT, false, 0, 0)
    // 赋能-批处理
    gl.enableVertexAttribArray(a_Position)

    // 如果是圆点，就获取一下uniform 变量
    if (circleDot) {
      this.u_IsPOINTS = gl.getUniformLocation(gl.program, 'u_IsPOINTS')
    }
    this.calculateSize()
    this.updateAttribute();
    // 更新uniform 变量
    this.updateUniform();
    this.updateMaps()
  }

  // 基于数据源计算类目尺寸、类目字节数、顶点总数
  calculateSize() {
    const {attributes, elementBytes,source } = this
    let categorySize = 0
    Object.values(attributes).forEach(ele => {
      const { size, index } = ele
      categorySize += size
      ele.byteIndex=index*elementBytes
    })
    this.categorySize = categorySize
    this.categoryBytes=categorySize*elementBytes
    this.sourceSize = source.length / categorySize
  }
  // 更新attribute 变量
  updateAttribute() {
    const { gl, attributes, categoryBytes, source } = this
    const sourceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sourceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(source), gl.STATIC_DRAW)
    for (let [key, { size, byteIndex }] of Object.entries(attributes)) {
      const attr = gl.getAttribLocation(gl.program, key)
      gl.vertexAttribPointer(
        attr,
        size,
        gl.FLOAT,
        false,
        categoryBytes,
        byteIndex
      )
      gl.enableVertexAttribArray(attr)
    }
  }
  
  // 更新uniform变量
  updateUniform() {
    const {gl, uniforms}=this
    for (let [key, val] of Object.entries(uniforms)) {
        const { type, value } = val
        const u = gl.getUniformLocation(gl.program, key)
        if (type.includes('Matrix')) {
            gl[type](u,false,value)
        } else {
            gl[type](u,value)
        }
    }
  }

  updateMaps() {
    const { gl, maps } = this
    Object.entries(maps).forEach(([key, val], ind) => {
      const {
        format = gl.RGB,
        image,
        wrapS,
        wrapT,
        magFilter,
        minFilter
      } = val

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.activeTexture(gl[`TEXTURE${ind}`])
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        format,
        format,
        gl.UNSIGNED_BYTE,
        image
      )

      wrapS&&gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        wrapS
      )
      wrapT&&gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_T,
        wrapT
      )

      magFilter&&gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        magFilter
      )

      if (!minFilter || minFilter > 9729) {
        gl.generateMipmap(gl.TEXTURE_2D)
      }

      minFilter&&gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          minFilter
        )

      const u = gl.getUniformLocation(gl.program, key)
      gl.uniform1i(u, ind)
    })
  }

  // 更新缓冲区数据，同时更新顶点数量
  updateBuffer() {
    const { gl, vertices } = this
    this.updateCount()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
  }

  // 更新顶点数量
  updateCount() {
    this.count = this.vertices.length / this.size
  }

  // 添加顶点
  addVertice(...params) {
    this.vertices.push(...params)
    this.updateBuffer()
  }

  // 删除最后一个顶点
  popVertice() {
    const { vertices, size } = this
    const len = vertices.length
    vertices.splice(len - size, len)
    this.updateCount()
  }

  // 根据索引位置设置顶点
  setVertice(ind, ...params) {
    const { vertices, size } = this
    const i = ind * size
    params.forEach((param, paramInd) => {
      vertices[i + paramInd] = param
    })
  }

  // 基于geoData 解析出vetices 数据
  updateVertices(params) {
    const { geoData } = this
    const vertices = []
    geoData.forEach(data => {
      params.forEach(key => {
        vertices.push(data[key])
      })
    })
    this.vertices = vertices
  }

  // 绘图方法
  draw(types = this.types) {
    const { gl, count, circleDot, u_IsPOINTS } = this
    for (let type of types) {
      // 如果是圆点，就基于绘图方式修改uniform 变量
      circleDot && gl.uniform1f(u_IsPOINTS, type === 'POINTS')
      gl.drawArrays(gl[type], 0, count);
    }
  }
}