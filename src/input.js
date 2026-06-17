import { state } from './state.js';
import { executeJump } from './player.js';
import { returnToTitle, submitScore } from './ui.js';
import { TILE_SIZE, levels } from './constants.js';
import { checkAABB, loadLevel } from './level.js';

// We need a way to trigger game start and demo from main.js, so we export a function or hook
let onStartGame, onStartDemo, onTriggerAppInterrupt;

export function setInputCallbacks(startGameCb, startDemoCb, triggerAppInterruptCb) {
    onStartGame = startGameCb;
    onStartDemo = startDemoCb;
    onTriggerAppInterrupt = triggerAppInterruptCb;
}

export function setupInput() {
    document.getElementById('startBtn').addEventListener('click', (e) => { e.stopPropagation(); onStartGame(); });

    if (import.meta.env.DEV) {
        window.addEventListener('keydown', (e) => {
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && e.code.startsWith('Digit')) {
                let lvl = num === 0 ? 10 : num;
                if (lvl <= levels.length) {
                    if (state.appState !== 'PLAYING') {
                        onStartGame();
                    }
                    state.currentLevelIdx = lvl - 1;
                    loadLevel(state.currentLevelIdx);
                }
            }
        });
    }
    
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && state.appState === 'TITLE') {
            e.stopImmediatePropagation();
            onStartGame();
            return;
        }
        onTriggerAppInterrupt();
    });
    window.addEventListener('touchstart', () => onTriggerAppInterrupt());
    window.addEventListener('mousedown', () => onTriggerAppInterrupt());
    window.addEventListener('mousemove', () => state.idleTimestamp = Date.now());

    const nameInput = document.getElementById('nameInput');
    nameInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') submitScore(); });

    const btnL = document.getElementById('btnLeft');
    const btnR = document.getElementById('btnRight');
    const btnJ = document.getElementById('jumpBtn');

    const bindInput = (el, key, val) => {
        const startAction = (e) => {
            e.preventDefault(); 
            if(state.appState !== 'PLAYING') return; 
            state.input[key] = val; 
            if(key==='jump' && state.player.isGrounded) state.player.isCharging = true; 
        };
        const endAction = (e) => {
            e.preventDefault(); 
            if(state.appState !== 'PLAYING') return; 
            state.input[key] = !val; 
            if(key==='jump') executeJump(); 
        };
        el.addEventListener('touchstart', startAction);
        el.addEventListener('mousedown', startAction);
        el.addEventListener('touchend', endAction);
        el.addEventListener('mouseup', endAction);
        el.addEventListener('mouseleave', (e) => {
            if(state.input[key] === val) endAction(e);
        });
    };
    bindInput(btnL, 'left', true); 
    bindInput(btnR, 'right', true); 
    bindInput(btnJ, 'jump', true);

    window.addEventListener('keydown', (e) => {
        if (state.appState !== 'PLAYING') return;
        if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.input.left = true;
        if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.input.right = true;
        if (e.code === 'Space' && !state.input.jump) { 
            state.input.jump = true; 
            if (state.player.isGrounded) state.player.isCharging = true; 
        }
    });
    window.addEventListener('keyup', (e) => {
        if (state.appState !== 'PLAYING') return;
        if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.input.left = false;
        if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.input.right = false;
        if (e.code === 'Space') { 
            if (state.input.jump) executeJump();
            state.input.jump = false; 
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
