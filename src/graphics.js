import * as THREE from 'three';
import { BASE_FOV, MAX_PARTICLES, GRAVITY } from './constants.js';
import { state } from './state.js';
import { cache } from './cache.js';

export let scene, camera, renderer, titleGroup;

export function initGraphics() {
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050a);
    scene.fog = new THREE.FogExp2(0x05050a, 0.015);

    camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    
    const dirLight = new THREE.DirectionalLight(0x00ffff, 0.5);
    dirLight.position.set(5, 15, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff00ff, 1, 50);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    initParticles();
    buildTitleScene();

    window.addEventListener('resize', onWindowResize, false);
}

function buildTitleScene() {
    titleGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, wireframe: true, emissive: 0x004444 });
    for(let i=0; i<40; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(5, 0.2, 8, 32), mat);
        t.position.y = (i - 20) * 0.5;
        t.rotation.x = Math.PI / 2;
        t.rotation.x += i * 0.1;
        titleGroup.add(t);
    }
    scene.add(titleGroup);
}

function initParticles() {
    for(let i = 0; i < MAX_PARTICLES; i++) {
        const p = new THREE.Mesh(cache.geo.particle, cache.mat.particle.clone());
        p.visible = false;
        scene.add(p);
        state.particles.push({ mesh: p, life: 0, vx: 0, vy: 0, vz: 0 });
    }
}

export function emitParticles(x, y, colorHex, count, speedStr) {
    for(let i = 0; i < count; i++) {
        const p = state.particles[state.particleIdx];
        p.mesh.position.set(x + (Math.random() - 0.5), y + (Math.random() - 0.5), 0);
        p.mesh.material.color.setHex(colorHex);
        p.mesh.material.transparent = true;
        p.mesh.material.opacity = 1.0;
        p.mesh.scale.setScalar(1);
        p.mesh.visible = true;
        p.life = 1.0 + Math.random() * 0.5;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * speedStr;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed + (speedStr * 0.5);
        p.vz = (Math.random() - 0.5) * speed;
        state.particleIdx = (state.particleIdx + 1) % MAX_PARTICLES;
    }
}

export function updateParticles(dt) {
    for(let p of state.particles) {
        if(p.life > 0) {
            p.vy += GRAVITY * 0.5 * dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.life -= dt;
            p.mesh.material.opacity = Math.max(0, p.life);
            p.mesh.scale.setScalar(p.life);
            if(p.life <= 0) p.mesh.visible = false;
        }
    }
}

export function updateTitleScene(time) {
    if (titleGroup) {
        titleGroup.visible = true;
        titleGroup.rotation.y = time * 0.2;
        titleGroup.children.forEach((c, i) => c.scale.setScalar(1 + Math.sin(time * 2 + i * 0.2) * 0.2));
    }
    camera.position.x = Math.sin(time * 0.5) * 30;
    camera.position.z = Math.cos(time * 0.5) * 30;
    camera.position.y = Math.sin(time * 0.3) * 10;
    camera.lookAt(0,0,0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
