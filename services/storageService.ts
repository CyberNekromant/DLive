import { Pet, Task } from '../types';

const DB_NAME = 'DLiveDB';
const DB_VERSION = 1;
const STORE_PETS = 'pets';
const STORE_TASKS = 'tasks';

// Preferences stay in LocalStorage for instant sync access (prevents UI flickering)
const THEME_KEY = 'dlive_theme';
const NOTIFICATIONS_KEY = 'dlive_notifications';

// --- IndexedDB Helper ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PETS)) {
        db.createObjectStore(STORE_PETS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
      }
    };
  });
};

export const StorageService = {
  // --- Async Data Methods (IndexedDB) ---

  getPets: async (): Promise<Pet[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PETS, 'readonly');
        const store = transaction.objectStore(STORE_PETS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Error getting pets", e);
      return [];
    }
  },

  savePet: async (pet: Pet): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PETS, 'readwrite');
      const store = transaction.objectStore(STORE_PETS);
      const request = store.put(pet);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  deletePet: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PETS, STORE_TASKS], 'readwrite');
      
      // Delete the pet
      const petStore = transaction.objectStore(STORE_PETS);
      petStore.delete(id);

      // Delete associated tasks manually (since IDB doesn't have cascade delete)
      const taskStore = transaction.objectStore(STORE_TASKS);
      const taskRequest = taskStore.openCursor();
      
      taskRequest.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const task = cursor.value as Task;
          if (task.petId === id) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  getTasks: async (): Promise<Task[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_TASKS, 'readonly');
        const store = transaction.objectStore(STORE_TASKS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("Error getting tasks", e);
      return [];
    }
  },

  saveTask: async (task: Task): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, 'readwrite');
      const store = transaction.objectStore(STORE_TASKS);
      const request = store.put(task);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  deleteTask: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, 'readwrite');
      const store = transaction.objectStore(STORE_TASKS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  completeTask: async (taskId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, 'readwrite');
      const store = transaction.objectStore(STORE_TASKS);
      
      const getRequest = store.get(taskId);
      getRequest.onsuccess = () => {
        const task = getRequest.result as Task;
        if (task) {
          const now = new Date();
          task.lastDoneDate = now.toISOString();
          
          const nextDue = new Date(now);
          nextDue.setDate(now.getDate() + task.frequencyDays);
          task.nextDueDate = nextDue.toISOString();

          store.put(task);
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  clearAllData: async (): Promise<void> => {
     // Clear IDB
     const db = await openDB();
     const t = db.transaction([STORE_PETS, STORE_TASKS], 'readwrite');
     t.objectStore(STORE_PETS).clear();
     t.objectStore(STORE_TASKS).clear();
     
     // Clear preferences
     localStorage.removeItem(THEME_KEY);
     localStorage.removeItem(NOTIFICATIONS_KEY);
     
     return new Promise((resolve) => {
        t.oncomplete = () => resolve();
     });
  },

  // --- Sync Methods (LocalStorage for Preferences) ---

  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  },

  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_KEY, theme);
  },

  getNotificationSettings: (): boolean => {
    return localStorage.getItem(NOTIFICATIONS_KEY) === 'true';
  },

  saveNotificationSettings: (enabled: boolean) => {
    localStorage.setItem(NOTIFICATIONS_KEY, String(enabled));
  }
};
