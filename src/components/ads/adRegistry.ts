const adRegistry = new Map<string, boolean>();

export function hasAdRegistry(key: string) {
  return adRegistry.has(key);
}

export function setAdRegistry(key: string) {
  adRegistry.set(key, true);
}

export function deleteAdRegistry(key: string) {
  adRegistry.delete(key);
}

/**
 * Clear ad registry (useful for testing or forced refresh)
 */
export function resetAdRegistry() {
  adRegistry.clear();
}
