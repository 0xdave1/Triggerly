import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "triggerly.authToken";
let memoryToken: string | undefined;

export async function getAuthToken(): Promise<string | undefined> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Web previews and some test runtimes do not support SecureStore.
  }
}

export async function clearAuthToken(): Promise<void> {
  memoryToken = undefined;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Memory fallback is already cleared.
  }
}
