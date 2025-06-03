export interface ErrorHandler {
  showError(message: string): void;
  showSuccess(message: string): void;
  showWarning(message: string): void;
}

// 默认的错误处理器实现
export class DefaultErrorHandler implements ErrorHandler {
  showError(message: string): void {
    console.error(message);
    // 这里可以集成具体的 UI 框架，比如 antd 的 message
    // message.error(message);
  }

  showSuccess(message: string): void {
    console.log(message);
    // message.success(message);
  }

  showWarning(message: string): void {
    console.warn(message);
    // message.warning(message);
  }
}

// 全局错误处理器实例
let errorHandler: ErrorHandler = new DefaultErrorHandler();

export const setErrorHandler = (handler: ErrorHandler) => {
  errorHandler = handler;
};

export const getErrorHandler = () => errorHandler; 