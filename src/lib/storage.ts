const DB_NAME = 'qa-helper-db';
const DB_VERSION = 1;
const STORE_NAME = 'database';
const DB_KEY = 'app-state';

export interface StorageProvider {
  save(data: Uint8Array): Promise<void>;
  load(): Promise<Uint8Array | null>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
}

export class IndexedDBStorage implements StorageProvider {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initDatabase();
    return this.initPromise;
  }

  private initDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onclose = () => { this.db = null; };
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async save(data: Uint8Array): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(data, DB_KEY);

      request.onerror = () => reject(new Error('Failed to save to IndexedDB'));
      request.onsuccess = () => resolve();
    });
  }

  async load(): Promise<Uint8Array | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(DB_KEY);

        request.onerror = () => reject(new Error('Failed to load from IndexedDB'));
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(DB_KEY);

        request.onerror = () => reject(new Error('Failed to clear IndexedDB'));
        request.onsuccess = () => resolve();
      });
    } catch { /* IndexedDB clear failed, log and continue */ }
  }

  async getSize(): Promise<number> {
    const data = await this.load();
    return data ? data.byteLength : 0;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export class LocalStorageFallback implements StorageProvider {
  private readonly maxSize = 5 * 1024 * 1024;

  async save(data: Uint8Array): Promise<void> {
    const estimatedSize = data.length * 1.37;
    if (estimatedSize > this.maxSize) {
      throw new Error(`Data too large: ${estimatedSize} bytes (max: ${this.maxSize})`);
    }

    let binary = '';
    const len = data.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    localStorage.setItem(DB_KEY, btoa(binary));
  }

  async load(): Promise<Uint8Array | null> {
    const saved = localStorage.getItem(DB_KEY);
    if (!saved) return null;
    
    try {
      const binary = atob(saved);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(DB_KEY);
  }

  async getSize(): Promise<number> {
    const data = localStorage.getItem(DB_KEY);
    return data ? data.length : 0;
  }
}

export async function createStorageProvider(): Promise<StorageProvider> {
  if (typeof indexedDB === 'undefined') {
    console.warn('IndexedDB not available, using localStorage fallback');
    return new LocalStorageFallback();
  }

  try {
    const testDb = indexedDB.open('qa-helper-test', 1);
    return new Promise((resolve) => {
      testDb.onsuccess = () => {
        indexedDB.deleteDatabase('qa-helper-test');
        resolve(new IndexedDBStorage());
      };
      testDb.onerror = () => {
        console.warn('IndexedDB test failed, using localStorage fallback');
        resolve(new LocalStorageFallback());
      };
    });
  } catch {
    return new LocalStorageFallback();
  }
}
