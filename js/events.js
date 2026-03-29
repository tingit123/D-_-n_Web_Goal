// ============================================================
// EVENTS.JS — Xử lý toàn bộ sự kiện click & logic nghiệp vụ
// ============================================================
import { state, saveState, addDays, formatForInput, formatDateOnlyForInput } from './state.js';
import { showNotification, openModal, closeModal } from './ui.js';
import { renderApp } from './renderer.js';

// ID task đang chờ phản hồi từ modal overdue
let currentOverdueTaskId = null;

// --- HỆ THỐNG KIỂM TRA QUÁ HẠN (mỗi 5 giây) ---
export function startOverdueChecker() {
    setInterval(() => {
        const now = new Date();
        const justOverdueTask = state.tasks.find(t =>
            t.status === 'Pending' &&
            new Date(t.endTime) <= now &&
            !t.notifiedOverdue
        );

        if (justOverdueTask) {
            justOverdueTask.notifiedOverdue = true;
            saveState();

            currentOverdueTaskId = justOverdueTask.id;
            document.getElementById('overdue-task-name').innerText =
                justOverdueTask.title +
                (justOverdueTask.description ? ` (${justOverdueTask.description})` : '');

            const modal = document.getElementById('overdue-modal');
            const content = document.getElementById('overdue-modal-content');
            modal.classList.remove('hidden');
            setTimeout(() => content.classList.remove('scale-95'), 10);

            showNotification('Bạn có 1 thông báo từ Trợ lý FlexiCal', 'warning');
        }
    }, 5000);
}

// --- SMART RESCHEDULE ---
function smartReschedule() {
    const now = new Date();
    const overdueTasks = state.tasks.filter(t =>
        (t.status === 'Pending' && new Date(t.endTime) < now) || t.status === 'Missed'
    );

    if (overdueTasks.length === 0) {
        showNotification('Tuyệt vời! Không có việc nào bị trễ.', 'success');
        return;
    }

    let cursor = new Date();
    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(state.dailySettings.workStart, 0, 0, 0);

    overdueTasks.forEach(task => {
        const durationMs = new Date(task.endTime).getTime() - new Date(task.startTime).getTime();
        const newStart = new Date(cursor);
        const newEnd = new Date(newStart.getTime() + durationMs);

        task.startTime = newStart;
        task.endTime = newEnd;
        task.status = 'Pending';
        task.isRescheduled = true;
        task.notifiedOverdue = false;

        cursor = new Date(newEnd);
        if (cursor.getHours() >= state.dailySettings.workEnd) {
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(state.dailySettings.workStart, 0, 0, 0);
        }
    });

    showNotification(`Đã tự động dời ${overdueTasks.length} việc sang ngày mai!`, 'warning');
    renderApp();
}

// --- LƯU TASK MỚI ---
function saveTask() {
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const goalId = document.getElementById('task-goal').value;
    const startTime = new Date(document.getElementById('task-start').value);
    const endTime = new Date(document.getElementById('task-end').value);

    if (!title || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        showNotification('Điền đủ tên và giờ!', 'warning');
        return;
    }

    state.tasks.push({
        id: Date.now(),
        goalId: goalId ? parseInt(goalId) : null,
        title,
        description: desc,
        startTime,
        endTime,
        status: 'Pending',
        notifiedOverdue: false
    });

    closeModal('task');
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';

    showNotification('Đã thêm việc thành công!');
    renderApp();
}

// --- LƯU GOAL MỚI ---
function saveGoal() {
    const title = document.getElementById('goal-title').value;
    const type = document.getElementById('goal-type').value;
    const startVal = document.getElementById('goal-start').value;
    const endVal = document.getElementById('goal-end').value;
    const color = document.getElementById('goal-color').value;

    if (!title) {
        showNotification('Vui lòng nhập tên mục tiêu!', 'warning');
        return;
    }

    state.goals.push({
        id: Date.now(),
        title,
        type,
        color,
        startDate: startVal ? new Date(startVal).toISOString() : new Date().toISOString(),
        endDate: endVal ? new Date(endVal).toISOString() : new Date().toISOString()
    });

    closeModal('goal');
    document.getElementById('goal-title').value = '';

    showNotification('Đã tạo Mục tiêu mới thành công!');
    state.activeTab = 'goals';
    renderApp();
}

// --- ĐĂNG KÝ EVENT LISTENER CHÍNH ---
export function registerEventListeners() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');

        // --- NAVIGATION ---
        if (action === 'switch-tab') {
            state.activeTab = btn.getAttribute('data-tab');
            renderApp();
        }

        if (action === 'switch-view') {
            state.calendarView = btn.getAttribute('data-view');
            renderApp();
        }

        if (action === 'prev-date') {
            if (state.calendarView === 'day') state.currentDate = addDays(state.currentDate, -1);
            else if (state.calendarView === 'week') state.currentDate = addDays(state.currentDate, -7);
            else state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
            renderApp();
        }

        if (action === 'next-date') {
            if (state.calendarView === 'day') state.currentDate = addDays(state.currentDate, 1);
            else if (state.calendarView === 'week') state.currentDate = addDays(state.currentDate, 7);
            else state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
            renderApp();
        }

        if (action === 'today-date') {
            state.currentDate = new Date();
            renderApp();
        }

        // --- TOGGLE TASK STATUS ---
        if (action === 'toggle-task') {
            const taskId = parseInt(btn.getAttribute('data-task-id'));
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
                task.notifiedOverdue = true;
                renderApp();
            }
        }

        // --- MODAL OVERDUE ---
        if (action === 'overdue-completed' || action === 'overdue-missed') {
            const task = state.tasks.find(t => t.id === currentOverdueTaskId);
            if (task) {
                task.status = action === 'overdue-completed' ? 'Completed' : 'Missed';
                renderApp();
            }
            const content = document.getElementById('overdue-modal-content');
            content.classList.add('scale-95');
            setTimeout(() => document.getElementById('overdue-modal').classList.add('hidden'), 200);
            currentOverdueTaskId = null;
        }

        // --- MODAL OPEN/CLOSE ---
        if (action === 'open-modal') {
            const modalType = btn.getAttribute('data-modal');
            openModal(modalType, state, { formatForInput, formatDateOnlyForInput, addDays });
        }

        if (action === 'close-modal') {
            closeModal(btn.getAttribute('data-modal'));
        }

        // --- SAVE ACTIONS ---
        if (action === 'save-real-task') saveTask();
        if (action === 'save-real-goal') saveGoal();

        // --- SMART RESCHEDULE ---
        if (action === 'smart-reschedule') smartReschedule();
    });
}
