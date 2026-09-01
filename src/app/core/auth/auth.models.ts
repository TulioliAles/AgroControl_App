export interface LoginRequest {
  email: string;
  password: string;
}

export interface AccessTokenResponse {
  accessToken: string;
  expiresAt: string;
}

export interface AuthSession extends AccessTokenResponse {
  email: string;
}
