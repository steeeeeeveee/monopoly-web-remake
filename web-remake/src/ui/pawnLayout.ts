export interface PawnLayout {
  sizePercent: number
  centerXPercent: number
  centerYPercent: number
}

const singlePawnLayout: PawnLayout = {
  sizePercent: 70,
  centerXPercent: 50,
  centerYPercent: 50,
}

const twoPawnLayouts: PawnLayout[] = [
  {
    sizePercent: 44,
    centerXPercent: 26,
    centerYPercent: 53,
  },
  {
    sizePercent: 44,
    centerXPercent: 74,
    centerYPercent: 53,
  },
]

const gridPawnLayouts: PawnLayout[] = [
  {
    sizePercent: 38,
    centerXPercent: 27,
    centerYPercent: 29,
  },
  {
    sizePercent: 38,
    centerXPercent: 73,
    centerYPercent: 29,
  },
  {
    sizePercent: 38,
    centerXPercent: 27,
    centerYPercent: 73,
  },
  {
    sizePercent: 38,
    centerXPercent: 73,
    centerYPercent: 73,
  },
]

export function getPawnLayout(
  pawnCount: number,
  pawnIndex: number,
): PawnLayout {
  if (pawnCount <= 1) return singlePawnLayout

  if (pawnCount === 2) {
    return twoPawnLayouts[pawnIndex % twoPawnLayouts.length] ??
      twoPawnLayouts[0]!
  }

  return gridPawnLayouts[pawnIndex % gridPawnLayouts.length] ??
    gridPawnLayouts[0]!
}
