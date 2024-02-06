// 负责对Geo对象和Mat对象的统一初始化和更新。
const defAttr = () => ({
  geo: null,
  mat: null,
})
export default class Obj3D {
  constructor(attr) {
    Object.assign(this, defAttr(), attr)
  }
  init(gl) {
    this.mat.init(gl)
    this.geo.init(gl)
  }

  update(gl, attributes, uniforms) {
    this.geo.update(gl, attributes)
    this.mat.update(gl, uniforms)
  }
}