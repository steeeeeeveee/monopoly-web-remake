import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('游戏页面发生异常', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-screen" role="alert">
          <div className="error-card">
            <span className="error-card__mark" aria-hidden="true">
              !
            </span>
            <p className="error-card__eyebrow">游戏暂停</p>
            <h1>页面遇到了意外问题</h1>
            <p>
              当前对局无法继续显示。重新加载页面后会开始一局新游戏。
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
