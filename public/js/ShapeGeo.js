// 用于将图形网格化。
export default class ShapeGeo {
  constructor(pathData = []) {
    this.pathData = pathData; // 平展开的路径数据
    this.geoData = []; // 由路径数据pathData 转成的对象型数组
    this.triangles = []; // 三角形集合，对象型数组
    this.vertices = []; // 平展开的对立三角形顶点集合
    this.parsePath();
    this.update();
  }
  // 更新方法，基于pathData 生成vertices
  update() {
    this.vertices = [];
    this.triangles = [];
    this.findTriangle(0);
    this.upadateVertices()
  }
  // 基于路径数据pathData 转成对象型数组
  parsePath() {
    this.geoData = [];
    const { pathData, geoData } = this
    for (let i = 0; i < pathData.length; i += 2) {
      geoData.push({ x: pathData[i], y: pathData[i + 1] })
    }
  }
  // 寻找符合条件的三角形
  // i 顶点在geoData 中的索引位置，表示从哪里开始寻找三角形
  findTriangle(i) {
    const { geoData, triangles } = this;
    const len = geoData.length;
    
    if (geoData.length <= 3) {
      triangles.push([...geoData]);
    } else {
      const [i0, i1, i2] = [
        i % len,
        (i + 1) % len,
        (i + 2) % len
      ];
      const triangle = [
        geoData[i0],
        geoData[i1],
        geoData[i2],
      ];
      if (this.cross(triangle) > 0 && !this.includePoint(triangle)) {
        triangles.push(triangle);
        geoData.splice(i1, 1);
      }
      this.findTriangle(i1);
    }
  }
  // 判断三角形中是否有其它顶点
  includePoint(triangle) {
    for (let ele of this.geoData) {
      if (!triangle.includes(ele)) {
        if (this.inTriangle(ele, triangle)) {
          return true;
        }
      }
    }
    return false;
  }
  // 判断一个顶点是否在三角形中
  inTriangle(p0, triangle) {
    let inPoly = true;
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      const [p1, p2] = [triangle[i], triangle[j]];
      if (this.cross([p0, p1, p2]) < 0) {
        inPoly = false;
        break
      }
    }
    return inPoly;
  }
  // 以p0为基点，对二维向量p0p1、p0p2做叉乘运算
  cross([p0, p1, p2]) {
    const [ax, ay, bx, by] = [
      p1.x - p0.x,
      p1.y - p0.y,
      p2.x - p0.x,
      p2.y - p0.y,
    ];
    return ax * by - bx * ay;
  }
  // 基于对象数组geoData 生成平展开的vertices 数据
  upadateVertices() {
    const arr = []
    this.triangles.forEach(triangle => {
      for (let { x, y } of triangle) {
        arr.push(x, y)
      }
    })
    this.vertices = arr
  }
}