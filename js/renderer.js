// ============================================================
// RENDERER.JS — Toàn bộ logic render giao diện
// ============================================================
import { state, saveState } from './state.js';
import { formatDate } from './state.js';

// --- CẬP NHẬT SIDEBAR ---
function updateSidebar() {
    document.getElementById('tab-calendar').className =
        `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${state.activeTab === 'calendar'
            ? 'bg-indigo-50 text-indigo-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-100'}`;

    document.getElementById('tab-goals').className =
        `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${state.activeTab === 'goals'
            ? 'bg-indigo-50 text-indigo-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-100'}`;
}

// --- CẬP NHẬT HEADER ---
function updateHeader() {
    const titleEl = document.getElementById('header-title');
    const switcherEl = document.getElementById('view-switcher');

    if (state.activeTab === 'calendar') {
        titleEl.innerText = 'Lịch làm việc';
        switcherEl.classList.remove('hidden');

        ['day', 'week', 'month'].forEach(v => {
            const btn = document.getElementById(`view-${v}`);
            if (v === state.calendarView) {
                btn.className = 'px-3 py-1 text-sm font-medium rounded-md bg-white shadow-sm text-indigo-600';
            } else {
                btn.className = 'px-3 py-1 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900';
            }
        });
    } else {
        titleEl.innerText = 'Quản lý Mục tiêu & Tiến độ';
        switcherEl.classList.add('hidden');
    }
}

// --- RENDER TASK BLOCK (dùng chung cho Day & Week view) ---
function generateTaskBlockHTML(task, topOffset, heightPx) {
    const goal = state.goals.find(g => g.id === task.goalId);

    let colorClasses = 'bg-gray-100 border-gray-300';
    let icon = '<div class="w-4 h-4 rounded-full border-2 border-gray-400"></div>';
    let titleClasses = 'text-xs font-bold truncate leading-tight';
    let descClasses = 'text-[11px] mt-1 italic opacity-80 leading-snug';

    if (task.status === 'Completed') {
        colorClasses = 'bg-green-100 border-green-300 text-green-900 opacity-80';
        icon = '<i class="fa-solid fa-circle-check text-green-600 text-base"></i>';
        titleClasses += ' completed-strike text-green-800';
        descClasses += ' completed-strike';
    } else if (task.status === 'Missed') {
        colorClasses = 'bg-red-50 border-red-300 text-red-800';
        icon = '<i class="fa-solid fa-circle-exclamation text-red-500 text-base"></i>';
    } else if (goal) {
        colorClasses = `bg-${goal.color}-50 border-${goal.color}-300 text-${goal.color}-900`;
        icon = `<div class="w-4 h-4 rounded-full border-2 border-${goal.color}-400 bg-white"></div>`;
    }

    const formatTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    let descHtml = '';
    if (task.description && heightPx > 40) {
        descHtml = `<div class="${descClasses} overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">- ${task.description}</div>`;
    }

    return `
        <div data-action="toggle-task" data-task-id="${task.id}"
             class="absolute left-1 right-1 rounded-lg border-[1.5px] p-2 shadow-sm flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:brightness-95 transition-all z-10 ${colorClasses}"
             style="top:${topOffset}px;height:${heightPx}px;" title="Bấm để đánh dấu Xong/Chưa xong">
            <div class="overflow-hidden">
                <div class="${titleClasses}">${task.title}</div>
                ${descHtml}
            </div>
            <div class="flex justify-between items-end shrink-0 mt-1">
                <div class="flex items-center space-x-1">
                    ${icon}
                    <span class="text-[10px] font-medium opacity-70 ml-1">${formatTime(task.startTime)} - ${formatTime(task.endTime)}</span>
                </div>
                ${task.isRescheduled ? '<span class="text-[9px] font-bold uppercase bg-white/50 px-1 border border-amber-200 text-amber-800 rounded">Dời lịch</span>' : ''}
            </div>
        </div>
    `;
}

// --- DAY VIEW ---
function renderDayView() {
    const displayHours = Array.from({ length: 17 }, (_, i) => i + 6);
    let gridHtml = displayHours.map(() => `<div class="h-24 border-b border-gray-100"></div>`).join('');
    let tasksHtml = '';

    state.tasks.forEach(task => {
        if (new Date(task.startTime).toDateString() === state.currentDate.toDateString()) {
            const startH = new Date(task.startTime).getHours() + (new Date(task.startTime).getMinutes() / 60);
            const endH = new Date(task.endTime).getHours() + (new Date(task.endTime).getMinutes() / 60);
            if (startH >= displayHours[0] && startH <= displayHours[displayHours.length - 1]) {
                tasksHtml += generateTaskBlockHTML(task, (startH - displayHours[0]) * 96, (endH - startH) * 96);
            }
        }
    });

    return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-w-3xl mx-auto">
            <div class="p-4 border-b border-gray-200 bg-indigo-50 text-center shrink-0">
                <div class="text-lg font-bold text-indigo-800">
                    ${state.currentDate.getDate()}/${state.currentDate.getMonth() + 1}/${state.currentDate.getFullYear()}
                </div>
            </div>
            <div class="overflow-y-auto flex-1 flex" id="calendar-scroll-area">
                <div class="w-16 border-r border-gray-200 bg-gray-50 shrink-0">
                    ${displayHours.map(h => `
                        <div class="h-24 border-b border-gray-200 flex items-start justify-end pr-2 py-1">
                            <span class="text-xs text-gray-400 font-medium">${h}:00</span>
                        </div>`).join('')}
                </div>
                <div class="flex-1 relative">${gridHtml}${tasksHtml}</div>
            </div>
        </div>
    `;
}

// --- WEEK VIEW ---
function renderWeekView() {
    const displayHours = Array.from({ length: 17 }, (_, i) => i + 6);

    const d = new Date(state.currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
    });

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    let headersHtml = '';
    let columnsHtml = '';

    weekDays.forEach(date => {
        const isToday = date.toDateString() === new Date().toDateString();
        headersHtml += `
            <div class="p-3 text-center border-r border-gray-200 ${isToday ? 'bg-indigo-50' : ''}">
                <div class="text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-500'}">${dayNames[date.getDay()]}</div>
                <div class="text-lg font-bold ${isToday ? 'text-indigo-700' : 'text-gray-800'}">${date.getDate()}/${date.getMonth() + 1}</div>
            </div>`;

        let gridHtml = displayHours.map(() => `<div class="h-24 border-b border-gray-100"></div>`).join('');
        let tasksHtml = '';

        state.tasks
            .filter(t => new Date(t.startTime).toDateString() === date.toDateString())
            .forEach(task => {
                const startH = new Date(task.startTime).getHours() + (new Date(task.startTime).getMinutes() / 60);
                const endH = new Date(task.endTime).getHours() + (new Date(task.endTime).getMinutes() / 60);
                if (startH >= displayHours[0]) {
                    tasksHtml += generateTaskBlockHTML(task, (startH - displayHours[0]) * 96, (endH - startH) * 96);
                }
            });

        columnsHtml += `<div class="border-r border-gray-200 relative min-w-[120px]">${gridHtml}${tasksHtml}</div>`;
    });

    return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div class="grid grid-cols-8 border-b border-gray-200 bg-gray-50 shrink-0 min-w-[960px]">
                <div class="p-3 border-r border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">GMT+7</div>
                ${headersHtml}
            </div>
            <div class="overflow-y-auto overflow-x-auto flex-1 relative" id="calendar-scroll-area">
                <div class="grid grid-cols-8 relative min-h-max min-w-[960px]">
                    <div class="border-r border-gray-200 bg-gray-50 relative">
                        ${displayHours.map(h => `
                            <div class="h-24 border-b border-gray-200 flex items-start justify-end pr-2 py-1">
                                <span class="text-xs text-gray-400 font-medium">${h}:00</span>
                            </div>`).join('')}
                    </div>
                    ${columnsHtml}
                </div>
            </div>
        </div>
    `;
}

// --- MONTH VIEW ---
function renderMonthView() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    let cellsHtml = '';

    // Ô trống đầu tháng
    for (let i = 0; i < firstDay; i++) {
        cellsHtml += `<div class="bg-gray-50 border-r border-b border-gray-200 min-h-[120px] p-2"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const isToday = cellDate.toDateString() === new Date().toDateString();
        const dayTasks = state.tasks.filter(t => new Date(t.startTime).toDateString() === cellDate.toDateString());

        const tasksHtml = dayTasks.map(task => {
            const goal = state.goals.find(g => g.id === task.goalId);
            let bgColor = goal ? `bg-${goal.color}-100 text-${goal.color}-800` : 'bg-gray-100 text-gray-800';
            if (task.status === 'Completed') bgColor = 'bg-green-100 text-green-800 line-through opacity-60';
            if (task.status === 'Missed') bgColor = 'bg-red-100 text-red-800 font-medium border border-red-200';

            const h = new Date(task.startTime).getHours();
            const m = new Date(task.startTime).getMinutes().toString().padStart(2, '0');
            return `<div data-action="toggle-task" data-task-id="${task.id}"
                         class="text-[10px] truncate px-1.5 py-1 mb-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${bgColor}"
                         title="${task.title}">
                        ${h}:${m} - ${task.title}
                    </div>`;
        }).join('');

        cellsHtml += `
            <div class="border-r border-b border-gray-200 min-h-[120px] p-1 flex flex-col ${isToday ? 'bg-indigo-50/30' : 'bg-white'}">
                <div class="text-right mb-1">
                    <span class="inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}">${day}</span>
                </div>
                <div class="flex-1 overflow-y-auto hide-scrollbar">${tasksHtml}</div>
            </div>`;
    }

    return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div class="p-4 border-b border-gray-200 text-center bg-white flex justify-between items-center">
                <h3 class="text-lg font-bold text-gray-800 uppercase tracking-wide w-full">${monthNames[month]} - ${year}</h3>
            </div>
            <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shrink-0">
                ${dayNames.map(d => `<div class="p-2 text-center text-xs font-semibold text-gray-500 uppercase border-r border-gray-200">${d}</div>`).join('')}
            </div>
            <div class="flex-1 overflow-y-auto" id="calendar-scroll-area">
                <div class="grid grid-cols-7">${cellsHtml}</div>
            </div>
        </div>
    `;
}

// --- GOALS VIEW ---
function getGoalsWithProgress() {
    return state.goals.map(goal => {
        const goalTasks = state.tasks.filter(t => t.goalId === goal.id);
        const completed = goalTasks.filter(t => t.status === 'Completed').length;
        const progress = goalTasks.length > 0 ? Math.round((completed / goalTasks.length) * 100) : 0;
        return { ...goal, progress, totalTasks: goalTasks.length, completedTasks: completed };
    });
}

function renderGoalsView() {
    const goalsWithProgress = getGoalsWithProgress();

    const goalsHtml = goalsWithProgress.map(goal => {
        const sDate = formatDate(goal.startDate);
        const eDate = formatDate(goal.endDate);
        const diffTime = Math.abs(new Date(goal.endDate) - new Date(goal.startDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const timeStr = goal.type === 'Monthly' ? '1 Tháng' : `${diffDays} Ngày`;

        return `
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4">
                    <span class="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase">${goal.type}</span>
                </div>
                <div class="flex items-start mb-4 mt-2">
                    <div class="w-2 h-12 rounded-full bg-${goal.color}-500 mr-4 shrink-0"></div>
                    <div>
                        <h4 class="font-bold text-lg text-gray-900 leading-tight">${goal.title}</h4>
                        <div class="text-xs text-gray-500 mt-1.5 flex items-center">
                            <i class="fa-regular fa-calendar-days mr-1.5"></i>
                            <span>${sDate} - ${eDate}</span>
                            <span class="ml-2 font-medium bg-${goal.color}-50 text-${goal.color}-700 px-1.5 py-0.5 rounded text-[10px]">(${timeStr})</span>
                        </div>
                    </div>
                </div>
                <div class="mt-5">
                    <div class="flex justify-between text-sm font-medium mb-2">
                        <span class="text-gray-600">Tiến độ hoàn thành</span>
                        <span class="${goal.progress === 100 ? 'text-green-600' : 'text-indigo-600'}">${goal.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div class="h-3 rounded-full transition-all duration-1000 ease-out ${goal.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}" style="width:${goal.progress}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-3 flex items-center">
                        <i class="fa-solid fa-circle-check w-3 h-3 mr-1 text-green-500"></i>
                        Đã xong ${goal.completedTasks} / ${goal.totalTasks} công việc (Tasks)
                    </p>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="max-w-4xl mx-auto space-y-6" id="calendar-scroll-area">
            <div class="flex justify-between items-end mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">Mục tiêu của bạn</h3>
                    <p class="text-gray-500 mt-1">Theo dõi tiến độ và thời hạn các mục tiêu lớn.</p>
                </div>
                <button data-action="open-modal" data-modal="goal"
                        class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
                    <i class="fa-solid fa-plus mr-1"></i> Tạo Mục tiêu
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${goalsHtml}</div>
        </div>
    `;
}

// --- ENGINE RENDER CHÍNH (bảo toàn vị trí cuộn) ---
export function renderApp() {
    const appContent = document.getElementById('app-content');
    const scrollTarget = appContent.querySelector('#calendar-scroll-area');
    const lastScrollTop = scrollTarget ? scrollTarget.scrollTop : 0;

    updateSidebar();
    updateHeader();

    if (state.activeTab === 'calendar') {
        if (state.calendarView === 'day') appContent.innerHTML = renderDayView();
        else if (state.calendarView === 'week') appContent.innerHTML = renderWeekView();
        else appContent.innerHTML = renderMonthView();
    } else {
        appContent.innerHTML = renderGoalsView();
    }

    // Phục hồi vị trí cuộn
    const newScrollTarget = document.getElementById('calendar-scroll-area');
    if (newScrollTarget) newScrollTarget.scrollTop = lastScrollTop;

    saveState();
}
