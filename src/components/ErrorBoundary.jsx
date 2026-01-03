import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // send to logging service if desired
    console.error('Uncaught error in app:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-md max-w-md text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">应用运行时错误</h2>
            <p className="text-sm text-gray-700 mb-4">页面加载失败，请打开浏览器控制台查看详细错误信息。</p>
            <pre className="text-xs text-left overflow-auto max-h-40 bg-gray-50 p-2 rounded">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;