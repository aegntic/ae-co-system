// AegntiX Frontend - Real-time Scenario Visualization

let ws = null;
let currentScenario = null;
let isPlaying = false;
let aegnts = new Map();

// Initialize WebSocket connection
function connect() {
    ws = new WebSocket('ws://localhost:3005');
    
    ws.onopen = () => {
        console.log('Connected to AegntiX server');
        updateStatus('Connected', true);
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('Error', false);
    };
    
    ws.onclose = () => {
        updateStatus('Disconnected', false);
        setTimeout(connect, 3000); // Reconnect after 3 seconds
    };
}

// Handle messages from server
function handleServerMessage(data) {
    console.log('Received:', data);
    
    switch (data.type) {
        case 'scenario_started':
            currentScenario = data.scenario;
            isPlaying = true;
            updateUI();
            break;
            
        case 'scenario_paused':
            isPlaying = false;
            updateUI();
            break;
            
        case 'scenario_resumed':
            isPlaying = true;
            updateUI();
            break;
            
        case 'aegnt_action':
            updateAegntAction(data);
            break;
            
        case 'timeline_branched':
            console.log('Timeline branched:', data.branch);
            break;
    }
}

// Update aegnt action in UI
function updateAegntAction(data) {
    const aegntCard = document.getElementById(`aegnt-${data.aegntId}`);
    if (aegntCard) {
        aegntCard.classList.add('active');
        const actionDiv = aegntCard.querySelector('.aegnt-action');
        actionDiv.textContent = data.action.action;
        
        setTimeout(() => {
            aegntCard.classList.remove('active');
        }, 1000);
    }
}

// Update UI based on current state
function updateUI() {
    const pauseBtn = document.getElementById('pauseBtn');
    const playBtn = document.getElementById('playBtn');
    const branchBtn = document.getElementById('branchBtn');
    const injectContextBtn = document.getElementById('injectContextBtn');
    
    if (currentScenario) {
        pauseBtn.disabled = false;
        branchBtn.disabled = false;
        injectContextBtn.disabled = false;
        
        if (isPlaying) {
            pauseBtn.textContent = 'Pause';
            playBtn.textContent = '⏸️';
        } else {
            pauseBtn.textContent = 'Resume';
            playBtn.textContent = '▶️';
        }
        
        renderAegnts();
    }
}

// Render aegnt cards
function renderAegnts() {
    const aegntView = document.getElementById('aegntView');
    aegntView.innerHTML = '';
    
    if (currentScenario && currentScenario.aegnts) {
        currentScenario.aegnts.forEach(aegnt => {
            const card = document.createElement('div');
            card.className = 'aegnt-card';
            card.id = `aegnt-${aegnt.id}`;
            card.innerHTML = `
                <div class="aegnt-name">${aegnt.role}</div>
                <div class="aegnt-action">Waiting...</div>
                <div style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
                    ${aegnt.personality}
                </div>
            `;
            aegntView.appendChild(card);
            
            aegnts.set(aegnt.id, aegnt);
        });
    }
}

// Update connection status
function updateStatus(text, connected) {
    document.getElementById('statusText').textContent = text;
    const dot = document.getElementById('statusDot');
    if (connected) {
        dot.classList.add('connected');
    } else {
        dot.classList.remove('connected');
    }
}

// Initialize demo scenario
function initDemoScenario() {
    const demoScenario = {
        name: "Startup Pitch Demo",
        description: "A founder pitches to an investor",
        aegnts: [
            {
                id: "founder",
                role: "Startup Founder",
                personality: "You are an enthusiastic tech entrepreneur pitching your AI startup. You're passionate but realistic about challenges.",
                goals: ["Secure $2M seed funding", "Maintain 60% equity", "Find a strategic partner"]
            },
            {
                id: "investor",
                role: "Venture Capitalist",
                personality: "You are a seasoned VC investor. You're interested but cautious, always looking for the best deal and lowest risk.",
                goals: ["Find 10x return opportunities", "Minimize risk", "Secure board seat"]
            },
            {
                id: "advisor",
                role: "Technical Advisor",
                personality: "You are a technical expert who asks tough questions about implementation and scalability.",
                goals: ["Ensure technical feasibility", "Identify potential issues", "Support good ideas"]
            }
        ],
        worldState: {
            market: "AI boom in 2024",
            competition: "Several well-funded competitors",
            technology: "Novel approach to aegnt orchestration"
        }
    };
    
    // Send to server
    fetch('/api/scenarios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoScenario)
    }).then(res => res.json()).then(scenario => {
        console.log('Created demo scenario:', scenario);
        currentScenario = scenario;
        updateUI();
    });
}

// Event listeners
document.getElementById('newScenarioBtn').addEventListener('click', initDemoScenario);

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (currentScenario) {
        if (isPlaying) {
            ws.send(JSON.stringify({ type: 'pause_scenario', scenarioId: currentScenario.id }));
        } else {
            ws.send(JSON.stringify({ type: 'resume_scenario', scenarioId: currentScenario.id }));
        }
    }
});

document.getElementById('playBtn').addEventListener('click', () => {
    if (currentScenario && !isPlaying) {
        ws.send(JSON.stringify({ type: 'start_scenario', scenarioId: currentScenario.id }));
    }
});

document.getElementById('branchBtn').addEventListener('click', () => {
    if (currentScenario) {
        ws.send(JSON.stringify({ 
            type: 'branch_timeline', 
            scenarioId: currentScenario.id,
            branchPoint: Date.now()
        }));
    }
});

document.getElementById('injectContextBtn').addEventListener('click', () => {
    if (currentScenario) {
        // Populate aegnt selector
        const select = document.getElementById('aegntSelect');
        select.innerHTML = '<option>Select an aegnt...</option>';
        aegnts.forEach((aegnt, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = aegnt.role;
            select.appendChild(option);
        });
        
        document.getElementById('contextModal').style.display = 'flex';
    }
});

function closeContextModal() {
    document.getElementById('contextModal').style.display = 'none';
}

function submitContext() {
    const aegntId = document.getElementById('aegntSelect').value;
    const context = document.getElementById('contextInput').value;
    
    if (aegntId && context) {
        ws.send(JSON.stringify({
            type: 'inject_context',
            aegntId,
            context
        }));
        
        closeContextModal();
        document.getElementById('contextInput').value = '';
    }
}

// Initialize
connect();
