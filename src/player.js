import * as THREE from 'three';
import { state } from './state.js';
import { TILE_SIZE, BASE_JUMP_VELOCITY } from './constants.js';
import { scene, emitParticles } from './graphics.js';

export function spawnPlayer(px, py) {
    state.player.x = px;
    state.player.y = py - (TILE_SIZE / 2);
    state.player.vx = 0; 
    state.player.vy = 0;
    state.player.isCharging = false;
    state.player.chargeAmount = 0;
    
    if (state.player.mesh) scene.remove(state.player.mesh);
    state.player.mesh = new THREE.Group();
    
    const springMat = new THREE.MeshStandardMaterial({ color: 0x888888, wireframe: true, emissive: 0x222222 });
    state.player.spring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16, 4), springMat);
    state.player.spring.position.y = 0.6; 
    state.player.mesh.add(state.player.spring);

    const headMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x004444 });
    state.player.head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), headMat);
    state.player.head.position.y = 1.6;
    state.player.mesh.add(state.player.head);

    state.player.mesh.position.set(state.player.x, state.player.y, 0);
    scene.add(state.player.mesh);
}

export function executeJump() {
    if (state.player.isCharging && state.player.isGrounded) {
        state.player.vy = BASE_JUMP_VELOCITY + state.player.chargeAmount;
        state.player.isGrounded = false;
        emitParticles(state.player.x, state.player.y, 0x00ffff, 5, 5);
    }
    state.player.isCharging = false;
    state.player.chargeAmount = 0;
    resetPlayerScale();
}

export function resetPlayerScale() {
    if (!state.player.spring) return;
    state.player.spring.scale.y = 1;
    state.player.spring.position.y = 0.6;
    state.player.head.position.y = 1.6;
}

export function getPlayerAABB() { 
    return { 
        x: state.player.x - state.player.width/2, 
        y: state.player.y, 
        w: state.player.width, 
        h: state.player.height 
    }; 
}
