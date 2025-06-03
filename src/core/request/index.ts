import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { tokenService } from "../auth/token";
import { getErrorHandler } from "../error/errorHandler";

export type Response<T> =
  | {
      data: T;
      success: true;
      errorCode?: string;
      errorMessage?: string;
    }
  | {
      data?: T;
      success: false;
      errorCode: number;
      errorMessage: string;
    };

type ExtractKeys<T extends string> =
  T extends `${string}{${infer Key}}${infer Rest}`
    ? Key | ExtractKeys<Rest>
    : never;

type PathVariables<T extends string> = ExtractKeys<T> extends never
  ? Record<string, string | number>
  : Record<ExtractKeys<T>, string | number>;

type RequestConfig<
  D extends object,
  Q extends object,
  U extends string,
  P = PathVariables<U>
> = Omit<AxiosRequestConfig<D>, "url" | "params"> & {
  /**
   * @example '/api/:id' => pathVariables: { id: "1" }
   * @example '/api/:id/:name' => pathVariables: { id: "1", name: "2" }
   */
  url: U;
  ignoreAuth?: boolean; //不為true時 header需附帶Authentication value為token
  silentError?: boolean;
  throwError?: boolean;
  params?: Q;
  /**
   * @example '/api/:id' => { id: "1" }
   * @example '/api/:id/:name' => { id: "1", name: "2" }
   */
  pathVariables?: P;
};

export interface Request {
  <
    T,
    D extends object = any,
    Q extends object = any,
    U extends string = string,
    P = PathVariables<U>
  >(
    args: RequestConfig<D, Q, U, P>
  ): Promise<Response<T>>;
}

const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { ignoreAuth, ...restConfig } = config as unknown as RequestConfig<any, any, any>;
    
    if (!ignoreAuth) {
      const token = tokenService.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config as unknown as RequestConfig<any, any, any>;
    const { silentError, throwError } = config || {};

    // 如果是 401 错误且不是刷新 token 的请求，尝试刷新 token
    if (error.response?.status === 401 && !config?.url?.includes("/token")) {
      try {
        await tokenService.refreshToken();
        // 重试原请求
        const token = tokenService.getToken();
        if (token && config && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          return instance(config as unknown as InternalAxiosRequestConfig);
        }
      } catch (refreshError) {
        // 刷新 token 失败，清除 token
        tokenService.clearToken();
        if (!silentError) {
          getErrorHandler().showError("登录已过期，请重新登录");
        }
      }
    }

    // 处理其他错误
    if (!silentError) {
      const errorMessage = error.response?.data?.message || error.message || "请求失败";
      getErrorHandler().showError(errorMessage);
    }

    if (throwError) {
      return Promise.reject(error);
    }

    return Promise.resolve({
      data: {
        success: false,
        errorCode: error.response?.status || 500,
        errorMessage: error.response?.data?.message || error.message || "请求失败",
      },
    });
  }
);

const request: Request = async <T, D extends object = any, Q extends object = any, U extends string = string, P = PathVariables<U>>(
  args: RequestConfig<D, Q, U, P>
): Promise<Response<T>> => {
  const { url, pathVariables, ...restConfig } = args;
  
  // 处理路径变量
  let finalUrl = url;
  if (pathVariables) {
    Object.entries(pathVariables).forEach(([key, value]) => {
      finalUrl = finalUrl.replace(`:${key}`, String(value)) as U;
    });
  }

  try {
    const response = await instance.request<Response<T>>({
      ...restConfig,
      url: finalUrl,
    } as InternalAxiosRequestConfig);

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (args.throwError) {
      throw error;
    }
    return {
      success: false,
      errorCode: axiosError.response?.status || 500,
      errorMessage: axiosError.response?.data?.message || axiosError.message || "请求失败",
    };
  }
};

export default request;
