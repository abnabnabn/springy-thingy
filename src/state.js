export const state = {
    blocks: [],
    collectibles: [],
    enemies: [],
    flyingEnemies: [],
    goalBox: null,
    currentLevelIdx: 0,
    score: 0,
    appState: 'TITLE',
    idleTimestamp: Date.now(),
    demoWatchdog: 0,
    highScores: JSON.parse(localStorage.getItem('springy_scores')) || [
        {n: 'CPU', s: 5000}, {n: 'RAM', s: 4000}, {n: 'ROM', s: 3000}, {n: 'ALU', s: 2000}, {n: 'FPU', s: 1000}
    ],
    player: {
        mesh: null,
        head: null,
        spring: null,
        x: 0,
        y: 0,
        width: 1.2,
        height: 2.0,
        vx: 0,
        vy: 0,
        isGrounded: false,
        isCharging: false,
        chargeAmount: 0,
        state: 'idle'
    },
    input: {
        left: false,
        right: false,
        jump: false
    },
    particles: [],
    particleIdx: 0
};
