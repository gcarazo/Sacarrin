const TEAMS = {
    RED: { id: 'red', name: 'ROJO', colorClass: 'bg-red', textClass: 'text-red' },
    WHITE: { id: 'white', name: 'BLANCO', colorClass: 'bg-white', textClass: 'text-white' },
    BLACK: { id: 'black', name: 'NEGRO', colorClass: 'bg-black', textClass: 'text-black' },
    BLUE: { id: 'blue', name: 'AZUL', colorClass: 'bg-blue', textClass: 'text-blue' }
};

const historyApp = {
    state: {},

    init() {
        const saved = localStorage.getItem('sacarrin_state');
        if (saved) {
            this.state = JSON.parse(saved);
            this.render();
        } else {
            // No state, go back
            window.location.href = 'index.html';
        }
    },

    formatTime(ms) {
        if (!ms && ms !== 0) return "--:--";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },

    render() {
        const tbody = document.querySelector('#history-table tbody');
        const noHistoryMsg = document.getElementById('no-history-msg');

        tbody.innerHTML = '';

        if (!this.state.matchHistory || this.state.matchHistory.length === 0) {
            noHistoryMsg.classList.remove('hidden');
            return;
        }

        // Render in reverse order (newest first)
        [...this.state.matchHistory].reverse().forEach((match, index) => {
            const teamA = TEAMS[match.teamA.toUpperCase()];
            const teamB = TEAMS[match.teamB.toUpperCase()];
            // Adjust basic color fallback if logic not fully aligned
            const colorA = teamA ? teamA.colorClass : 'bg-gray';
            const colorB = teamB ? teamB.colorClass : 'bg-gray';
            const nameA = teamA ? teamA.name : match.teamA;
            const nameB = teamB ? teamB.name : match.teamB;

            // Determine winner styling
            const winnerClass = "font-weight: 800; color: #fff;"; // Highlight winner
            const loserClass = "opacity: 0.7;";

            let winnerId = null;
            if (match.scoreA > match.scoreB) winnerId = match.teamA;
            else if (match.scoreB > match.scoreA) winnerId = match.teamB;
            // Note: `match.winner` might store the ID directly

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span class="dot ${colorA}" style="width: 14px; height: 14px;"></span> ${nameA}
                        <span style="opacity: 0.5; margin: 0 5px;">vs</span>
                        <span class="dot ${colorB}" style="width: 14px; height: 14px;"></span> ${nameB}
                    </div>
                </td>
                <td>
                    <span style="${match.scoreA > match.scoreB ? winnerClass : loserClass}">${match.scoreA}</span>
                    - 
                    <span style="${match.scoreB > match.scoreA ? winnerClass : loserClass}">${match.scoreB}</span>
                </td>
                <td>${this.formatTime(match.duration)}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    goBack() {
        window.location.href = 'index.html';
    }
};

// Initialize on load
historyApp.init();
