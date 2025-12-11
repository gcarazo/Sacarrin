/**
 * Sacarrin App Logic
 */

const TEAMS = {
    RED: { id: 'red', name: 'ROJO', colorClass: 'bg-red', textClass: 'text-red' },
    WHITE: { id: 'white', name: 'BLANCO', colorClass: 'bg-white', textClass: 'text-white' },
    BLACK: { id: 'black', name: 'NEGRO', colorClass: 'bg-black', textClass: 'text-black' },
    BLUE: { id: 'blue', name: 'AZUL', colorClass: 'bg-blue', textClass: 'text-blue' }
};

// Removed fixed constant: MATCH_DURATION_MS

const app = {
    state: {
        teams: {
            red: { wins: 0, goals: 0, matches: 0 },
            white: { wins: 0, goals: 0, matches: 0 },
            black: { wins: 0, goals: 0, matches: 0 },
            blue: { wins: 0, goals: 0, matches: 0 }
        },
        activeTeams: [], // List of team IDs playing in the tournament
        matchDuration: 300000, // Default 5 mins in ms
        currentMatch: {
            teamA: null,
            teamB: null,
            scoreA: 0,
            scoreB: 0,
            startTime: null,
            elapsedTime: 0, // ms
            isRunning: false,
            isOver: false
        },
        queue: [],
        matchHistory: [], // { winner, loser, scoreA, scoreB, duration }
        totalPlayTime: 0, // ms
        timerInterval: null
    },

    isResetting: false,

    init() {
        this.loadState();

        if (!this.state.activeTeams || this.state.activeTeams.length === 0) {
            this.showSetup();
        } else {
            this.render();
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.isResetting) {
                this.saveState();
            }
        });
    },

    // Setup & Reordering Logic
    moveUp(btn) {
        const item = btn.closest('.team-item');
        const prev = item.previousElementSibling;
        if (prev) {
            item.parentNode.insertBefore(item, prev);
        }
    },

    moveDown(btn) {
        const item = btn.closest('.team-item');
        const next = item.nextElementSibling;
        if (next) {
            item.parentNode.insertBefore(next, item);
        }
    },

    resetTournament() {
        if (confirm('¿Estás seguro de reiniciar todo el torneo?')) {
            this.isResetting = true; // Prevent auto-save on unload
            localStorage.removeItem('sacarrin_state');
            location.reload();
        }
    },

    showSetup() {
        document.getElementById('setup-modal').classList.remove('hidden');
    },

    confirmSetup() {
        // 1. Get Duration
        const durationInput = document.getElementById('match-duration');
        let durationMin = parseInt(durationInput.value);
        if (isNaN(durationMin) || durationMin < 3) durationMin = 3;
        if (durationMin > 10) durationMin = 10;

        this.state.matchDuration = durationMin * 60 * 1000;

        // 2. Get Selected Teams in Order
        const teamItems = document.querySelectorAll('.team-item');
        const selectedTeams = [];

        teamItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                selectedTeams.push(checkbox.value);
            }
        });

        if (selectedTeams.length < 2) {
            alert('Debes seleccionar al menos 2 equipos.');
            return;
        }

        this.state.activeTeams = selectedTeams;

        // Initialize queue and first match based on the ORDER
        this.state.currentMatch.teamA = selectedTeams[0];
        this.state.currentMatch.teamB = selectedTeams[1];
        this.state.queue = selectedTeams.slice(2);

        // Reset stats for all
        for (let id in this.state.teams) {
            this.state.teams[id] = { wins: 0, goals: 0, matches: 0 };
        }

        this.state.matchHistory = [];
        this.state.totalPlayTime = 0;

        document.getElementById('setup-modal').classList.add('hidden');
        this.saveState();
        this.render();
    },

    loadState() {
        const saved = localStorage.getItem('sacarrin_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.state = { ...this.state, ...parsed };
            if (!this.state.teams.blue) {
                this.state.teams.blue = { wins: 0, goals: 0, matches: 0 };
            }
            if (!this.state.matchDuration) {
                this.state.matchDuration = 5 * 60 * 1000;
            }
            this.state.currentMatch.isRunning = false;
        }
    },

    saveState() {
        localStorage.setItem('sacarrin_state', JSON.stringify(this.state));
    },

    toggleTimer() {
        if (this.state.currentMatch.isOver) return;

        if (this.state.currentMatch.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
        this.render();
    },

    startTimer() {
        if (this.state.currentMatch.isRunning) return;

        this.state.currentMatch.isRunning = true;

        this.state.timerInterval = setInterval(() => {
            this.state.currentMatch.elapsedTime += 1000;
            this.state.totalPlayTime += 1000; // Track total time

            if (this.state.currentMatch.elapsedTime >= this.state.matchDuration) {
                this.state.currentMatch.elapsedTime = this.state.matchDuration;
                this.timeUp();
            }

            this.renderTimer();
            this.renderTotalTime();
            this.saveState();
        }, 1000);
    },

    pauseTimer() {
        this.state.currentMatch.isRunning = false;
        clearInterval(this.state.timerInterval);
        this.saveState();
    },

    requestReset() {
        this.pauseTimer();
        document.getElementById('modal-reset').classList.remove('hidden');

        const teamAName = TEAMS[this.state.currentMatch.teamA.toUpperCase()].name;
        const teamBName = TEAMS[this.state.currentMatch.teamB.toUpperCase()].name;

        document.getElementById('reset-team-a-name').textContent = teamAName;
        document.getElementById('reset-team-b-name').textContent = teamBName;

        document.querySelector('#modal-reset .btn-team-a').className = `btn-team-a ${TEAMS[this.state.currentMatch.teamA.toUpperCase()].colorClass} ${TEAMS[this.state.currentMatch.teamA.toUpperCase()].textClass}`;
        document.querySelector('#modal-reset .btn-team-b').className = `btn-team-b ${TEAMS[this.state.currentMatch.teamB.toUpperCase()].colorClass} ${TEAMS[this.state.currentMatch.teamB.toUpperCase()].textClass}`;
    },

    cancelReset() {
        document.getElementById('modal-reset').classList.add('hidden');
    },

    forceReset() {
        const password = prompt("Ingrese la clave para anular el partido:");
        if (password && password.toLowerCase() === 'gol') {
            document.getElementById('modal-reset').classList.add('hidden');
            this.resetMatch();
        } else {
            alert("Clave incorrecta.");
        }
    },

    resetMatch() {
        // Subtract elapsed time from total time if we are resetting the CURRENT match
        this.state.totalPlayTime -= this.state.currentMatch.elapsedTime;
        if (this.state.totalPlayTime < 0) this.state.totalPlayTime = 0;

        this.pauseTimer();
        this.state.currentMatch.scoreA = 0;
        this.state.currentMatch.scoreB = 0;
        this.state.currentMatch.elapsedTime = 0;
        this.state.currentMatch.isOver = false;
        this.render();
        this.saveState();
    },

    scoreGoal(teamSide) {
        if (this.state.currentMatch.isOver) return;

        if (teamSide === 'A') {
            this.state.currentMatch.scoreA++;
            this.endMatch(this.state.currentMatch.teamA, this.state.currentMatch.teamB);
        } else {
            this.state.currentMatch.scoreB++;
            this.endMatch(this.state.currentMatch.teamB, this.state.currentMatch.teamA);
        }
    },

    timeUp() {
        this.pauseTimer();
        this.state.currentMatch.isOver = true;
        document.getElementById('modal-resolution').classList.remove('hidden');

        const teamAName = TEAMS[this.state.currentMatch.teamA.toUpperCase()].name;
        const teamBName = TEAMS[this.state.currentMatch.teamB.toUpperCase()].name;

        document.getElementById('modal-team-a-name').textContent = teamAName;
        document.getElementById('modal-team-b-name').textContent = teamBName;

        document.querySelector('#modal-resolution .btn-team-a').className = `btn-team-a ${TEAMS[this.state.currentMatch.teamA.toUpperCase()].colorClass} ${TEAMS[this.state.currentMatch.teamA.toUpperCase()].textClass}`;
        document.querySelector('#modal-resolution .btn-team-b').className = `btn-team-b ${TEAMS[this.state.currentMatch.teamB.toUpperCase()].colorClass} ${TEAMS[this.state.currentMatch.teamB.toUpperCase()].textClass}`;
    },

    resolveMatch(winnerSide) {
        document.getElementById('modal-resolution').classList.add('hidden');
        document.getElementById('modal-reset').classList.add('hidden');
        if (winnerSide === 'A') {
            this.endMatch(this.state.currentMatch.teamA, this.state.currentMatch.teamB);
        } else {
            this.endMatch(this.state.currentMatch.teamB, this.state.currentMatch.teamA);
        }
    },

    endMatch(winnerId, loserId) {
        this.pauseTimer();

        // Update stats
        this.state.teams[winnerId].wins++;
        this.state.teams[winnerId].matches++;
        this.state.teams[loserId].matches++;

        this.state.teams[this.state.currentMatch.teamA].goals += this.state.currentMatch.scoreA;
        this.state.teams[this.state.currentMatch.teamB].goals += this.state.currentMatch.scoreB;

        // Record History
        this.state.matchHistory.unshift({
            winner: winnerId,
            loser: loserId,
            scoreA: this.state.currentMatch.scoreA,
            scoreB: this.state.currentMatch.scoreB,
            teamA: this.state.currentMatch.teamA,
            teamB: this.state.currentMatch.teamB,
            duration: this.state.currentMatch.elapsedTime
        });

        // Rotate
        if (this.state.queue.length > 0) {
            const nextTeamId = this.state.queue.shift();
            this.state.queue.push(loserId);
            this.state.currentMatch.teamA = winnerId;
            this.state.currentMatch.teamB = nextTeamId;
        } else {
            this.state.currentMatch.teamA = winnerId;
            this.state.currentMatch.teamB = loserId;
        }

        // Reset match state
        this.state.currentMatch.scoreA = 0;
        this.state.currentMatch.scoreB = 0;
        this.state.currentMatch.elapsedTime = 0;
        this.state.currentMatch.isOver = false;

        this.saveState();
        this.render();
    },

    resetTournament() {
        if (confirm('¿Estás seguro de reiniciar todo el torneo?')) {
            this.isResetting = true;
            localStorage.removeItem('sacarrin_state');
            location.reload();
        }
    },

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
    },

    render() {
        if (!this.state.currentMatch.teamA || !this.state.currentMatch.teamB) return;

        this.renderMatch();
        this.renderTimer();
        this.renderTotalTime();
        this.renderQueue();
        this.renderStats();
        this.renderHistory();
    },

    renderMatch() {
        const teamA = TEAMS[this.state.currentMatch.teamA.toUpperCase()];
        const teamB = TEAMS[this.state.currentMatch.teamB.toUpperCase()];

        // Team A
        const elTeamA = document.getElementById('team-a');
        elTeamA.querySelector('.team-name').textContent = teamA.name;
        elTeamA.querySelector('.team-score').textContent = this.state.currentMatch.scoreA;
        elTeamA.querySelector('.team-color-indicator').className = `team-color-indicator ${teamA.colorClass}`;

        // Team B
        const elTeamB = document.getElementById('team-b');
        elTeamB.querySelector('.team-name').textContent = teamB.name;
        elTeamB.querySelector('.team-score').textContent = this.state.currentMatch.scoreB;
        elTeamB.querySelector('.team-color-indicator').className = `team-color-indicator ${teamB.colorClass}`;

        // Button Text
        const btnStart = document.getElementById('btn-start-pause');
        btnStart.textContent = this.state.currentMatch.isRunning ? 'PAUSAR' : 'INICIAR';
    },

    renderTimer() {
        const totalSeconds = Math.floor((this.state.matchDuration - this.state.currentMatch.elapsedTime) / 1000);
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').textContent = `${m}:${s}`;

        if (totalSeconds <= 0) {
            document.getElementById('timer-display').classList.add('text-red');
        } else {
            document.getElementById('timer-display').classList.remove('text-red');
        }
    },

    renderTotalTime() {
        document.getElementById('total-time-display').textContent = `Tiempo Efectivo Total: ${this.formatTime(this.state.totalPlayTime)}`;
    },

    renderQueue() {
        const elQueueArea = document.getElementById('queue-area');
        if (this.state.queue.length === 0) {
            elQueueArea.style.display = 'none';
            return;
        }
        elQueueArea.style.display = 'flex';

        const nextTeamId = this.state.queue[0];
        const nextTeam = TEAMS[nextTeamId.toUpperCase()];
        const elNext = document.getElementById('team-next');
        elNext.querySelector('.name').textContent = nextTeam.name;
        elNext.querySelector('.dot').className = `dot ${nextTeam.colorClass}`;
    },

    renderStats() {
        const tbody = document.querySelector('#stats-table tbody');
        tbody.innerHTML = '';

        // Filter only active teams
        const activeStats = this.getSortedStats();

        activeStats.forEach(stats => {
            const team = TEAMS[stats.id.toUpperCase()];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="dot ${team.colorClass}" style="display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px;"></span>${team.name}</td>
                <td>${stats.wins}</td>
                <td>${stats.goals}</td>
                <td>${stats.matches}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderHistory() {
        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = '';

        this.state.matchHistory.forEach(match => {
            const winner = TEAMS[match.winner.toUpperCase()];
            const loser = TEAMS[match.loser.toUpperCase()];
            const tr = document.createElement('tr');

            let scoreDisplay = '';
            if (match.winner === match.teamA) {
                scoreDisplay = `${match.scoreA} - ${match.scoreB}`;
            } else {
                scoreDisplay = `${match.scoreB} - ${match.scoreA}`;
            }

            tr.innerHTML = `
                <td>${winner.name} vs ${loser.name}</td>
                <td><span class="${winner.textClass}">${winner.name}</span> (${scoreDisplay})</td>
                <td>${this.formatTime(match.duration)}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    getSortedStats() {
        const activeStats = this.state.activeTeams.map(id => ({ id, ...this.state.teams[id] }));
        // Sort by wins, then goals
        return activeStats.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.goals - a.goals;
        });
    },

    showResults() {
        this.pauseTimer(); // Ensure game is paused
        document.getElementById('modal-results').classList.remove('hidden');

        // 1. Get Winner
        const stats = this.getSortedStats();
        if (stats.length > 0) {
            const winner = stats[0];
            const winnerTeam = TEAMS[winner.id.toUpperCase()];

            const elWinnerSection = document.getElementById('winner-display');
            elWinnerSection.classList.remove('hidden');

            const elName = document.getElementById('winner-name');
            elName.textContent = winnerTeam.name;
            elName.className = winnerTeam.textClass; // Optional: add text color

            const elDot = document.getElementById('winner-dot');
            elDot.className = `dot big-dot ${winnerTeam.colorClass}`;
        }

        // 2. Render Table
        const tbody = document.querySelector('#results-table tbody');
        tbody.innerHTML = '';

        stats.forEach(s => {
            const team = TEAMS[s.id.toUpperCase()];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="dot ${team.colorClass}" style="display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px;"></span>${team.name}</td>
                <td>${s.wins}</td>
                <td>${s.goals}</td>
                <td>${s.matches}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    closeResults() {
        document.getElementById('modal-results').classList.add('hidden');
    }
};

// Start
app.init();
