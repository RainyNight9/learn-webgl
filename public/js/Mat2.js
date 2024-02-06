// data 数据结构：
// {
//   u_Color: {
//     value:1,
//     type: 'uniform1f',    
//     location:null,
//     needUpdate:true,
//   },
//   ……    
// }
// value uniform数据值
// type uniform数据的写入方式
// location 用getUniformLocation() 方法获取的uniform变量
// needUpdate 在连续渲染时，是否更新uniform变量

// maps 数据结构:
// u_Sampler:{
//   image,
//   format,
//   wrapS,
//   wrapT,
//   magFilter,
//   minFilter
// },
// image 图形源
// format 数据类型，默认gl.RGB
// wrapS 对应纹理对象的TEXTURE_WRAP_S 属性
// wrapT 对应纹理对象的TEXTURE_WRAP_T 属性
// magFilter 对应纹理对象的TEXTURE_MAG_FILTER 属性
// minFilter对应纹理对象的TEXTURE_MIN_FILTER属性

const defAttr = () => ({
  program: null, // 程序对象
  data: {}, // uniform数据
  mode: 'TRIANGLES', // 图形的绘制方式，默认独立三角形。
  // mode 也可以是数组，表示多种绘图方式，如['TRIANGLE_STRIP', 'POINTS']
  maps: {}, // 集合
})
export default class Mat {
  constructor(attr) {
    Object.assign(this, defAttr(), attr)
  }
  // 获取uniform变量，绑定到其所在的对象上。
  init(gl) {
    Object.values(this.maps).forEach((map, ind) => {
      if (!map.texture) {
        map.texture = gl.createTexture()
      }
      this.updateMap(gl, map, ind)
    })
  }
  updateMap(gl, map, ind) {
    const {
      format = gl.RGB,
      image,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      texture
    } = map

    if (!texture) {
      map.texture = gl.createTexture()
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.activeTexture(gl[`TEXTURE${ind}`])
    gl.bindTexture(gl.TEXTURE_2D, map.texture)
    image && gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format,
      format,
      gl.UNSIGNED_BYTE,
      image
    )
    wrapS && gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      wrapS
    )
    wrapT && gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      wrapT
    )
    magFilter && gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      magFilter
    )
    if (!minFilter || minFilter > 9729) {
      gl.generateMipmap(gl.TEXTURE_2D)
    }
    minFilter && gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      minFilter
    )
    // 取消对纹理缓冲区的清理
    // gl.bindTexture(gl.TEXTURE_2D, null)
  }

  // 更新方法，用于连续渲染
  update(gl, uniforms) {
    this.updateData(gl, uniforms)
    this.updateMaps(gl, uniforms)
  }
  // 更新uniform变量
  updateData(gl, uniforms) {
    for (let [key, obj] of Object.entries(this.data)) {
      const { type, value } = obj
      const location = uniforms.get(key)
      if (type.includes('Matrix')) {
        gl[type](location, false, value)
      } else {
        gl[type](location, value)
      }
    }
  }
  // 更新纹理
  updateMaps(gl, uniforms) {
    Object.entries(this.maps).forEach((arr, ind) => {
      const [key, map] = arr
      if (map.needUpdate) {
        map.needUpdate = false
        this.updateMap(gl, map, ind)
      } else {
        gl.bindTexture(gl.TEXTURE_2D, map.texture)
      }
      gl.uniform1i(uniforms.get(key), ind)
    })
  }
  // 设置uniform数据
  setData(key, val) {
    const obj = this.data[key]
    if (!obj) { return }
    Object.assign(obj, val)
  }
  // 设置纹理
  setMap(key, val) {
    const obj = this.maps[key]
    val.needUpdate = true
    if (obj) {
      Object.assign(obj,val)
    } else {
      this.maps[key]=val
    }
  }
}