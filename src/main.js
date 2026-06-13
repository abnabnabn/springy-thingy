import * as THREE from 'three';
import './style.css';
import { state } from './state.js';
import { IDLE_TIMEOUT_MS, levels, CHARGE_RATE, MAX_CHARGE_BONUS, MOVE_SPEED, GRAVITY, BASE_Z, BASE_FOV } from './constants.js';
import { initGraphics, scene, camera, renderer, titleGroup, updateTitleScene, updateParticles, emitParticles } from './graphics.js';
import { setupInput, setInputCallbacks, updateDemoAI } from './input.js';
import { loadLevel, checkAABB } from './level.js';
import { renderHighScoreTable, updateScore, triggerGameOver, returnToTitle } from './ui.js';
import { getPlayerAABB } from './player.js';

let clock;

window.onload = init;

function init() {
    initGraphics();
    renderHighScoreTable();
    setInputCallbacks(startGame, startDemo, triggerAppInterrupt);
    setupInput();

    clock = new THREE.Clock();
    requestAnimationFrame(gameLoop);
}

function triggerAppInterrupt() {
    state.idleTimestamp = Date.now();
    if (state.appState === 'DEMO') returnToTitle();
}

function startDemo() {
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('demoOverlay').style.display = 'block';
    if (titleGroup) titleGroup.visible = false;
    
    state.score = 0; 
    updateScore(0);
    state.currentLevelIdx = Math.floor(Math.random() * levels.length);
    loadLevel(state.currentLevelIdx);
    state.demoWatchdog = 20.0;
    state.appState = 'DEMO';
    state.input.left = state.input.right = state.input.jump = false;
}

function startGame() {
    state.idleTimestamp = Date.now();
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('uiLayer').style.display = 'flex';
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('demoOverlay').style.display = 'none';
    if (titleGroup) titleGroup.visible = false;
    
    state.score = 0; 
    updateScore(0);
    state.currentLevelIdx = 0;
    loadLevel(state.currentLevelIdx);
    state.appState = 'PLAYING';
    state.input.left = state.input.right = state.input.jump = false;
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    if (state.appState === 'TITLE') {
        updateTitleScene(time);
        if (Date.now() - state.idleTimestamp > IDLE_TIMEOUT_MS) startDemo();
    } else if (state.appState === 'PLAYING' || state.appState === 'DEMO' || state.appState === 'TRANSITION') {
        if (state.appState === 'DEMO') updateDemoAI(dt);
        
        if (state.player.state === 'idle') {
            updatePlayerPhysics(dt);
            updateDynamicEntities(dt);
        } else if (state.player.state === 'win') {
            state.goalBox.mesh.rotation.y += dt * 3;
            state.goalBox.mesh.rotation.x += dt * 3;
        } else if (state.player.state === 'dead') {
            state.player.mesh.position.y -= dt * 10;
            state.player.mesh.rotation.z += dt * 5;
        }
        updateCamera(dt);
    }
    
    updateParticles(dt);
    renderer.render(scene, camera);
}

function updatePlayerPhysics(dt) {
    if (state.player.isCharging) {
        state.player.vx = 0; 
        state.player.chargeAmount = Math.min(state.player.chargeAmount + CHARGE_RATE * dt, MAX_CHARGE_BONUS);
        const squash = 1 - (state.player.chargeAmount / MAX_CHARGE_BONUS) * 0.6;
        state.player.spring.scale.y = squash;
        state.player.spring.position.y = (1.2 * squash) / 2;
        state.player.head.position.y = 1.2 * squash + 0.4;
    } else {
        if (state.input.left) state.player.vx = -MOVE_SPEED;
        else if (state.input.right) state.player.vx = MOVE_SPEED;
        else state.player.vx = 0;
    }

    state.player.vy += GRAVITY * dt;

    let nextY = state.player.y + state.player.vy * dt;
    let aabbY = { x: state.player.x - state.player.width/2, y: nextY, w: state.player.width, h: state.player.height };
    
    state.player.isGrounded = false;
    for (let b of state.blocks) {
        if (!b.active) continue;
        if (checkAABB(aabbY, b)) {
            if (state.player.vy < 0) {
                nextY = b.y + b.h;
                state.player.vy = 0;
                state.player.isGrounded = true;
                if(b.type === 'dissolve' && b.life === 1.0) b.life = 0.99;
            } else if (state.player.vy > 0) {
                nextY = b.y - state.player.height;
                state.player.vy = 0;
            }
        }
    }
    state.player.y = nextY;

    let nextX = state.player.x + state.player.vx * dt;
    let aabbX = { x: nextX - state.player.width/2, y: state.player.y + 0.1, w: state.player.width, h: state.player.height - 0.2 };
    
    for (let b of state.blocks) {
        if (!b.active) continue;
        if (checkAABB(aabbX, b)) {
            if (state.player.vx > 0) nextX = b.x - state.player.width/2;
            else if (state.player.vx < 0) nextX = b.x + b.w + state.player.width/2;
            state.player.vx = 0;
        }
    }
    state.player.x = nextX;

    if (state.player.y < -15) triggerDeath();
    if (state.player.mesh) state.player.mesh.position.set(state.player.x, state.player.y, 0);

    if (state.goalBox && checkAABB(getPlayerAABB(), state.goalBox)) {
        state.player.state = 'win';
        
        if (state.appState === 'DEMO') {
            setTimeout(returnToTitle, 1000);
            return;
        }
        
        state.appState = 'TRANSITION';
        updateScore(1000);
        document.getElementById('overlayMsg').innerText = "LEVEL COMPLETE!";
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('messageOverlay').style.display = 'flex';
        emitParticles(state.player.x, state.player.y, 0xff00ff, 30, 15);
        setTimeout(() => {
            state.currentLevelIdx++;
            if (state.currentLevelIdx < levels.length) {
                loadLevel(state.currentLevelIdx);
                state.appState = 'PLAYING';
            } else {
                triggerGameOver(true);
            }
        }, 2000);
    }
}

function updateDynamicEntities(dt) {
    const pAABB = getPlayerAABB();

    for(let c of state.collectibles) {
        if (!c.active) continue;
        c.mesh.rotation.y += dt * 2;
        if (checkAABB(pAABB, c)) {
            c.active = false;
            c.mesh.visible = false;
            updateScore(100);
            emitParticles(c.x + c.w/2, c.y + c.h/2, 0xffff00, 15, 8);
        }
    }

    for(let e of state.enemies) {
        if (!e.active) continue;
        e.mesh.rotation.x += dt * 5 * Math.sign(e.vx);
        
        let nextX = e.x + e.vx * dt;
        let eAABB = { x: nextX, y: e.y, w: e.w, h: e.h };
        let hitWall = false;
        
        for(let b of state.blocks) {
            if(!b.active) continue;
            if(checkAABB(eAABB, b)) { hitWall = true; break; }
        }

        let gapCheckAABB = { x: nextX + (e.vx > 0 ? e.w : -e.w), y: e.y - 1, w: e.w, h: 1 };
        let overGround = false;
        for(let b of state.blocks) {
            if(!b.active) continue;
            if(checkAABB(gapCheckAABB, b)) { overGround = true; break; }
        }

        if (hitWall || !overGround) e.vx *= -1; 
        else e.x = nextX;
        
        e.mesh.position.x = e.x + e.w/2;
        if (checkAABB(pAABB, {x: e.x, y: e.y, w: e.w, h: e.h})) triggerDeath();
    }

    for(let b of state.blocks) {
        if (b.type === 'dissolve' && b.active && b.life < 1.0) {
            b.life -= dt * 1.5;
            b.mesh.scale.setScalar(Math.max(0.01, b.life));
            b.mesh.material.opacity = b.life;
            if (b.life <= 0) {
                b.active = false;
                b.mesh.visible = false;
                emitParticles(b.x + b.w/2, b.y + b.h/2, 0x00ffff, 10, 6);
            }
        }
    }
}

function triggerDeath() {
    if(state.player.state === 'dead') return;
    state.player.state = 'dead';
    emitParticles(state.player.x, state.player.y, 0x00ffff, 20, 10);
    
    if (state.appState === 'DEMO') {
        setTimeout(returnToTitle, 1000);
    } else {
        setTimeout(() => triggerGameOver(false), 1000);
    }
}

function updateCamera(dt) {
    if (!state.player.mesh) return;
    const targetZ = BASE_Z + (Math.abs(state.player.vy) * 0.3) + (Math.abs(state.player.vx) * 0.1);
    const targetFov = BASE_FOV + (state.player.chargeAmount * 1.5);

    camera.position.x += (state.player.x - camera.position.x) * 0.1;
    camera.position.y += ((state.player.y + 4) - camera.position.y) * 0.1;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();
    
    camera.lookAt(camera.position.x, state.player.y + 2, 0);
}
