import { state } from './state.js';
import { executeJump } from './player.js';
import { returnToTitle, submitScore } from './ui.js';
import { TILE_SIZE } from './constants.js';
import { checkAABB } from './level.js';

// We need a way to trigger game start and demo from main.js, so we export a function or hook
let onStartGame, onStartDemo, onTriggerAppInterrupt;

export function setInputCallbacks(startGameCb, startDemoCb, triggerAppInterruptCb) {
    onStartGame = startGameCb;
    onStartDemo = startDemoCb;
    onTriggerAppInterrupt = triggerAppInterruptCb;
}

export function setupInput() {
    document.getElementById('startBtn').addEventListener('click', (e) => { e.stopPropagation(); onStartGame(); });
    
    window.addEventListener('keydown', () => onTriggerAppInterrupt());
    window.addEventListener('touchstart', () => onTriggerAppInterrupt());
    window.addEventListener('mousedown', () => onTriggerAppInterrupt());
    window.addEventListener('mousemove', () => state.idleTimestamp = Date.now());

    const nameInput = document.getElementById('nameInput');
    nameInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') submitScore(); });

    const btnL = document.getElementById('btnLeft');
    const btnR = document.getElementById('btnRight');
    const btnJ = document.getElementById('jumpBtn');

    const bindTouch = (el, key, val) => {
        el.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            if(state.appState !== 'PLAYING') return; 
            state.input[key] = val; 
            if(key==='jump' && state.player.isGrounded) state.player.isCharging = true; 
        });
        el.addEventListener('touchend', (e) => { 
            e.preventDefault(); 
            if(state.appState !== 'PLAYING') return; 
            state.input[key] = !val; 
            if(key==='jump') executeJump(); 
        });
    };
    bindTouch(btnL, 'left', true); 
    bindTouch(btnR, 'right', true); 
    bindTouch(btnJ, 'jump', true);

    window.addEventListener('keydown', (e) => {
        if (state.appState !== 'PLAYING') return;
        if (e.code === 'ArrowLeft') state.input.left = true;
        if (e.code === 'ArrowRight') state.input.right = true;
        if (e.code === 'Space' && !state.input.jump) { 
            state.input.jump = true; 
            if (state.player.isGrounded) state.player.isCharging = true; 
        }
    });
    window.addEventListener('keyup', (e) => {
        if (state.appState !== 'PLAYING') return;
        if (e.code === 'ArrowLeft') state.input.left = false;
        if (e.code === 'ArrowRight') state.input.right = false;
        if (e.code === 'Space') { 
            state.input.jump = false; 
            executeJump(); 
        }
    });
}

export function updateDemoAI(dt) {
    state.demoWatchdog -= dt;
    if (state.demoWatchdog <= 0) { returnToTitle(); return; }
    if (state.player.state !== 'idle') return;

    const dirX = state.goalBox ? Math.sign(state.goalBox.x - state.player.x) : 1;
    
    if (!state.player.isCharging) {
        state.input.left = dirX < 0;
        state.input.right = dirX > 0;
    }

    const probeDist = TILE_SIZE * 1.5;
    const px = state.player.x + (dirX * probeDist);
    const pyF = state.player.y - TILE_SIZE; 
    const pyW = state.player.y + 0.5;

    let gap = true, wall = false;
    for(let b of state.blocks) {
        if(!b.active) continue;
        if(checkAABB({x: px, y: pyF, w: 1, h: 1}, b)) gap = false;
        if(checkAABB({x: px, y: pyW, w: 1, h: 1}, b)) wall = true;
    }

    if ((gap || wall) && state.player.isGrounded && !state.player.isCharging) {
        state.input.left = state.input.right = false;
        state.input.jump = true;
        state.player.isCharging = true;
    }

    if (state.player.isCharging) {
        const targetCharge = wall ? 14 : 8;
        if (state.player.chargeAmount > targetCharge) {
            state.input.jump = false;
            executeJump();
            state.input.left = dirX < 0;
            state.input.right = dirX > 0;
        }
    }
}
