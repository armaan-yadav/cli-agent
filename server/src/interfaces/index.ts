import { type ModelMessage } from "ai";

// ============================================
// AI Service Interfaces
// ============================================

export interface SendMessageParams {
    messages: ModelMessage[];
    onChunk?: (chunk: string) => void;
    tools?: Record<string, any>;
    onToolCall?: (toolCall: any) => void;
}

export interface GetMessageParams {
    messages: ModelMessage[];
    tools?: Record<string, any>;
}

export interface MessageResponse {
    content: string;
    finishResponse: string;
    usage: any;
}

// ============================================
// Authentication & Token Interfaces
// ============================================

/**
 * Raw OAuth token response from the authorization server
 */
export interface OAuthTokenResponse {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
    scope?: string;
    expires_in?: number;
}

/**
 * Stored token with metadata and computed expiration
 */
export interface StoredToken {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    scope?: string;
    expires_at: string | null;
    created_at: string;
}

/**
 * Token validation result
 */
export interface TokenValidation {
    isValid: boolean;
    isExpired: boolean;
    token: StoredToken | null;
    expiresIn?: number; // milliseconds until expiration
}

/**
 * Token storage operations result
 */
export interface TokenOperationResult {
    success: boolean;
    error?: string;
}
