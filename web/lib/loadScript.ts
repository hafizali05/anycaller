const cache = new Map<string, Promise<void>>();

/** Lazily load a third-party script from a CDN, once. */
export function loadScript(src: string): Promise<void> {
  const existing = cache.get(src);
  if (existing) return existing;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
  cache.set(src, p);
  return p;
}
