import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  SHOP_AI_DELAY_MS,
  SHOP_ENTER_DURATION_MS,
  SHOP_EXIT_DURATION_MS,
  SHOP_ITEMS,
  SHOP_SELECTION_DURATION_MS,
  getRandomShopItem,
} from '../game/shop'
import type { ItemType } from '../game/types'
import { GameIcon } from './GameIcon'
import { GameModal } from './GameModal'

interface ShopModalProps {
  open: boolean
  isAI: boolean
  onAward: (item: ItemType) => void
}

const itemCopy: Record<
  ItemType,
  { label: string; description: string }
> = {
  bomb: {
    label: '炸弹',
    description: '埋在路线格上，踩中后触发爆炸。',
  },
  remote: {
    label: '遥控骰子',
    description: '精确选择 1–12 中的移动点数。',
  },
  web: {
    label: '蛛网',
    description: '放在路线格上，拦停经过的棋子。',
  },
}

function reducedMotionEnabled(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches ?? false
  )
}

export function ShopModal({
  open,
  isAI,
  onAward,
}: ShopModalProps) {
  const [selectedItem, setSelectedItem] =
    useState<ItemType | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const lockedRef = useRef(false)
  const timersRef = useRef(new Set<number>())

  const schedule = useCallback(
    (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer)
        callback()
      }, delay)
      timersRef.current.add(timer)
    },
    [],
  )

  const selectItem = useCallback(() => {
    if (lockedRef.current || !open) return

    lockedRef.current = true
    const item = getRandomShopItem()
    setSelectedItem(item)

    schedule(() => {
      setIsExiting(true)
      const exitDuration = reducedMotionEnabled()
        ? 0
        : SHOP_EXIT_DURATION_MS

      schedule(() => onAward(item), exitDuration)
    }, SHOP_SELECTION_DURATION_MS)
  }, [onAward, open, schedule])

  useEffect(() => {
    const timers = timersRef.current

    for (const timer of timers) {
      window.clearTimeout(timer)
    }
    timers.clear()

    if (!open) {
      lockedRef.current = false
      setSelectedItem(null)
      setIsExiting(false)
      return
    }

    lockedRef.current = false
    setSelectedItem(null)
    setIsExiting(false)

    if (isAI) {
      const entryDuration = reducedMotionEnabled()
        ? 0
        : SHOP_ENTER_DURATION_MS
      schedule(selectItem, entryDuration + SHOP_AI_DELAY_MS)
    }

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
      timers.clear()
    }
  }, [isAI, open, schedule, selectItem])

  const selectedLabel = selectedItem
    ? itemCopy[selectedItem].label
    : null

  return (
    <GameModal
      open={open}
      title={isAI ? '电脑正在逛道具商店' : '欢迎来到道具商店'}
      description={
        selectedLabel
          ? `本次获得：${selectedLabel}`
          : isAI
            ? '电脑将自动抽取一件随机道具。'
            : '确认后将从三件道具中随机抽取一件。'
      }
      icon={<GameIcon name="shop" />}
      className={`shop-modal ${
        isExiting ? 'shop-modal--exiting' : ''
      }`}
      actions={
        isAI ? undefined : (
          <button
            className="primary-button shop-confirm"
            type="button"
            data-autofocus
            disabled={selectedItem !== null}
            onClick={selectItem}
          >
            {selectedItem ? '抽取完成' : '确认抽取'}
          </button>
        )
      }
    >
      <div className="shop-item-grid" aria-label="商店道具">
        {SHOP_ITEMS.map((item) => {
          const isSelected = selectedItem === item
          const copy = itemCopy[item]

          return (
            <div
              className={`shop-item-card ${
                isSelected ? 'shop-item-card--selected' : ''
              }`}
              data-item={item}
              data-selected={isSelected ? 'true' : 'false'}
              key={item}
            >
              <span className="shop-item-card__icon">
                <GameIcon name={item} />
              </span>
              <strong>{copy.label}</strong>
              <small>{copy.description}</small>
            </div>
          )
        })}
      </div>
      <p className="shop-result" aria-live="polite">
        {selectedLabel
          ? `${selectedLabel}已选中，即将放入背包`
          : '三种道具的获得概率相同'}
      </p>
    </GameModal>
  )
}
