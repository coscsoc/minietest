<script setup lang="ts">
import confetti from 'canvas-confetti'

const props = defineProps<{
  passed: boolean
}>()
function congrats() {
  const defaults = {
    colors: [
      '#5D8C7B',
      '#F2D091',
      '#F2A679',
      '#D9695F',
      '#8C4646',
    ],
    shapes: ['square'],
    ticks: 500,
  } as confetti.Options
  confetti({
    ...defaults,
    particleCount: 80,
    spread: 100,
    origin: { y: 0 },
  })
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      angle: 60,
      spread: 80,
      origin: { x: 0 },
    })
  }, 250)
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      angle: 120,
      spread: 80,
      origin: { x: 1 },
    })
  }, 400)
}

// const a = toRefs(props)
// 过0.3s放礼花
watch(
  // 不能props.passed, 只能传Ref<> 或者函数
  // a.passed,
  () => props.passed,
  (v) => {
    if (v)
      setTimeout(congrats, 300)
  },
  { flush: 'post' },
)
</script>

<template>
  <div />
</template>
    Footer

