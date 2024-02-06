// 合成：多个时间轨的集合
// 时间轨：通过关键帧，对其中目标对象的状态进行插值计算
// 补间动画：通过两个关键帧，对一个对象在这两个关键帧之间的状态进行插值计算，从而实现这个对象在两个关键帧间的平滑过渡
export default class Compose {
  constructor() {
    // parent 父对象，合成对象可以相互嵌套
    this.parent = null;
    // children 子对象集合，其集合元素可以是时间轨，也可以是合成对象
    this.children = new Set();
  }
  // add(obj) 添加子对象方法
  add(obj) {
    obj.parent = this;
    this.children.add(obj);
  }
  // update(t) 基于当前时间更新子对象状态的方法
  update(t) {
    this.children.forEach((ele) => {
      ele.update(t);
    });
  }
  // 基于时间轨的目标对象删除时间轨
  deleteByTarget(targrt) {
    const { children } = this
    for (let child of children) {
      if (child.target === targrt) {
        children.delete(child)
        break
      }
    }
  }
}