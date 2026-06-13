import * as THREE from 'three';
import { TILE_SIZE } from './constants.js';

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
        particle: new THREE.MeshBasicMaterial({ color: 0x00ffff })
    }
};
