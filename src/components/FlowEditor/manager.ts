import { App, DragEvent, KeyEvent, Line, PointerEvent, Rect } from 'leafer-ui'
import type { Block, PlainPoint, EditorNode } from './types'
import { EditorTheme } from './config'
import { uid } from './utils'
import { computeConnectionPoints } from './geometry'

export class Connection {
  public start!: PlainPoint
  public end!: PlainPoint
  public control1!: PlainPoint
  public control2!: PlainPoint
  public line!: Line

  constructor(private rectA: Block, private rectB: Block, app: App) {
    this.line = this.getLine()
    app.tree.add(this.line)
    this.update()
  }

  public update(): void {
    const points = computeConnectionPoints(this.rectA, this.rectB)
    this.start = points.start
    this.end = points.end
    this.control1 = points.control1
    this.control2 = points.control2

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

  public remove() {
    this.line.remove()
  }

  public matchLine(line: Line) {
    return this.line === line
  }

  public getLine(): Line {
    return new Line({
      points: [],
      cornerRadius: 10,
      strokeWidth: EditorTheme.CONNECT_WEIGHT,
      stroke: EditorTheme.CONNECT_STROKE,
    })
  }
}

export class EditorManager {
  app: App
  nodes: EditorNode[] = []
  connections: Map<string, Connection> = new Map()

  activeNode: EditorNode | null = null
  activeLine: Line | null = null
  constructor(app: App) {
    this.app = app
    this.bindAppEvent()
  }

  addNode() {
    const node = new Rect({
      id: uid(),
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      fill: EditorTheme.FILL,
      stroke: EditorTheme.STROKE,
      strokeWidth: EditorTheme.STROKE_WEIGHT,
      cornerRadius: EditorTheme.RADIUS,
      draggable: true,
    })
    this.nodes.push(node)
    this.app.tree.add(node)
  }

  connect(node1: EditorNode, node2: EditorNode) {
    const connectionKey = this.getConnectKey(node1, node2)
    if (this.connections.has(connectionKey)) return
    const connection = new Connection(node1 as Block, node2 as Block, this.app)
    this.connections.set(connectionKey, connection)
    return connection
  }

  removeNode(block: EditorNode) {
    for (const key of this.connections.keys()) {
      if (key.indexOf(`${block.id}`) !== -1) {
        this.removeConnection(key)
      }
    }
    block.remove()
  }

  removeLine(line: Line) {
    for (const key of this.connections.keys()) {
      if (this.connections.get(key)?.matchLine(line)) {
        this.removeConnection(key)
        break
      }
    }
  }

  private removeConnection(key: string) {
    this.connections.get(key)?.remove()
    this.connections.delete(key)
  }

  private getConnectKey(node1: EditorNode, node2: EditorNode) {
    return `${node1.id}_${node2.id}`
  }

  refresh(node: EditorNode) {
    for (const key of this.connections.keys()) {
      if (key.indexOf(`${node.id}`) !== -1) {
        this.connections.get(key)?.update()
      }
    }
  }

  resetView() {
    this.app.tree.scale = { x: 1, y: 1 }
    this.app.tree.x = 0
    this.app.tree.y = 0
    this.app.tree.updateLayout()
  }

  destroy() {
    this.nodes = []
    this.connections.clear()
    this.app.destroy()
  }

  deleteActiveItem() {
    if (this.activeNode) {
      this.removeNode(this.activeNode)
    }
    if (this.activeLine) {
      this.removeLine(this.activeLine)
    }
  }

  handleActiveNodeChange(
    oldNode: EditorNode | null,
    node: EditorNode | null,
    e: MouseEvent
  ) {
    if (oldNode) {
      oldNode.setAttr('stroke', EditorTheme.STROKE)
    }
    if (node) {
      node.setAttr('stroke', EditorTheme.FOCUS_STROKE)
    }
    if (oldNode && node && e.ctrlKey) {
      this.connect(oldNode, node)
    }
  }

  handleActiveLineChange(
    oldLine: Line | null,
    line: Line | null,
    e: MouseEvent
  ) {
    if (oldLine) {
      oldLine.setAttr('stroke', EditorTheme.CONNECT_STROKE)
    }
    if (line) {
      line.setAttr('stroke', EditorTheme.CONNECT_FOCUS_STROKE)
    }
  }

  private bindAppEvent() {
    const app = this.app
    app.on(PointerEvent.CLICK, (e) => {
      const target = e.target
      const oldNode = this.activeNode
      if (target instanceof Rect) {
        this.activeNode = target
      } else {
        this.activeNode = null
      }

      const oldLine = this.activeLine
      if (target instanceof Line) {
        this.activeLine = target
      } else {
        this.activeLine = null
      }

      this.handleActiveNodeChange(oldNode, this.activeNode, e)
      this.handleActiveLineChange(oldLine, this.activeLine, e)
    })

    app.on(DragEvent.DRAG, (e) => {
      const target = e.target
      if (target instanceof Rect) {
        this.refresh(target)
      }
    })

    app.on(KeyEvent.UP, (e) => {
      switch (e.code as string) {
        case 'Delete':
          this.deleteActiveItem()
          break
      }
    })
  }
}
