<script setup lang="ts">
import { App } from 'leafer-ui'
import '@leafer-in/viewport'
import '@leafer-in/view'
import { EditorManager } from './manager'

const refCtn = useTemplateRef('refCtn')

let app: App
let manager: EditorManager
onMounted(() => {
  app = new App({
    view: refCtn.value!,
    tree: { type: 'viewport' },
    wheel: { zoomMode: true },
    zoom: { min: 0.5, max: 2 },
    move: { drag: 'auto' },
    cursor: false,
  })
  manager = new EditorManager(app)
})

onUnmounted(() => {
  manager.destroy()
})

const handleAddNode = () => {
  manager.addNode()
}

const handleResetView = () => {
  manager.resetView()
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
