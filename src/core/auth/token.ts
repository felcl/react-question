import { InternalToken } from "@/types/auth";
import { refreshToken } from "@/api/interface/auth";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export interface TokenService {
  getToken(): string | null;
  getRefreshToken(): string | null;
  setToken(token: InternalToken.Token): void;
  clearToken(): void;
  refreshToken(): Promise<void>;
}

class TokenManager implements TokenService {
  private token: string | null = null;
  private refreshTokenValue: string | null = null;

  constructor() {
    // 从 localStorage 恢复 token
    this.token = localStorage.getItem(TOKEN_KEY);
    this.refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getToken(): string | null {
    return this.token;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }

  setToken(tokenData: InternalToken.Token): void {
    this.token = tokenData.token;
    this.refreshTokenValue = tokenData.refreshToken;
    
    localStorage.setItem(TOKEN_KEY, tokenData.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refreshToken);
  }

  clearToken(): void {
    this.token = null;
    this.refreshTokenValue = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async refreshToken(): Promise<void> {
    if (!this.refreshTokenValue) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await refreshToken({
        refreshToken: this.refreshTokenValue,
      });

      if (response.success && response.data) {
        this.setToken(response.data as unknown as InternalToken.Token);
      } else {
        this.clearToken();
        throw new Error(response.errorMessage);
      }
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }
}

export const tokenService = new TokenManager(); 