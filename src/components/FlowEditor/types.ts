import type { Rect } from 'leafer-ui'

export interface PlainPoint {
  x: number
  y: number
}

export type EditorNode = Rect

export type Block = Required<EditorNode>
