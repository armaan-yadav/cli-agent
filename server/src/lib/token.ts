import chalk from "chalk";
import fs from "fs/promises";
import { CONFIG_DIR, TOKEN_FILE } from "../cli/commands/auth/auth.config.js";
import type {
  OAuthTokenResponse,
  StoredToken,
  TokenValidation,
  TokenOperationResult,
} from "../interfaces/index.js";

const TOKEN_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

export async function getStoredToken(): Promise<StoredToken | null> {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data) as StoredToken;

    // Validate required fields
    if (!token.access_token || !token.created_at) {
      console.warn(chalk.yellow("Invalid token format in storage"));
      return null;
    }

    return token;
  } catch (error: any) {
    // File doesn't exist or can't be read - this is expected for first-time users
    if (error.code !== "ENOENT") {
      console.warn(chalk.yellow(`Failed to read token: ${error.message}`));
    }
    return null;
  }
}

export async function storeToken(
  token: OAuthTokenResponse
): Promise<TokenOperationResult> {
  try {
    // Validate required token field
    if (!token.access_token) {
      return {
        success: false,
        error: "Missing access_token in token response",
      };
    }

    // Ensure config directory exists
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // Store token with metadata
    const tokenData: StoredToken = {
      access_token: token.access_token,
      ...(token.refresh_token && { refresh_token: token.refresh_token }),
      token_type: token.token_type || "Bearer",
      ...(token.scope && { scope: token.scope }),
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };

    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return { success: true };
  } catch (error: any) {
    const errorMessage = `Failed to store token: ${error?.message}`;
    console.error(chalk.red(errorMessage));
    return { success: false, error: errorMessage };
  }
}

export async function clearStoredToken(): Promise<TokenOperationResult> {
  try {
    await fs.unlink(TOKEN_FILE);
    return { success: true };
  } catch (error: any) {
    // ENOENT means file doesn't exist - this is fine
    if (error.code === "ENOENT") {
      return { success: true };
    }
    return {
      success: false,
      error: `Failed to delete token: ${error.message}`,
    };
  }
}

export async function isTokenExpired(): Promise<boolean> {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();

  // Consider expired if less than buffer time remaining
  return expiresAt.getTime() - now.getTime() < TOKEN_EXPIRATION_BUFFER_MS;
}

export async function validateToken(): Promise<TokenValidation> {
  const token = await getStoredToken();

  if (!token) {
    return {
      isValid: false,
      isExpired: true,
      token: null,
    };
  }

  const isExpired = await isTokenExpired();

  if (isExpired) {
    return {
      isValid: false,
      isExpired: true,
      token,
    };
  }

  // Calculate time until expiration
  const result: TokenValidation = {
    isValid: true,
    isExpired: false,
    token,
  };

  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at);
    result.expiresIn = expiresAt.getTime() - Date.now();
  }

  return result;
}

export async function requireAuth(): Promise<StoredToken> {
  const token = await getStoredToken();

  if (!token) {
    console.log(
      chalk.red("❌ Not authenticated. Please run 'arka login' first.")
    );
    process.exit(1);
  }

  if (await isTokenExpired()) {
    console.log(chalk.yellow("⚠️  Your session has expired. Please login again."));
    console.log(chalk.gray("   Run: arka login\n"));
    process.exit(1);
  }

  return token;
}

export async function getAccessToken(): Promise<string> {
  const token = await requireAuth();
  return token.access_token;
}
