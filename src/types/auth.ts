export namespace InternalToken {
  export interface Token {
    token: string;
    refreshToken: string;
    expiresIn: number;
  }
}

export namespace InternalAuth {
  // 手机号 OTP 登录表单
  export interface LoginBySmsOtpForm {
    phone: string;
    otp: string;
  }

  // 手机号密码登录表单
  export interface LoginByPassword {
    phone: string;
    password: string;
  }

  // 刷新 token 表单
  export interface RefreshTokenForm {
    refreshToken: string;
  }

  // 用户信息
  export interface UserInfo {
    id: string;
    phone: string;
    nickname?: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
  }
}

// 认证状态
export type AuthStatus = "authenticated" | "unauthenticated" | "loading";

// 认证上下文
export interface AuthContext {
  status: AuthStatus;
  user: InternalAuth.UserInfo | null;
  login: (data: InternalAuth.LoginByPassword | InternalAuth.LoginBySmsOtpForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
} 