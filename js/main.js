import { TaskDB } from './db.js';
import { Graphics } from './graphics.js';
import { UI } from './ui.js';

// Application entry point
window.addEventListener('DOMContentLoaded', async () => {
  const progressFill = document.getElementById('portal-progress');
  const loadingSubtitle = document.querySelector('.portal-subtitle');
  const loadingScreen = document.getElementById('loading-portal');

  // Callback to update progress in loading overlay
  const updateProgress = (percentage) => {
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    if (loadingSubtitle) {
      if (percentage < 50) {
        loadingSubtitle.textContent = 'Loading Quantum Core WASM...';
      } else if (percentage < 80) {
        loadingSubtitle.textContent = 'Restoring SQLite Matrices...';
      } else if (percentage < 100) {
        loadingSubtitle.textContent = 'Synthesizing 3D Dimensions...';
      } else {
        loadingSubtitle.textContent = 'Decryption Complete.';
      }
    }
  };

  try {
    // 1. Initialize SQLite database & load persisted data
    await TaskDB.init(updateProgress);
    
    // 2. Initialize Three.js Graphics Engine
    const webglContainer = document.getElementById('canvas-container');
    const css3dContainer = document.getElementById('css3d-container');
    Graphics.init(webglContainer, css3dContainer);

    // 3. Initialize UI handlers & triggers
    UI.init();

    // 4. Render initial board layout
    UI.renderBoard();

    // 5. Fade out and remove loading screen
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        // Clean up DOM after transition
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 1000);
      }
    }, 500);

  } catch (error) {
    console.error('Core engine boot failure:', error);
    if (loadingSubtitle) {
      loadingSubtitle.innerHTML = '<span style="color: var(--neon-magenta)">Quantum Boot Failure! Please check console.</span>';
    }
    if (progressFill) {
      progressFill.style.backgroundColor = 'var(--neon-magenta)';
      progressFill.style.boxShadow = 'var(--glow-shadow-magenta)';
    }
  }
});
