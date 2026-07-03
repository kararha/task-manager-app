// Database persistence configuration
const IDB_NAME = 'AetherFlowDB';
const IDB_STORE = 'sqlite-store';
const IDB_KEY = 'aetherflow-database';

let db = null;
let SQL = null;
let saveTimeout = null;

// IndexedDB Helper Functions
function saveToIndexedDB(binaryData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = (e) => {
      const idb = e.target.result;
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const putReq = store.put(binaryData, IDB_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function loadFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = (e) => {
      const idb = e.target.result;
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(IDB_KEY);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Debounced Autosave (saves 1.5s after database is modified)
function triggerAutosave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  // Set UI visual state to synchronizing
  const syncDot = document.querySelector('.sqlite-dot');
  const syncText = document.querySelector('.sqlite-text');
  if (syncDot) {
    syncDot.style.backgroundColor = 'var(--neon-cyan)';
    syncDot.style.boxShadow = 'var(--glow-shadow-cyan)';
  }
  if (syncText) {
    syncText.textContent = 'Syncing Matrix Data...';
  }

  saveTimeout = setTimeout(async () => {
    try {
      const binaryData = db.export();
      await saveToIndexedDB(binaryData);
      
      // Update UI visual state to synchronized
      if (syncDot) {
        syncDot.style.backgroundColor = 'var(--neon-green)';
        syncDot.style.boxShadow = '0 0 8px var(--neon-green)';
      }
      if (syncText) {
        syncText.textContent = 'SQLite DB Synchronized';
      }
    } catch (err) {
      console.error('Failed to autosave SQLite database:', err);
      if (syncDot) {
        syncDot.style.backgroundColor = 'var(--neon-magenta)';
        syncDot.style.boxShadow = 'var(--glow-shadow-magenta)';
      }
      if (syncText) {
        syncText.textContent = 'Autosave Sync Failed!';
      }
    }
  }, 1200);
}

// Database Engine API
export const TaskDB = {
  // Initialize Database
  init: async (progressCallback) => {
    if (progressCallback) progressCallback(20);
    
    // 1. Initialize sql.js WASM
    SQL = await initSqlJs({
      locateFile: filename => `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${filename}`
    });
    if (progressCallback) progressCallback(50);

    // 2. Try loading from IndexedDB
    try {
      const binaryData = await loadFromIndexedDB();
      if (progressCallback) progressCallback(80);
      
      if (binaryData && binaryData.length > 0) {
        db = new SQL.Database(binaryData);
      } else {
        // Create fresh database
        db = new SQL.Database();
        db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'todo',
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        // Seed default items
        db.run(`
          INSERT INTO tasks (title, description, status, priority, due_date, tags) VALUES
          ('Explore AetherFlow 3D space', 'Use your mouse to rotate and fly through the 3D grid. Try clicking on cards to view details or drag-and-drop between columns.', 'todo', 'high', '${new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}', 'demo,tutorial'),
          ('Create a new task node', 'Click the "⚡ NEW TASK" button in the header overlay to spawn a new frosted-glass card in 3D.', 'todo', 'medium', '${new Date().toISOString().split('T')[0]}', 'feature'),
          ('Import and Export Database', 'Try exporting your SQLite database file via the EXPORT button, then import it back. Safe, backendless local data!', 'in_progress', 'medium', '', 'sqlite,local'),
          ('Complete an objective', 'Click the Checkmark icon (✓) on a task card. Experience the celebration particle blast!', 'done', 'low', '', 'fun,gamified')
        `);
        // Save initial state
        const initialBinary = db.export();
        await saveToIndexedDB(initialBinary);
      }
    } catch (err) {
      console.error('Error loading database, setting up fallback in-memory DB:', err);
      db = new SQL.Database();
    }
    
    if (progressCallback) progressCallback(100);
    return db;
  },

  // Get Tasks with Search/Filters
  getTasks: (filters = {}) => {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    let params = {};

    if (filters.search) {
      query += ' AND (title LIKE :search OR description LIKE :search OR tags LIKE :search)';
      params[':search'] = `%${filters.search}%`;
    }
    if (filters.priority && filters.priority !== 'all') {
      query += ' AND priority = :priority';
      params[':priority'] = filters.priority;
    }
    if (filters.tag && filters.tag !== 'all') {
      query += ' AND tags LIKE :tag';
      params[':tag'] = `%${filters.tag}%`;
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const tasks = [];
    while (stmt.step()) {
      tasks.push(stmt.getAsObject());
    }
    stmt.free();
    return tasks;
  },

  // Add Task
  addTask: (task) => {
    const query = `
      INSERT INTO tasks (title, description, status, priority, due_date, tags)
      VALUES (:title, :description, :status, :priority, :due_date, :tags)
    `;
    db.run(query, {
      ':title': task.title,
      ':description': task.description || '',
      ':status': task.status || 'todo',
      ':priority': task.priority || 'medium',
      ':due_date': task.due_date || '',
      ':tags': task.tags || ''
    });
    triggerAutosave();
    return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  },

  // Update Task Status
  updateTaskStatus: (id, status) => {
    db.run('UPDATE tasks SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id', {
      ':status': status,
      ':id': id
    });
    triggerAutosave();
  },

  // Update Full Task
  updateTask: (id, task) => {
    db.run(`
      UPDATE tasks 
      SET title = :title, 
          description = :description, 
          status = :status, 
          priority = :priority, 
          due_date = :due_date, 
          tags = :tags,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = :id
    `, {
      ':title': task.title,
      ':description': task.description || '',
      ':status': task.status || 'todo',
      ':priority': task.priority || 'medium',
      ':due_date': task.due_date || '',
      ':tags': task.tags || '',
      ':id': id
    });
    triggerAutosave();
  },

  // Delete Task
  deleteTask: (id) => {
    db.run('DELETE FROM tasks WHERE id = :id', { ':id': id });
    triggerAutosave();
  },

  // Get Analytics Statistics
  getStats: () => {
    const res = db.exec(`
      SELECT 
        COUNT(*) as total,
        SUM(case when status = 'todo' or status = 'in_progress' then 1 else 0 end) as pending,
        SUM(case when status = 'done' then 1 else 0 end) as completed
      FROM tasks
    `)[0].values[0];

    const total = res[0] || 0;
    const pending = res[1] || 0;
    const completed = res[2] || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, completed, rate };
  },

  // Retrieve All Distinct Tags
  getTags: () => {
    const stmt = db.prepare('SELECT DISTINCT tags FROM tasks WHERE tags IS NOT NULL AND tags != ""');
    const tagsSet = new Set();
    while (stmt.step()) {
      const row = stmt.getAsObject();
      row.tags.split(',').forEach(tag => {
        const clean = tag.trim().toLowerCase();
        if (clean) tagsSet.add(clean);
      });
    }
    stmt.free();
    return Array.from(tagsSet).sort();
  },

  // Export DB binary
  exportDB: () => {
    return db.export(); // Returns Uint8Array
  },

  // Import DB binary
  importDB: async (arrayBuffer) => {
    const u8Array = new Uint8Array(arrayBuffer);
    db = new SQL.Database(u8Array);
    await saveToIndexedDB(u8Array);
    return db;
  }
};
