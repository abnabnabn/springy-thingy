import * as THREE from 'three';
import { state } from './state.js';
import { levels, TILE_SIZE, MOVE_SPEED } from './constants.js';
import { cache } from './cache.js';
import { scene } from './graphics.js';
import { spawnPlayer } from './player.js';

export function clearLevel() {
    state.blocks.forEach(b => scene.remove(b.mesh));
    state.collectibles.forEach(c => scene.remove(c.mesh));
    state.enemies.forEach(e => scene.remove(e.mesh));
    if (state.flyingEnemies) state.flyingEnemies.forEach(e => scene.remove(e.mesh));
    state.blocks = [];
    state.collectibles = [];
    state.enemies = [];
    state.flyingEnemies = [];
    if (state.goalBox) {
        scene.remove(state.goalBox.mesh);
        state.goalBox = null;
    }
}

export function loadLevel(idx) {
    clearLevel();
    document.getElementById('levelUI').innerText = `LEVEL ${idx + 1}`;
    document.getElementById('messageOverlay').style.display = 'none';

    const levelMap = levels[idx];
    const rows = levelMap.length;
    const cols = levelMap[0].length;

    const flyingStarts = {};
    const flyingEnds = {};

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const char = levelMap[r][c];
            if (char === '.') continue;

            const xPos = c * TILE_SIZE;
            const yPos = (rows - r - 1) * TILE_SIZE;

            if (char === 'X' || char === 'D' || char === '<' || char === '>') {
                let isTop = (r === 0 || !['X', 'D', '<', '>'].includes(levelMap[r-1][c]));
                let mat, type;
                if (char === 'D') { mat = cache.mat.dissolve; type = 'dissolve'; }
                else if (char === '<') { mat = cache.mat.conveyorL; type = 'conveyor_left'; }
                else if (char === '>') { mat = cache.mat.conveyorR; type = 'conveyor_right'; }
                else { mat = isTop ? cache.mat.grass : cache.mat.block; type = 'solid'; }
                
                const mesh = new THREE.Mesh(cache.geo.block, mat.clone());
                mesh.position.set(xPos, yPos, 0);
                scene.add(mesh);
                state.blocks.push({ x: xPos - TILE_SIZE/2, y: yPos - TILE_SIZE/2, w: TILE_SIZE, h: TILE_SIZE, mesh: mesh, type: type, active: true, life: 1.0 });
            } else if (char === 'S') {
                spawnPlayer(xPos, yPos);
            } else if (char === 'G') {
                const mesh = new THREE.Mesh(cache.geo.goal, cache.mat.goal);
                mesh.position.set(xPos, yPos, 0);
                scene.add(mesh);
                state.goalBox = { x: xPos - TILE_SIZE/2, y: yPos - TILE_SIZE/2, w: TILE_SIZE, h: TILE_SIZE, mesh: mesh };
            } else if (char === 'C') {
                const mesh = new THREE.Mesh(cache.geo.collectible, cache.mat.collectible);
                mesh.position.set(xPos, yPos, 0);
                scene.add(mesh);
                state.collectibles.push({ x: xPos - TILE_SIZE/2, y: yPos - TILE_SIZE/2, w: TILE_SIZE, h: TILE_SIZE, mesh: mesh, active: true });
            } else if (char === 'E') {
                const mesh = new THREE.Mesh(cache.geo.enemy, cache.mat.enemy);
                mesh.position.set(xPos, yPos + 0.2, 0);
                scene.add(mesh);
                state.enemies.push({ x: xPos - TILE_SIZE/2, y: yPos - TILE_SIZE/2, w: TILE_SIZE, h: TILE_SIZE, mesh: mesh, vx: MOVE_SPEED * 0.5, active: true });
            } else if (char >= 'A' && char <= 'Z' && !['S', 'C', 'E', 'X', 'D', 'G'].includes(char)) {
                flyingStarts[char] = { x: xPos, y: yPos };
            } else if (char >= 'a' && char <= 'z') {
                flyingEnds[char] = { x: xPos, y: yPos };
            }
        }
    }

    for (const key in flyingStarts) {
        const lowerKey = key.toLowerCase();
        if (flyingEnds[lowerKey]) {
            const start = flyingStarts[key];
            const end = flyingEnds[lowerKey];
            const mesh = new THREE.Mesh(cache.geo.flyingEnemy, cache.mat.flyingEnemy);
            mesh.rotation.x = Math.PI / 2; // Point it sideways initially
            mesh.position.set(start.x, start.y, 0);
            scene.add(mesh);
            state.flyingEnemies.push({
                x: start.x, y: start.y,
                startX: start.x, startY: start.y,
                endX: end.x, endY: end.y,
                w: TILE_SIZE * 0.8, h: TILE_SIZE * 0.8,
                mesh: mesh,
                progress: 0,
                direction: 1,
                active: true
            });
        }
    }
    state.player.state = 'idle';
    state.input.left = false;
    state.input.right = false;
    state.input.jump = false;
}

export function checkAABB(a, b) { 
    return (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y); 
}
