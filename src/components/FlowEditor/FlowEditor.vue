<script setup lang="ts">
import { App, DragEvent, PointerEvent, Rect } from 'leafer-ui'
import '@leafer-in/viewport'
import '@leafer-in/view'
import { TextNodeTheme } from './config'
import type { TextNode } from './types'
import { ConnectionManager } from './connect'

const refCtn = useTemplateRef('refCtn')

let app: App
let activeNode: TextNode | null
const connectionManager = new ConnectionManager()
onMounted(() => {
  app = new App({
    view: refCtn.value!,
    tree: { type: 'viewport' },
    wheel: { zoomMode: true },
    zoom: { min: 0.5, max: 2 },
    move: { drag: 'auto' },
    cursor: false,
  })
  app.on(PointerEvent.CLICK, (e) => {
    const target = e.target
    const oldNode = activeNode
    if (target instanceof Rect) {
      activeNode = target
    } else {
      activeNode = null
    }
    handleActiveNodeChange(oldNode, activeNode, e)
  })

  app.on(DragEvent.DRAG, (e) => {
    const target = e.target
    if (target instanceof Rect) {
      connectionManager.refresh(target)
    }
  })
})

onUnmounted(() => {
  app.destroy()
})

const handleActiveNodeChange = (
  oldNode: TextNode | null,
  node: TextNode | null,
  e: MouseEvent
) => {
  if (oldNode) {
    oldNode.stroke = TextNodeTheme.STROKE
  }
  if (node) {
    node.stroke = TextNodeTheme.FOCUS_STROKE
  }
  if (oldNode && node && e.ctrlKey) {
    connectNodes(oldNode, node)
  }
}

const connectNodes = (node1: TextNode, node2: TextNode) => {
  const connection = connectionManager.connect(
    node1 as Required<TextNode>,
    node2 as Required<TextNode>
  )!
  app.tree.add(connection.line)
}

const handleAddNode = () => {
  const rect = new Rect({
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    fill: TextNodeTheme.FILL,
    stroke: TextNodeTheme.STROKE,
    strokeWidth: 3,
    cornerRadius: 5,
    draggable: true,
  })
  app.tree.add(rect)
}

const handleResetView = () => {
  app.tree.scale = { x: 1, y: 1 }
  app.tree.x = 0
  app.tree.y = 0
  app.tree.updateLayout()
}
</script>

<template>
  <div
    class="p-2 box-border flow-editor h-full overflow-hidden flex flex-col gap-1"
    @contextmenu.prevent
  >
    <n-flex>
      <n-button size="small" type="primary" @click="handleAddNode">
        添加节点
      </n-button>
      <n-button size="small" type="primary" @click="handleResetView">
        重置视图
      </n-button>
    </n-flex>
    <div
      class="flex-1 overflow-hidden border-(1 solid neutral-200) rounded"
      ref="refCtn"
    ></div>
  </div>
</template>

<style lang="scss"></style>
