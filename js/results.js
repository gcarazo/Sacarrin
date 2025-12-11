const TEAMS = {
    RED: { id: 'red', name: 'ROJO', colorClass: 'bg-red', textClass: 'text-red' },
    WHITE: { id: 'white', name: 'BLANCO', colorClass: 'bg-white', textClass: 'text-white' },
    BLACK: { id: 'black', name: 'NEGRO', colorClass: 'bg-black', textClass: 'text-black' },
    BLUE: { id: 'blue', name: 'AZUL', colorClass: 'bg-blue', textClass: 'text-blue' }
};

const results = {
    state: {},

    init() {
        const saved = localStorage.getItem('sacarrin_state');
        if (saved) {
            this.state = JSON.parse(saved);

            // Handle potentially uninitialized teams if state is old (defensive programming)
            if (!this.state.teams.blue) {
                this.state.teams.blue = { wins: 0, goals: 0, matches: 0 };
            }

            this.render();
        } else {
            // No state, go back
            window.location.href = 'index.html';
        }
    },

    getSortedStats() {
        if (!this.state.activeTeams) return [];

        const activeStats = this.state.activeTeams.map(id => ({ id, ...this.state.teams[id] }));
        // Sort by wins, then goals
        return activeStats.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.goals - a.goals;
        });
    },

    render() {
        // 1. Get Winner
        const stats = this.getSortedStats();
        if (stats.length > 0) {
            const winner = stats[0];
            const winnerTeam = TEAMS[winner.id.toUpperCase()];

            const elWinnerSection = document.getElementById('winner-display');
            elWinnerSection.classList.remove('hidden');

            const elName = document.getElementById('winner-name');
            elName.textContent = winnerTeam.name;
            elName.className = `animate-pop ${winnerTeam.textClass}`;

            const elDot = document.getElementById('winner-dot');
            elDot.className = `dot big-dot ${winnerTeam.colorClass}`;
        }

        // 2. Render Table
        const tbody = document.querySelector('#results-table tbody');
        tbody.innerHTML = '';

        stats.forEach((s, index) => {
            const team = TEAMS[s.id.toUpperCase()];
            const rank = index + 1;

            // Determine styling based on rank
            let rowClass = '';
            let medal = '';
            if (rank === 1) { rowClass = 'rank-1'; medal = '🥇'; }
            else if (rank === 2) { rowClass = 'rank-2'; medal = '🥈'; }
            else if (rank === 3) { rowClass = 'rank-3'; medal = '🥉'; }
            else { medal = rank + '.'; }

            const tr = document.createElement('tr');
            tr.className = rowClass;

            tr.innerHTML = `
                <td class="team-cell">
                    <span class="rank-icon">${medal}</span>
                    <span class="dot ${team.colorClass}" style="display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:10px;"></span>
                    ${team.name}
                </td>
                <td class="stats-cell">
                    <span class="stats-value">${s.wins}</span>
                    <span class="stats-label">Ganes</span>
                </td>
                <td class="stats-cell">
                    <span class="stats-value">${s.goals}</span>
                    <span class="stats-label">Goles</span>
                </td>
                <td class="stats-cell">
                    <span class="stats-value">${s.matches}</span>
                    <span class="stats-label">Juegos</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    goBack() {
        window.location.href = 'index.html';
    },

    resetTournament() {
        if (confirm('¿Estás seguro de iniciar un nuevo torneo?')) {
            localStorage.removeItem('sacarrin_state');
            window.location.href = 'index.html';
        }
    }
};

// Initialize on load
results.init();
