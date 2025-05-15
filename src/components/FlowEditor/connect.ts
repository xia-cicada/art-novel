import { App, Line } from 'leafer-ui'
import type { TextNode } from './types'
import { TextNodeTheme } from './config'

interface Point {
  x: number
  y: number
}

type Rectangle = Required<TextNode>

// 获取矩形的四个连接点
function getConnectionPoints(rect: Rectangle): Record<string, Point> {
  return {
    top: { x: rect.x + rect.width / 2, y: rect.y },
    bottom: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
    left: { x: rect.x, y: rect.y + rect.height / 2 },
    right: { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
  }
}

// 计算两个矩形的最佳连接点
function computeConnectionPoints(
  rectA: Rectangle,
  rectB: Rectangle
): { start: Point; end: Point } {
  // 计算中心点
  const centerA = {
    x: rectA.x + rectA.width / 2,
    y: rectA.y + rectA.height / 2,
  }
  const centerB = {
    x: rectB.x + rectB.width / 2,
    y: rectB.y + rectB.height / 2,
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

  return {
    start: getConnectionPoints(rectA)[startSide],
    end: getConnectionPoints(rectB)[endSide],
  }
}

function getControlPoints(
  start: Point,
  end: Point
): { control1: Point; control2: Point } {
  const dx = end.x - start.x
  const dy = end.y - start.y

  // 判断优先水平还是垂直移动
  const isHorizontalFirst = Math.abs(dx) > Math.abs(dy)

  const offset = 10
  if (isHorizontalFirst) {
    return {
      control1: { x: start.x + offset, y: start.y },
      control2: { x: end.x - offset, y: end.y },
    }
  } else {
    return {
      control1: { x: start.x, y: start.y + offset },
      control2: { x: end.x, y: start.y - offset },
    }
  }
}

export class Connection {
  public start!: Point
  public end!: Point
  public control1!: Point
  public control2!: Point
  public line!: Line

  constructor(private rectA: Rectangle, private rectB: Rectangle) {
    this.line = this.getLine()
    this.update()
  }

  public update(): void {
    const points = computeConnectionPoints(this.rectA, this.rectB)
    this.start = points.start
    this.end = points.end

    const controls = getControlPoints(this.start, this.end)
    this.control1 = controls.control1
    this.control2 = controls.control2

    this.line.setAttr('points', [
      this.start.x,
      this.start.y,
      this.control1.x,
      this.control1.y,
      this.control2.x,
      this.control2.y,
      this.end.x,
      this.end.y,
    ])
  }

  public getLine(): Line {
    return new Line({
      points: [],
      cornerRadius: 5,
      strokeWidth: TextNodeTheme.CONNECT_WEIGHT,
      stroke: TextNodeTheme.CONNECT_STROKE,
    })
  }
}

export class ConnectionManager {
  connections: Map<string, Connection> = new Map()

  constructor() {}

  connect(node1: TextNode, node2: TextNode) {
    const connectionKey = this.getConnectKey(node1, node2)
    if (this.connections.has(connectionKey)) return
    const connection = new Connection(node1 as Rectangle, node2 as Rectangle)
    this.connections.set(connectionKey, connection)
    return connection
  }

  private getConnectKey(node1: TextNode, node2: TextNode) {
    return `${node1.id}_${node2.id}`
  }

  refresh(node: TextNode) {
    for (const key of this.connections.keys()) {
      if (key.indexOf(`${node.id}`) !== -1) {
        this.connections.get(key)?.update()
      }
    }
  }
}
