// 收集所有的三维对象，然后画出来。
const defAttr = () => ({
  gl: null,
  children: new Set(),
  programs: new Map(),
  children2Draw: new Map(),
  // 背景色
  backgroundColor: [0, 0, 0, 1],
  // 深度测试
  depthTest:true,
})
export default class Scene {
  constructor(attr) {
    Object.assign(this, defAttr(), attr)
  }
  registerProgram(name, { program, attributeNames=[], uniformNames=[] }) {
    const { gl, programs } = this
    const attributes = new Map()
    const uniforms = new Map()
    gl.useProgram(program)
    attributeNames.forEach(name => {
      attributes.set(name, gl.getAttribLocation(program, name))
    })
    uniformNames.forEach(name => {
      uniforms.set(name, gl.getUniformLocation(program, name))
    })
    programs.set(name, { program, attributes, uniforms })
  }

  // 添加三维对象
  add(...objs) {
    this.children = new Set([...this.children, ...objs])
    this.setObjs(objs)
  }
  unshift(...objs) {
    this.children = [...objs, ...this.children]
    this.setObjs(objs)
  }
  setObjs(objs) {
    objs.forEach(obj => {
      obj.parent = this
      obj.init(this.gl)
    })
    this.updateChildren2Draw()
  }
  // 删除三维对象
  remove(obj) {
    this.children.delete(obj)
    this.updateChildren2Draw()
  }
  updateChildren2Draw() {
    const { children } = this
    if (!children.size) { return }
    const children2Draw = new Map()
    children.forEach(child => {
      const { program: name } = child.mat
      if (children2Draw.has(name)) {
        children2Draw.get(name).add(child)
      } else {
        children2Draw.set(name, new Set([child]))
      }
    })
    this.children2Draw = children2Draw
  }
  // 统一设置所有对象共有的属性，比如视图投影矩阵
  setUniform(key, val) {
    this.children.forEach(({ mat }) => {
      mat.setData(key, val)
    })
  }
  // 绘图方法
  draw() {
    const { gl, children2Draw, programs, backgroundColor,depthTest } = this
    gl.clearColor(...backgroundColor)
    depthTest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST)

    for (let [key, objs] of children2Draw.entries()) {
      const { program, attributes, uniforms } = programs.get(key)
      gl.useProgram(program)
      objs.forEach(obj => {
        const { geo: { drawType, count }, mat: { mode } } = obj
        obj.update(gl, attributes, uniforms)
        if (typeof mode === 'string') {
          this[drawType](gl, count, mode)
        } else {
          mode.forEach(m => {
            this[drawType](gl, count, m)
          })
        }
      })
    }
  }
  drawArrays(gl, count, mode) {
    gl.drawArrays(gl[mode], 0, count)
  }
  drawElements(gl, count, mode) {
    // 用顶点索引绘图时，用的数据类型是gl.UNSIGNED_BYTE
    // gl.drawElements(gl[mode], count, gl.UNSIGNED_BYTE, 0)
    
    gl.drawElements(gl[mode],count, gl.UNSIGNED_SHORT,0)
  }
}