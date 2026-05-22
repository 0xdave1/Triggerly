import * as SecureStore from "expo-secure-store";

const memoryStore = new Map<string, string>();

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    const value = memoryStore.get(key);
    return value ? (JSON.parse(value) as T) : fallback;
  }
}

export async function setStoredJson<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    await SecureStore.setItemAsync(key, serialized);
  } catch {
    memoryStore.set(key, serialized);
  }
}

export async function deleteStoredValue(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    memoryStore.delete(key);
  }
}
