import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

afterEach(cleanup)

function BrokenView(): ReactNode {
  throw new Error('测试异常')
}

describe('页面错误保护', () => {
  it('组件异常时显示可恢复的中文提示', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    render(
      <ErrorBoundary>
        <BrokenView />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      '页面遇到了意外问题',
    )
    expect(
      screen.getByRole('button', { name: '重新加载' }),
    ).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
