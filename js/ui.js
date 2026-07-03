import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { Graphics } from './graphics.js';
import { TaskDB } from './db.js';

// Sound Synth Engine (pure client-side Web Audio API)
export const AudioSynth = {
  ctx: null,
  enabled: true,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  
  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
      if (this.enabled) {
        btn.classList.add('active');
        btn.innerHTML = '<i data-lucide="volume-2" class="icon-hud"></i> ON';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i data-lucide="volume-x" class="icon-hud"></i> OFF';
      }
      if (window.lucide) window.lucide.createIcons();
    }
  },
  
  playClick() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  },
  
  playMove() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },
  
  playChime() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const playNote = (freq, delay, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };
    
    // Cyber Arpeggio: C5 -> E5 -> G5 -> C6
    playNote(523.25, 0, 0.3);
    playNote(659.25, 0.06, 0.3);
    playNote(783.99, 0.12, 0.4);
    playNote(1046.50, 0.18, 0.5);
  },
  
  playDelete() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.18);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }
};

// UI State variables
let activeFilters = { search: '', priority: 'all', tag: 'all' };
let renderedObjects = [];
let dragInfo = {
  isDragging: false,
  objectId: null,
  css3dObject: null,
  offset: new THREE.Vector3(),
  initialPosition: new THREE.Vector3(),
  originalStatus: ''
};
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Flat drag plane

// Column layouts
const COLUMNS = {
  todo: { x: -350, name: 'To Do Matrix', class: 'todo-header' },
  in_progress: { x: 0, name: 'Processing Node', class: 'progress-header' },
  done: { x: 350, name: 'Terminated Nodes', class: 'done-header' }
};

export const UI = {
  // Bind HUD Event listeners
  init: () => {
    // 1. Search Bar
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      activeFilters.search = e.target.value;
      UI.renderBoard();
    });

    // 2. Filters
    document.getElementById('priority-filter').addEventListener('change', (e) => {
      activeFilters.priority = e.target.value;
      UI.renderBoard();
    });

    document.getElementById('tag-filter').addEventListener('change', (e) => {
      activeFilters.tag = e.target.value;
      UI.renderBoard();
    });

    // 3. Audio toggle
    document.getElementById('btn-audio-toggle').addEventListener('click', () => {
      AudioSynth.toggle();
      AudioSynth.playClick();
    });

    // 4. Modal Triggers
    document.getElementById('btn-create-task').addEventListener('click', () => {
      AudioSynth.playClick();
      openTaskModal();
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
      AudioSynth.playClick();
      closeTaskModal();
    });

    document.getElementById('btn-cancel-modal').addEventListener('click', () => {
      AudioSynth.playClick();
      closeTaskModal();
    });

    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);

    // 5. Camera focus preset clicks
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        AudioSynth.playClick();
        
        // Remove active class
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const preset = e.target.dataset.preset;
        Graphics.focusCamera(preset);
      });
    });

    // Auto-Rotate toggle
    document.getElementById('chk-auto-rotate').addEventListener('change', (e) => {
      AudioSynth.playClick();
      Graphics.getControls().autoRotate = e.target.checked;
      Graphics.getControls().autoRotateSpeed = 1.0;
    });

    // Themes
    document.querySelectorAll('.btn-theme-dot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        AudioSynth.playClick();
        document.querySelectorAll('.btn-theme-dot').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const theme = e.target.dataset.theme;
        document.body.className = ''; // Reset classes
        document.body.classList.add(`theme-${theme}`);
        Graphics.setTheme(theme);
      });
    });

    // 6. DB Export / Import
    document.getElementById('btn-export-db').addEventListener('click', () => {
      AudioSynth.playClick();
      const binary = TaskDB.exportDB();
      const blob = new Blob([binary], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aetherflow-database.db';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });

    const fileInput = document.getElementById('file-import-input');
    document.getElementById('btn-import-db').addEventListener('click', () => {
      AudioSynth.playClick();
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          await TaskDB.importDB(evt.target.result);
          AudioSynth.playChime();
          UI.populateTagFilter();
          UI.renderBoard();
        } catch (err) {
          console.error(err);
          alert('Failed to parse database file. Make sure it is a valid SQLite DB.');
        }
      };
      reader.readAsArrayBuffer(file);
    });

    // 7. Global Mouse drag events for 3D card movement
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    
    // Initial tag populate
    UI.populateTagFilter();
  },

  // Populate drop-down filter list of tags
  populateTagFilter: () => {
    const filter = document.getElementById('tag-filter');
    const prevVal = filter.value;
    
    // Clear other options
    filter.innerHTML = '<option value="all">All Tags</option>';
    
    const tags = TaskDB.getTags();
    tags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = `#${tag}`;
      filter.appendChild(option);
    });

    // Preserve selection if it still exists
    if (tags.includes(prevVal)) {
      filter.value = prevVal;
    } else {
      activeFilters.tag = 'all';
    }
  },

  // Redraw board in 3D Space
  renderBoard: () => {
    const scene = Graphics.getScene();
    
    // 1. Clear existing rendered 3D objects
    renderedObjects.forEach(obj => {
      scene.remove(obj);
    });
    renderedObjects = [];

    // 2. Fetch Tasks from SQLite matching search & filters
    const tasks = TaskDB.getTasks(activeFilters);
    
    // 3. Update HUD stats numbers
    const stats = TaskDB.getStats();
    document.getElementById('pending-count').textContent = stats.pending;
    document.getElementById('completed-count').textContent = stats.completed;
    document.getElementById('completion-pct').textContent = `${stats.rate}%`;
    
    // Update progress ring circular stroke dashoffset
    const circle = document.getElementById('completion-circle');
    if (circle) {
      const radius = circle.r.baseVal.value;
      const circumference = 2 * Math.PI * radius; // 100.53
      const offset = circumference - (stats.rate / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    // Update WebGL Bar Charts target heights
    const counts = { todo: 0, in_progress: 0, done: 0 };
    TaskDB.getTasks().forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    Graphics.update3DCharts(counts.todo, counts.in_progress, counts.done);

    // 4. Render Column 3D header labels
    for (let key in COLUMNS) {
      const col = COLUMNS[key];
      const div = document.createElement('div');
      div.className = `column-label-element ${col.class}`;
      div.textContent = col.name;

      const obj = new CSS3DObject(div);
      obj.position.set(col.x, 260, 0); // Position at top of columns
      scene.add(obj);
      renderedObjects.push(obj);
    }

    // 5. Position Task Cards in stacks
    const stackOffsets = { todo: 200, in_progress: 200, done: 200 };
    const stackCounter = { todo: 0, in_progress: 0, done: 0 };

    tasks.forEach(task => {
      const colKey = task.status;
      if (COLUMNS[colKey]) {
        const col = COLUMNS[colKey];
        const cardDOM = createCardDOM(task);
        
        const obj = new CSS3DObject(cardDOM);
        
        // Stack cards downwards in Y, add small Z-offset (depth) to avoid overlapping z-fighting
        const idx = stackCounter[colKey];
        const posX = col.x;
        const posY = stackOffsets[colKey];
        const posZ = idx * 2.5; // Back-to-front stack order

        obj.position.set(posX, posY, posZ);
        
        // Add subtle rotation variation for an organic, tactile appearance
        const seed = task.id * 333;
        obj.rotation.z = (Math.sin(seed) * 0.04);
        obj.rotation.y = (Math.cos(seed) * 0.04);

        // Store database model details in Three.js object userData
        obj.userData = { 
          id: task.id, 
          status: task.status, 
          posX: posX,
          posY: posY,
          posZ: posZ
        };

        // Attach dragging listener on card header/body drag handle
        cardDOM.addEventListener('pointerdown', (e) => {
          // Avoid drag activation if clicking action buttons or links
          if (e.target.closest('.btn-card-action') || e.target.closest('.card-tag')) return;
          
          e.preventDefault();
          onPointerDown(e, task.id, obj);
        });

        scene.add(obj);
        renderedObjects.push(obj);

        // Advance stack offsets downward
        stackOffsets[colKey] -= 185;
        stackCounter[colKey]++;
      }
    });

    // Update Lucide SVG icons loaded dynamically inside the cards
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

// Create a Single Task Card DOM element
function createCardDOM(task) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority}`;
  card.setAttribute('data-id', task.id);

  // Check if due date is overdue
  let isOverdue = false;
  let dateText = '';
  if (task.due_date) {
    dateText = task.due_date;
    if (task.status !== 'done') {
      const today = new Date().toISOString().split('T')[0];
      if (task.due_date < today) {
        isOverdue = true;
      }
    }
  }

  // Tags assembly
  let tagsHTML = '';
  if (task.tags) {
    task.tags.split(',').forEach(tag => {
      const clean = tag.trim();
      if (clean) tagsHTML += `<span class="card-tag">#${clean}</span>`;
    });
  }

  // Action buttons depending on state
  const leftMoveBtn = task.status !== 'todo' 
    ? `<button class="btn-card-action btn-move-left" title="Shift Back"><i data-lucide="arrow-left" class="icon-card"></i></button>` 
    : '';
  const rightMoveBtn = task.status !== 'done' 
    ? `<button class="btn-card-action btn-move-right" title="Shift Forward"><i data-lucide="arrow-right" class="icon-card"></i></button>` 
    : '';
  const completeBtn = task.status !== 'done' 
    ? `<button class="btn-card-action btn-complete" title="Terminate Task"><i data-lucide="check" class="icon-card"></i></button>` 
    : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHTML(task.title)}</div>
      <span class="card-priority-badge">${task.priority}</span>
    </div>
    <div class="card-body">
      ${escapeHTML(task.description) || '<span class="text-muted">No description provided</span>'}
    </div>
    <div class="card-footer">
      <div class="card-meta-row">
        <div class="card-date-badge ${isOverdue ? 'overdue' : ''}">
          ${dateText ? `<i data-lucide="calendar" class="icon-card"></i> ${dateText} ${isOverdue ? '(OVERDUE)' : ''}` : ''}
        </div>
        <div class="card-tags">${tagsHTML}</div>
      </div>
      <div class="card-actions">
        <div class="card-action-group">
          ${leftMoveBtn}
          ${rightMoveBtn}
          ${completeBtn}
        </div>
        <div class="card-action-group">
          <button class="btn-card-action btn-edit" title="Edit Node"><i data-lucide="pencil" class="icon-card"></i></button>
          <button class="btn-card-action btn-delete" title="Deconstruct Node"><i data-lucide="trash-2" class="icon-card"></i></button>
        </div>
      </div>
    </div>
  `;

  // Bind Actions Events
  const completeButton = card.querySelector('.btn-complete');
  if (completeButton) {
    completeButton.addEventListener('click', () => {
      // Find card's 3D object to run explosion
      const cardObj = renderedObjects.find(obj => obj.userData.id === task.id);
      if (cardObj) {
        Graphics.triggerCelebration(cardObj.position);
      }
      AudioSynth.playChime();
      TaskDB.updateTaskStatus(task.id, 'done');
      UI.renderBoard();
    });
  }

  const deleteButton = card.querySelector('.btn-delete');
  if (deleteButton) {
    deleteButton.addEventListener('click', () => {
      AudioSynth.playDelete();
      TaskDB.deleteTask(task.id);
      UI.populateTagFilter();
      UI.renderBoard();
    });
  }

  const editButton = card.querySelector('.btn-edit');
  if (editButton) {
    editButton.addEventListener('click', () => {
      AudioSynth.playClick();
      openTaskModal(task);
    });
  }

  const moveLeftButton = card.querySelector('.btn-move-left');
  if (moveLeftButton) {
    moveLeftButton.addEventListener('click', () => {
      AudioSynth.playMove();
      const prevStatus = task.status === 'done' ? 'in_progress' : 'todo';
      TaskDB.updateTaskStatus(task.id, prevStatus);
      UI.renderBoard();
    });
  }

  const moveRightButton = card.querySelector('.btn-move-right');
  if (moveRightButton) {
    moveRightButton.addEventListener('click', () => {
      const nextStatus = task.status === 'todo' ? 'in_progress' : 'done';
      if (nextStatus === 'done') {
        const cardObj = renderedObjects.find(obj => obj.userData.id === task.id);
        if (cardObj) Graphics.triggerCelebration(cardObj.position);
        AudioSynth.playChime();
      } else {
        AudioSynth.playMove();
      }
      TaskDB.updateTaskStatus(task.id, nextStatus);
      UI.renderBoard();
    });
  }

  // Hover animations in 3D: shift card slightly forward in Z
  card.addEventListener('mouseenter', () => {
    const cardObj = renderedObjects.find(obj => obj.userData.id === task.id);
    if (cardObj && !dragInfo.isDragging) {
      cardObj.position.z = cardObj.userData.posZ + 30; // Float forward
      card.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    }
  });

  card.addEventListener('mouseleave', () => {
    const cardObj = renderedObjects.find(obj => obj.userData.id === task.id);
    if (cardObj && (!dragInfo.isDragging || dragInfo.objectId !== task.id)) {
      cardObj.position.z = cardObj.userData.posZ; // Snap back
      card.style.borderColor = '';
    }
  });

  // Trigger Lucide to render icons inside this card DOM node
  if (window.lucide) {
    window.lucide.createIcons({
      root: card
    });
  }

  return card;
}

// Drag and drop event handlers
function onPointerDown(event, id, css3dObject) {
  dragInfo.isDragging = true;
  dragInfo.objectId = id;
  dragInfo.css3dObject = css3dObject;
  dragInfo.originalStatus = css3dObject.userData.status;
  dragInfo.initialPosition.copy(css3dObject.position);

  // Disable orbit controls while dragging cards
  Graphics.getControls().enabled = false;

  // Calculate mouse offset
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, Graphics.getCamera());
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, intersection);
  
  dragInfo.offset.copy(css3dObject.position).sub(intersection);
}

function onPointerMove(event) {
  if (!dragInfo.isDragging || !dragInfo.css3dObject) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, Graphics.getCamera());
  const intersection = new THREE.Vector3();
  
  if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
    // Apply coordinates to object
    const targetX = intersection.x + dragInfo.offset.x;
    const targetY = intersection.y + dragInfo.offset.y;
    
    dragInfo.css3dObject.position.set(targetX, targetY, 40); // Keep raised during drag
    
    // Highlight nearest column in real-time
    let nearest = 'todo';
    let minDist = Infinity;
    for (let key in COLUMNS) {
      const dist = Math.abs(targetX - COLUMNS[key].x);
      if (dist < minDist) {
        minDist = dist;
        nearest = key;
      }
    }
  }
}

function onPointerUp(event) {
  if (!dragInfo.isDragging || !dragInfo.css3dObject) return;

  const cardX = dragInfo.css3dObject.position.x;
  
  // Find which column is closest to drop coordinates
  let finalStatus = 'todo';
  let minDistance = Infinity;
  for (let key in COLUMNS) {
    const distance = Math.abs(cardX - COLUMNS[key].x);
    if (distance < minDistance) {
      minDistance = distance;
      finalStatus = key;
    }
  }

  // Update DB and play audio if status changed
  if (finalStatus !== dragInfo.originalStatus) {
    if (finalStatus === 'done') {
      Graphics.triggerCelebration(dragInfo.css3dObject.position);
      AudioSynth.playChime();
    } else {
      AudioSynth.playMove();
    }
    TaskDB.updateTaskStatus(dragInfo.objectId, finalStatus);
  } else {
    // Just click/touch without moving column
    AudioSynth.playClick();
  }

  // Reset drag state
  dragInfo.isDragging = false;
  dragInfo.objectId = null;
  dragInfo.css3dObject = null;
  
  // Re-enable orbit controls
  Graphics.getControls().enabled = true;

  // Redraw stacks cleanly
  UI.renderBoard();
}

// Modal handling
function openTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('task-form');

  form.reset();

  if (task) {
    title.textContent = 'Modify Task Node';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-date').value = task.due_date || '';
    document.getElementById('task-tags').value = task.tags || '';
  } else {
    title.textContent = 'Initialize Task Node';
    document.getElementById('task-id').value = '';
    // Select column status if focusing a specific view
    document.getElementById('task-status').value = 'todo';
    document.getElementById('task-priority').value = 'medium';
  }

  modal.classList.add('active');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
}

function handleTaskSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('task-id').value;
  const task = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value,
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    due_date: document.getElementById('task-date').value,
    tags: document.getElementById('task-tags').value
  };

  if (id) {
    // Update existing task
    TaskDB.updateTask(parseInt(id), task);
    AudioSynth.playChime();
  } else {
    // Add new task
    TaskDB.addTask(task);
    AudioSynth.playChime();
  }

  closeTaskModal();
  UI.populateTagFilter();
  UI.renderBoard();
}

// Helper to escape HTML tags to avoid XSS
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
