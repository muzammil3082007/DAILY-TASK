// State Management
let state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    theme: localStorage.getItem('theme') || 'light',
    currentPage: 0
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateDate();
    initCharts();
    requestNotificationPermission();
    checkReminders();
    setInterval(checkReminders, 60000); // Check every minute
});

// --- SWIPE LOGIC ---
let startX = 0;
const slider = document.getElementById('app-slider');

slider.addEventListener('touchstart', e => startX = e.touches[0].clientX);
slider.addEventListener('touchend', e => {
    let diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
        if (diff > 0 && state.currentPage < 2) slideTo(state.currentPage + 1);
        else if (diff < 0 && state.currentPage > 0) slideTo(state.currentPage - 1);
    }
});

function slideTo(index) {
    state.currentPage = index;
    slider.style.transform = `translateX(-${index * 100}vw)`;
    
    // Update Nav UI
    document.querySelectorAll('.nav-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });
}

// --- TASK LOGIC ---
const modal = document.getElementById('modal');
document.getElementById('add-task-btn').onclick = () => modal.classList.replace('hidden', 'flex');

function closeModal() { modal.classList.replace('flex', 'hidden'); }

function saveTask() {
    const title = document.getElementById('task-input').value;
    const datetime = document.getElementById('task-datetime').value;
    const priority = document.getElementById('task-priority').value;

    if (!title) return alert("Please enter a task");

    const newTask = {
        id: Date.now(),
        title,
        datetime,
        priority,
        completed: false,
        createdAt: new Date()
    };

    state.tasks.unshift(newTask);
    saveAndRender();
    closeModal();
    document.getElementById('task-input').value = '';
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    task.completed = !task.completed;
    if(task.completed) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    renderTasks();
    updateAnalytics();
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = state.tasks.map(task => `
        <div class="glass-card p-5 rounded-3xl flex items-center gap-4 transition-all ${task.completed ? 'opacity-50' : ''}">
            <div onclick="toggleTask(${task.id})" class="w-6 h-6 border-2 border-indigo-500 rounded-full flex-shrink-0 cursor-pointer flex items-center justify-center">
                ${task.completed ? '<div class="w-3 h-3 bg-indigo-500 rounded-full"></div>' : ''}
            </div>
            <div class="flex-1">
                <h4 class="font-semibold ${task.completed ? 'line-through' : ''}">${task.title}</h4>
                <p class="text-xs text-slate-400">${task.datetime ? new Date(task.datetime).toLocaleString() : 'No deadline'}</p>
            </div>
            <span class="text-[10px] px-2 py-1 rounded-full uppercase font-bold ${getPriorityClass(task.priority)}">${task.priority}</span>
        </div>
    `).join('');
}

function getPriorityClass(p) {
    if (p === 'high') return 'bg-red-100 text-red-600';
    if (p === 'medium') return 'bg-orange-100 text-orange-600';
    return 'bg-blue-100 text-blue-600';
}

// --- REMINDERS & NOTIFICATIONS ---
async function requestNotificationPermission() {
    if ("Notification" in window) await Notification.requestPermission();
}

function checkReminders() {
    const now = new Date().getTime();
    state.tasks.forEach(task => {
        if (task.datetime && !task.completed) {
            const taskTime = new Date(task.datetime).getTime();
            if (Math.abs(now - taskTime) < 30000) { // If within 30 seconds
                new Notification("ZenTask Reminder", { body: task.title });
            }
        }
    });
}

// --- ANALYTICS ---
function initCharts() {
    const ctx = document.getElementById('productivityChart').getContext('2d');
    window.prodChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Tasks Completed',
                data: [2, 5, 3, 8, 4, 0, 0],
                borderColor: '#6366f1',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.1)'
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
    });
}

function updateAnalytics() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    document.getElementById('stat-completed').innerText = completedCount;
    // Real logic for streak and chart would be updated here based on task.createdAt
}

function updateDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString(undefined, options);
}
