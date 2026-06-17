import { state } from './state.js';
import { clearLevel } from './level.js';
import { scene, titleGroup } from './graphics.js';

export function renderHighScoreTable() {
    const list = document.getElementById('scoreList');
    list.innerHTML = state.highScores.map((s, i) => `<div class="score-row"><span>${i+1}. ${s.n}</span><span>${s.s.toString().padStart(6, '0')}</span></div>`).join('');
}

export function updateHighScores(name) {
    state.highScores.push({n: name.toUpperCase().substring(0,3) || 'PLY', s: state.score});
    state.highScores.sort((a,b) => b.s - a.s);
    state.highScores = state.highScores.slice(0, 5);
    localStorage.setItem('springy_scores', JSON.stringify(state.highScores));
    renderHighScoreTable();
}

export function updateScore(pts) {
    state.score += pts;
    document.getElementById('scoreUI').innerText = `SCORE: ${state.score.toString().padStart(6, '0')}`;
}

export function triggerGameOver(won) {
    state.appState = 'GAMEOVER';
    document.getElementById('uiLayer').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    
    const msg = document.getElementById('overlayMsg');
    const input = document.getElementById('nameInput');
    const overlay = document.getElementById('messageOverlay');
    
    msg.innerText = won ? "SYSTEM CONQUERED!" : "SYSTEM FAILURE";
    
    overlay.style.display = 'flex';
    
    if (state.score > (state.highScores[4]?.s || 0)) {
        input.style.display = 'block';
        input.value = '';
        // Small timeout to ensure the browser has rendered the display change before focusing
        setTimeout(() => input.focus(), 10);
    } else {
        input.style.display = 'none';
        setTimeout(returnToTitle, 3000);
    }
}

export function submitScore() {
    const name = document.getElementById('nameInput').value;
    updateHighScores(name);
    returnToTitle();
}

export function returnToTitle() {
    document.getElementById('messageOverlay').style.display = 'none';
    document.getElementById('demoOverlay').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('titleScreen').style.display = 'flex';
    if (state.player.mesh) scene.remove(state.player.mesh);
    clearLevel();
    state.idleTimestamp = Date.now();
    state.appState = 'TITLE';
}
