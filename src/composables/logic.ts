import type { Ref } from 'vue'
import type { BlockState } from '~/types'

const directions = [
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]

type GameStatus = 'play' | 'win' | 'lost'
interface GameState {
  board: BlockState[][]
  mineGenerated: boolean // 是否已经生成 炸弹
  status: GameStatus
  startMS: number
  endMS?: number
}

export class GamePlay {
  state = ref() as Ref<GameState>
  mineGenerated = false
  gameState = ref<'play' | 'win' | 'lost'>('play')

  constructor(public width: number, public height: number, public mines: number) {
    this.reset()
  }

  get board() {
    return this.state.value.board
  }

  get blocks() {
    return this.state.value.board.flat()
  }

  reset(width = this.width, height = this.height, mines = this.mines) {
    this.width = width
    this.height = height
    this.mines = mines
    this.state.value = {
      startMS: +Date.now(),
      status: 'play',
      mineGenerated: false,
      board: Array.from({ length: this.height }, (_, y) =>
        Array.from(
          { length: this.width },
          (_, x): BlockState => ({
            x,
            y,
            adjacentMines: 0,
            revealed: false,
          }),
        ),
      ),
    }
  }

  random(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  randomInt(min: number, max: number) {
    return Math.round(this.random(min, max))
  }

  // initial: 点击位置
  generateMines(state: BlockState[][], initial: BlockState) {
    const randomSet: { [key: number]: number[] } = {}
    const placeRandom = () => {
      // 随机mines坐标
      const x = this.randomInt(0, this.width - 1)
      const y = this.randomInt(0, this.height - 1)
      const block = state[y][x]

      if (randomSet[y] && randomSet[y].includes(x))
        return false
      randomSet[y] = (randomSet[y] || []).concat(x)

      // 点击位置的四周没有炸弹
      // 这是点击位置的相邻三横竖没有炸弹
      // 逻辑有问题
      if (Math.abs(initial.x - block.x) <= 1 && Math.abs(initial.y - block.y) <= 1)
        return false
      if (block.mine)
        return false

      block.mine = true
      return true
    }

    // 根据炸弹数量生成💣
    // new Array(this.mines).fill(null)
    Array.from({ length: this.mines }, _ => null)
      .forEach(() => {
        let placed = false
        while (!placed)
          placed = placeRandom()
      })

    this.updateNumbers()
  }

  updateNumbers() {
    this.board.forEach((raw) => {
      raw.forEach((block) => {
        if (block.mine)
          return

        this.getSiblings(block).forEach((b) => {
          if (b.mine)
            block.adjacentMines += 1
        })
      })
    })
  }

  expendZero(block: BlockState) {
    //
    if (block.adjacentMines)
      return
      // 获
    this.getSiblings(block).forEach((s) => {
      if (!s.revealed) {
        s.revealed = true
        this.expendZero(s)
      }
    })
  }

  onRightClick(block: BlockState) {
    if (this.state.value.status !== 'play')
      return
    if (block.revealed)
      return
    block.flagged = !block.flagged
  }

  onClick(block: BlockState): void {
    if (this.state.value.status !== 'play')
      return
    // 第一次生成炸弹(从点击位置)
    if (!this.state.value.mineGenerated) {
      this.generateMines(this.state.value.board, block)
      this.state.value.mineGenerated = true
    }
    // 点击的翻转
    block.revealed = true
    // 是咋当
    if (block.mine) {
      this.onGameOver('lost')
      return
    }

    // 是0, 翻转所有相邻的
    this.expendZero(block)
  }

  // 从block开始, 向上下左右
  getSiblings(block: BlockState) {
    return directions.map(([dx, dy]) => {
      const x2 = block.x + dx
      const y2 = block.y + dy
      if (x2 < 0 || x2 >= this.width || y2 < 0 || y2 >= this.height)
        return undefined

      return this.board[y2][x2]
    }).filter(Boolean) as BlockState[]
  }

  showAllMines() {
    this.board.flat().forEach((i) => {
      if (i.mine)
        i.revealed = true
    })
  }

  checkGameState() {
    if (!this.state.value.mineGenerated)
      return
    const blocks = this.board.flat()

    if (blocks.every(block => block.revealed || block.flagged || block.mine)) {
      if (blocks.some(block => block.flagged && !block.mine))
        this.onGameOver('win')
      else
        this.onGameOver('win')
    }
  }

  // 双击自动展开
  autoExpand(block: BlockState) {
    const siblings = this.getSiblings(block)
    // 四周已翻开的格子
    const flags = siblings.reduce((a, b) => a + (b.flagged ? 1 : 0), 0)
    // 四周没有标记展开的数量
    const notRevealed = siblings.reduce((a, b) => a + ((!b.revealed && !b.flagged) ? 1 : 0), 0)

    if (flags === block.adjacentMines) {
      siblings.forEach((i) => {
        if (i.revealed || i.flagged)
          return
        i.revealed = true
        this.expendZero(i)
        if (i.mine)
          this.onGameOver('lost')
      })
    }
    // 还有几个格子没翻开
    const missingFlags = block.adjacentMines - flags
    if (notRevealed === missingFlags) {
      siblings.forEach((i) => {
        // 点击block的数字 与 周围没有标记展开的数量一致, 直接全部翻开
        if (!i.revealed && !i.flagged)
          i.flagged = true
      })
    }
  }

  onGameOver(status: GameStatus) {
    this.state.value.status = status
    this.state.value.endMS = +Date.now()

    if (status === 'win')
      // eslint-disable-next-line no-alert
      alert('win')

    if (status === 'lost') {
      this.showAllMines()
      setTimeout(() => {
        // eslint-disable-next-line no-alert
        alert('lost')
      }, 10)
    }
  }
}
