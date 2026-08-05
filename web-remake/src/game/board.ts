export type TileKind =
  | 'start'
  | 'property'
  | 'gold'
  | 'jail'
  | 'shop'
  | 'function'

export interface BoardTile {
  index: number
  column: number
  row: number
  kind: TileKind
  label: string
}

interface Move {
  dx: number
  dy: number
  count: number
}

const pathMoves: Move[] = [
  { dx: 0, dy: 1, count: 9 },
  { dx: 1, dy: 0, count: 3 },
  { dx: 0, dy: -1, count: 2 },
  { dx: -1, dy: 0, count: 1 },
  { dx: 0, dy: -1, count: 5 },
  { dx: 1, dy: 0, count: 4 },
  { dx: 0, dy: 1, count: 5 },
  { dx: -1, dy: 0, count: 1 },
  { dx: 0, dy: 1, count: 2 },
  { dx: 1, dy: 0, count: 3 },
  { dx: 0, dy: -1, count: 9 },
  { dx: -1, dy: 0, count: 8 },
]

const goldTiles = new Set([3, 6, 9, 19, 26, 32, 39, 42, 45, 50])
const jailTiles = new Set([22, 48])
const shopTiles = new Set([13, 28, 37, 46])
const functionTiles = new Set([5, 16, 30, 35, 43])

function getTileKind(index: number): TileKind {
  if (index === 0) return 'start'
  if (goldTiles.has(index)) return 'gold'
  if (jailTiles.has(index)) return 'jail'
  if (shopTiles.has(index)) return 'shop'
  if (functionTiles.has(index)) return 'function'
  return 'property'
}

function getTileLabel(index: number, kind: TileKind): string {
  if (kind === 'start') return '起点'
  if (kind === 'gold') return '金币'
  if (kind === 'jail') return '监狱'
  if (kind === 'shop') return '商店'
  if (kind === 'function') return '事件'
  return String(index)
}

function buildBoardTiles(): BoardTile[] {
  let x = 0
  let y = 0
  const coordinates = [{ x, y }]

  for (const move of pathMoves) {
    for (let step = 0; step < move.count; step += 1) {
      x += move.dx
      y += move.dy
      coordinates.push({ x, y })
    }
  }

  coordinates.pop()

  const reordered = coordinates.map(
    (_, index) => coordinates[(index + 39) % coordinates.length],
  )

  return reordered.map((position, index) => {
    const kind = getTileKind(index)

    return {
      index,
      column: position.x + 1,
      row: 10 - position.y,
      kind,
      label: getTileLabel(index, kind),
    }
  })
}

export const boardTiles = buildBoardTiles()