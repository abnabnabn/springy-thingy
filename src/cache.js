import * as THREE from 'three';
import { TILE_SIZE } from './constants.js';

function createConveyorTex(isLeft) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = isLeft ? '#995500' : '#005599';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = isLeft ? '#ffaa00' : '#00aaff';
    for (let x = 0; x < 64; x += 32) {
        ctx.beginPath();
        if (isLeft) {
            ctx.moveTo(x + 24, 0); ctx.lineTo(x, 32); ctx.lineTo(x + 24, 64);
            ctx.lineTo(x + 32, 64); ctx.lineTo(x + 8, 32); ctx.lineTo(x + 32, 0);
        } else {
            ctx.moveTo(x + 8, 0); ctx.lineTo(x + 32, 32); ctx.lineTo(x + 8, 64);
            ctx.lineTo(x, 64); ctx.lineTo(x + 24, 32); ctx.lineTo(x, 0);
        }
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.NearestFilter;
    return tex;
}

export const cache = {
    geo: {
        block: new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE * 2),
        goal: new THREE.BoxGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE),
        collectible: new THREE.TorusGeometry(0.6, 0.2, 8, 16),
        enemy: new THREE.IcosahedronGeometry(0.8, 0),
        particle: new THREE.BoxGeometry(0.3, 0.3, 0.3)
    },
    mat: {
        block: new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x111111 }),
        grass: new THREE.MeshLambertMaterial({ color: 0x004444, emissive: 0x002222 }),
        dissolve: new THREE.MeshLambertMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, emissive: 0x004444 }),
        goal: new THREE.MeshLambertMaterial({ color: 0xff00ff, emissive: 0xaa00aa }),
        collectible: new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0x888800, shininess: 100 }),
        enemy: new THREE.MeshPhongMaterial({ color: 0xff0044, emissive: 0x880022, flatShading: true }),
        particle: new THREE.MeshBasicMaterial({ color: 0x00ffff }),
        conveyorL: new THREE.MeshLambertMaterial({ color: 0xffffff, map: createConveyorTex(true), emissive: 0x331100 }),
        conveyorR: new THREE.MeshLambertMaterial({ color: 0xffffff, map: createConveyorTex(false), emissive: 0x001133 })
    }
};
