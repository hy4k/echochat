export interface ExchangeTokenRequest {
    clientId: string;
    grantType: string;
    code: string;
    redirectUri: string;
}

export interface ExchangeTokenResponse {
    accessToken: string;
    expiresIn?: number;
    tokenType?: string;
    scope?: string;
}

export interface GetUserInfoResponse {
    openId: string;
    name?: string;
    email?: string;
    platform?: string;
    loginMethod?: string;
}

export interface GetUserInfoWithJwtRequest {
    jwtToken: string;
    projectId: string;
}

export interface GetUserInfoWithJwtResponse extends GetUserInfoResponse { }
