// 建立时间轨
export default class Track {
  constructor(target) {
    this.target = target; // 时间轨上的目标对象
    this.parent = null; // 父对象，只能是合成对象
    this.start = 0; // 起始时间，即时间轨的建立时间
    this.timeLen = 5; // 时间轨总时长
    this.loop = false; // 是否循环
    this.keyMap = new Map(); // 关键帧集合
    this.onEnd = () => { }
    this.prevTime=0
  }
  // update(t) 基于当前时间更新目标对象的状态
  update(t) {
    const { keyMap, timeLen, target, loop, start,prevTime } = this;

    // 先计算本地时间，即世界时间相对于时间轨起始时间的的时间
    let time = t - start;
    if (timeLen >= prevTime && timeLen < time) {
      this.onEnd()
    }
    this.prevTime=time

    // 若时间轨循环播放，则本地时间基于时间轨长度取余。
    if (loop) {
      time = time % timeLen;
    }

    // 遍历关键帧集合
    for (const [key, fms] of keyMap) {
      const last = fms.length - 1;
      // 若本地时间小于第一个关键帧的时间，目标对象的状态等于第一个关键帧的状态
      if (time < fms[0][0]) {
        target[key] = fms[0][1];
      } else if (time > fms[last][0]) { 
        // 若本地时间大于最后一个关键帧的时间，目标对象的状态等于最后一个关键帧的状态
        target[key] = fms[last][1];
      } else { 
        // 否则，计算本地时间在左右两个关键帧之间对应的补间状态
        target[key] = getValBetweenFms(time, fms, last);
      }
    }
  }
}

// 获取两个关键帧之间补间状态的方法
// time 本地时间
// fms 某个属性的关键帧集合
// last 最后一个关键帧的索引位置
function getValBetweenFms(time, fms, last) {
  // 遍历所有关键帧
  for (let i = 0; i < last; i++) {
    const fm1 = fms[i];
    const fm2 = fms[i + 1];
    // 判断当前时间在哪两个关键帧之间
    if (time >= fm1[0] && time <= fm2[0]) {
      const delta = {
        x: fm2[0] - fm1[0],
        y: fm2[1] - fm1[1],
      };
      // 基于这两个关键帧的时间和状态，求点斜式
      const k = delta.y / delta.x;
      const b = fm1[1] - fm1[0] * k;
      // 基于点斜式求本地时间对应的状态
      return k * time + b;
    }
  }
}