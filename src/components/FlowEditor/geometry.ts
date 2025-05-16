import type { Block, PlainPoint } from './types'

interface Segment {
  p1: PlainPoint
  p2: PlainPoint
}

/**叉积 */
function crossProduct(a: PlainPoint, b: PlainPoint, c: PlainPoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/**判断两条线段是否相交 */
export function isSegmentsIntersect(seg1: Segment, seg2: Segment): boolean {
  const { p1: a1, p2: a2 } = seg1
  const { p1: b1, p2: b2 } = seg2

  // 快速排斥实验（检查外接矩形是否相交）
  if (
    Math.max(a1.x, a2.x) < Math.min(b1.x, b2.x) ||
    Math.max(b1.x, b2.x) < Math.min(a1.x, a2.x) ||
    Math.max(a1.y, a2.y) < Math.min(b1.y, b2.y) ||
    Math.max(b1.y, b2.y) < Math.min(a1.y, a2.y)
  ) {
    return false
  }

  // 跨立实验（通过叉积判断方向）
  const d1 = crossProduct(a1, a2, b1)
  const d2 = crossProduct(a1, a2, b2)
  const d3 = crossProduct(b1, b2, a1)
  const d4 = crossProduct(b1, b2, a2)

  // 如果两条线段互相跨立，则相交
  if (d1 * d2 < 0 && d3 * d4 < 0) {
    return true
  }

  // 处理共线或端点重合的情况
  if (d1 === 0 && isPointOnSegment(a1, a2, b1)) return true
  if (d2 === 0 && isPointOnSegment(a1, a2, b2)) return true
  if (d3 === 0 && isPointOnSegment(b1, b2, a1)) return true
  if (d4 === 0 && isPointOnSegment(b1, b2, a2)) return true

  return false
}

/**检查点是否在线段上 */
function isPointOnSegment(
  segStart: PlainPoint,
  segEnd: PlainPoint,
  point: PlainPoint
): boolean {
  // 检查点是否在线段的矩形范围内
  const isInRange =
    point.x >= Math.min(segStart.x, segEnd.x) &&
    point.x <= Math.max(segStart.x, segEnd.x) &&
    point.y >= Math.min(segStart.y, segEnd.y) &&
    point.y <= Math.max(segStart.y, segEnd.y)
  if (!isInRange) return false

  // 共线时，叉积应为0
  const cross =
    (segEnd.x - segStart.x) * (point.y - segStart.y) -
    (segEnd.y - segStart.y) * (point.x - segStart.x)
  return Math.abs(cross) < 1e-10 // 考虑浮点误差
}

/**获取矩形的四个连接点 */
function getConnectionPoints(rect: Block): Record<string, PlainPoint> {
  return {
    top: { x: rect.x + rect.width / 2, y: rect.y },
    bottom: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
    left: { x: rect.x, y: rect.y + rect.height / 2 },
    right: { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
  }
}

/**计算两个矩形的最佳连接点 */
export function computeConnectionPoints(
  block1: Block,
  block2: Block
): {
  start: PlainPoint
  end: PlainPoint
  control1: PlainPoint
  control2: PlainPoint
} {
  // 计算中心点
  const centerA = {
    x: block1.x + block1.width / 2,
    y: block1.y + block1.height / 2,
  }
  const centerB = {
    x: block2.x + block2.width / 2,
    y: block2.y + block2.height / 2,
  }

  const dx = centerB.x - centerA.x
  const dy = centerB.y - centerA.y
  const isHorizontal = Math.abs(dx) > Math.abs(dy)

  let startSide: keyof ReturnType<typeof getConnectionPoints>
  let endSide: keyof ReturnType<typeof getConnectionPoints>

  // 根据方向选择连接边
  if (isHorizontal) {
    startSide = dx > 0 ? 'right' : 'left'
    endSide = dx > 0 ? 'left' : 'right'
  } else {
    startSide = dy > 0 ? 'bottom' : 'top'
    endSide = dy > 0 ? 'top' : 'bottom'
  }

  const start = getConnectionPoints(block1)[startSide]
  const end = getConnectionPoints(block2)[endSide]

  let control1: PlainPoint, control2: PlainPoint
  const offset = 10
  if (isHorizontal) {
    control1 = { x: start.x + offset * Math.sign(dx), y: start.y }
    control2 = { x: end.x - offset * Math.sign(dx), y: end.y }
  } else {
    control1 = { x: start.x, y: start.y + offset * Math.sign(dy) }
    control2 = {
      x: end.x,
      y: end.y - offset * Math.sign(dy),
    }
  }

  return { start, end, control1, control2 }
}
