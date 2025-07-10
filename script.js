// 애플리케이션 전체를 감싸는 즉시 실행 함수 (IIFE)
(function () {
    // 1. 상태(State) 관리
    const state = {
        currentDate: new Date(),
        calendarData: JSON.parse(localStorage.getItem('calendarData')) || { events: {}, longTermEvents: [] },
        editingType: null, // 'day' 또는 'long-term'
        editingId: null, // 날짜 문자열 또는 장기 일정 id
    };

    // 2. DOM 요소 관리 (수정됨)
    const elements = {
        monthYear: document.getElementById('month-year'),
        calendarGrid: document.getElementById('calendar-grid'),
        longTermEventLayer: document.getElementById('long-term-event-layer'),
        prevMonthBtn: document.getElementById('prev-month'),
        nextMonthBtn: document.getElementById('next-month'),
        memoModal: document.getElementById('memo-modal'),
        memoDate: document.getElementById('memo-date'),
        addEventBtn: document.getElementById('add-event-btn'),
        eventList: document.getElementById('event-list'),
        memoTextarea: document.getElementById('memo-textarea'),
        saveDataBtn: document.getElementById('save-data-btn'),
        deleteEventBtn: document.getElementById('delete-event-btn'),
        longTermConfirmModal: document.getElementById('long-term-confirm-modal'),
        longTermRangeText: document.getElementById('long-term-range-text'),
        confirmLongTermYesBtn: document.getElementById('confirm-long-term-yes'),
        confirmLongTermNoBtn: document.getElementById('confirm-long-term-no'),
        longTermEventModal: document.getElementById('long-term-event-modal'),
        longTermModalTitle: document.getElementById('long-term-modal-title'),
        longTermEventInput: document.getElementById('long-term-event-input'),
        saveLongTermEventBtn: document.getElementById('save-long-term-event-btn'),
        
        // <<<<<<<<<<<<<<< 누락되었던 사이드 메뉴 요소들 복구 >>>>>>>>>>>>>>>>>
        sideMenu: document.getElementById('side-menu'),
        openMenuBtn: document.getElementById('open-menu-btn'),
        closeMenuBtn: document.getElementById('close-menu-btn'),
        overlay: document.getElementById('overlay'),
    };

    // 3. 헬퍼(Helper) 및 유틸리티 함수
    const saveData = () => localStorage.setItem('calendarData', JSON.stringify(state.calendarData));
    const formatDate = (date) => date.toISOString().split('T')[0];
    const showModal = (modal) => modal.style.display = 'flex';
    const closeAllModals = () => {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        state.editingType = null;
        state.editingId = null;
    };

    // 4. 핵심 기능 함수
    const renderCalendar = () => {
        // (renderCalendar 함수는 이전과 동일)
        elements.calendarGrid.innerHTML = '';
        elements.longTermEventLayer.innerHTML = '';
        const { year, month } = { year: state.currentDate.getFullYear(), month: state.currentDate.getMonth() };
        elements.monthYear.textContent = `${year}년 ${month + 1}월`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
        let date = 1;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('div');
                cell.classList.add('date-cell');
                if (i === 0 && j < firstDayOfMonth || date > lastDateOfMonth) {
                    cell.classList.add('other-month');
                } else {
                    const dateString = formatDate(new Date(year, month, date));
                    cell.dataset.date = dateString;
                    const dayNumber = document.createElement('span');
                    dayNumber.classList.add('day-number');
                    dayNumber.textContent = date;
                    cell.appendChild(dayNumber);
                    if (dateString === formatDate(new Date())) cell.classList.add('today');
                    const dayData = state.calendarData.events[dateString];
                    if (dayData?.memo) dayNumber.appendChild(Object.assign(document.createElement('div'), { className: 'memo-indicator' }));
                    if (dayData?.events?.length > 0) {
                        dayData.events.slice(0, 3).forEach(event => cell.appendChild(Object.assign(document.createElement('div'), { className: 'event-pill', textContent: event.text })));
                    }
                    date++;
                }
                elements.calendarGrid.appendChild(cell);
            }
        }
        renderLongTermEvents();
    };

    const renderLongTermEvents = () => {
        // (renderLongTermEvents 함수는 이전과 동일)
        const { year, month } = { year: state.currentDate.getFullYear(), month: state.currentDate.getMonth() };
        const firstVisibleDate = new Date(year, month, 1 - new Date(year, month, 1).getDay());
        const weeklyOffsets = Array(6).fill(0);
        state.calendarData.longTermEvents.forEach(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            for (let d = new Date(eventStart); d <= eventEnd; d.setDate(d.getDate() + 1)) {
                if (d.getDay() === 0 || d.getTime() === eventStart.getTime()) {
                    const timeDiff = d.getTime() - firstVisibleDate.getTime();
                    if (timeDiff >= -1 * 24 * 60 * 60 * 1000) {
                        const weekIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
                        if (weekIndex < 0 || weekIndex > 5) continue;
                        const startDayOfWeek = d.getDay();
                        let endOfWeek = new Date(d);
                        endOfWeek.setDate(d.getDate() + (6 - startDayOfWeek));
                        const barEndDate = eventEnd < endOfWeek ? eventEnd : endOfWeek;
                        const duration = Math.round((barEndDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        const bar = document.createElement('div');
                        bar.className = 'long-term-event-bar';
                        if (event.memo) bar.classList.add('has-memo');
                        bar.textContent = event.text;
                        bar.dataset.eventId = event.id;
                        bar.style.gridRow = `${weekIndex + 1}`;
                        bar.style.gridColumn = `${startDayOfWeek + 1} / span ${duration}`;
                        bar.style.marginBottom = `${5 + weeklyOffsets[weekIndex] * 27}px`;
                        elements.longTermEventLayer.appendChild(bar);
                        weeklyOffsets[weekIndex]++;
                    }
                }
            }
        });
    };

    // <<<<<<<<<<<<<<< 누락되었던 메뉴 핸들러 함수 복구 >>>>>>>>>>>>>>>>>
    const openMenu = () => {
        elements.sideMenu.classList.add('open');
        elements.overlay.classList.add('active');
    };
    const closeMenu = () => {
        elements.sideMenu.classList.remove('open');
        elements.overlay.classList.remove('active');
    };
    
    const openDayMemoModal = (dateString) => {
        state.editingType = 'day';
        state.editingId = dateString;
        elements.memoDate.textContent = `${dateString.split('-')[0]}년 ${Number(dateString.split('-')[1])}월 ${Number(dateString.split('-')[2])}일`;
        elements.deleteEventBtn.style.display = 'none';
        const dayData = state.calendarData.events[dateString] || {};
        populateMemoModal(dayData);
    };

    const openLongTermMemoModal = (eventId) => {
        const event = state.calendarData.longTermEvents.find(e => e.id === eventId);
        if (!event) return;
        state.editingType = 'long-term';
        state.editingId = eventId;
        elements.memoDate.textContent = `${event.start} ~ ${event.end}`;
        elements.deleteEventBtn.style.display = 'inline-block';
        populateMemoModal(event);
    };

    const populateMemoModal = (data) => {
        elements.eventList.innerHTML = '';
        if (data.events) {
            data.events.forEach(event => createEventItem(event.time, event.text));
        }
        elements.memoTextarea.value = data.memo || '';
        showModal(elements.memoModal);
    };

    const createEventItem = (time = '', text = '') => {
        const item = document.createElement('div');
        item.classList.add('event-item');
        item.innerHTML = `<input type="time" value="${time}"><input type="text" placeholder="일정 내용" value="${text}"><button class="delete-event-btn">×</button>`;
        item.querySelector('.delete-event-btn').addEventListener('click', () => item.remove());
        elements.eventList.appendChild(item);
    };

    // 5. 이벤트 리스너 등록 함수
    const addEventListeners = () => {
        // 월 이동
        elements.prevMonthBtn.addEventListener('click', () => { state.currentDate.setMonth(state.currentDate.getMonth() - 1); renderCalendar(); });
        elements.nextMonthBtn.addEventListener('click', () => { state.currentDate.setMonth(state.currentDate.getMonth() + 1); renderCalendar(); });
        
        // <<<<<<<<<<<<<<< 누락되었던 메뉴 이벤트 리스너 복구 >>>>>>>>>>>>>>>>>
        elements.openMenuBtn.addEventListener('click', openMenu);
        elements.closeMenuBtn.addEventListener('click', closeMenu);
        elements.overlay.addEventListener('click', closeMenu);

        // 모달 공통
        document.querySelectorAll('.modal .close-button').forEach(btn => btn.addEventListener('click', closeAllModals));
        
        // 단기/장기 일정 저장 및 삭제
        elements.addEventBtn.addEventListener('click', () => createEventItem());
        elements.saveDataBtn.addEventListener('click', () => {
            if (!state.editingType || !state.editingId) return;
            const events = Array.from(elements.eventList.querySelectorAll('.event-item')).map(item => ({ time: item.querySelector('input[type="time"]').value, text: item.querySelector('input[type="text"]').value.trim() })).filter(e => e.text);
            events.sort((a, b) => { if (a.time && b.time) return a.time.localeCompare(b.time); return a.time ? -1 : (b.time ? 1 : 0); });
            const memo = elements.memoTextarea.value.trim();
            const hasContent = events.length > 0 || memo;
            if (state.editingType === 'day') {
                if (hasContent) {
                    state.calendarData.events[state.editingId] = { events, memo };
                } else { delete state.calendarData.events[state.editingId]; }
            } else if (state.editingType === 'long-term') {
                const event = state.calendarData.longTermEvents.find(e => e.id === state.editingId);
                if (event) { event.events = events; event.memo = memo; }
            }
            saveData();
            closeAllModals();
            renderCalendar();
        });
        elements.deleteEventBtn.addEventListener('click', () => {
            if (state.editingType !== 'long-term' || !state.editingId) return;
            if (window.confirm('이 장기 일정을 정말 삭제하시겠습니까?')) {
                state.calendarData.longTermEvents = state.calendarData.longTermEvents.filter(e => e.id !== state.editingId);
                saveData();
                closeAllModals();
                renderCalendar();
            }
        });

        // 드래그 및 클릭 이벤트
        elements.calendarGrid.addEventListener('mousedown', e => {
            const cell = e.target.closest('.date-cell:not(.other-month)');
            if (cell) {
                state.isDragging = true;
                state.dragStartDate = state.dragEndDate = cell.dataset.date;
                cell.classList.add('selecting'); e.preventDefault();
            }
        });
        elements.calendarGrid.addEventListener('mouseover', e => {
            if (!state.isDragging) return;
            const cell = e.target.closest('.date-cell:not(.other-month)');
            if (cell && cell.dataset.date !== state.dragEndDate) {
                state.dragEndDate = cell.dataset.date;
                document.querySelectorAll('.date-cell.selecting').forEach(c => c.classList.remove('selecting'));
                let start = new Date(state.dragStartDate), end = new Date(state.dragEndDate);
                if (start > end) [start, end] = [end, start];
                document.querySelectorAll('.date-cell[data-date]').forEach(c => {
                    const cellDate = new Date(c.dataset.date);
                    if (cellDate >= start && cellDate <= end) c.classList.add('selecting');
                });
            }
        });
        window.addEventListener('mouseup', () => {
            if (!state.isDragging) return;
            state.isDragging = false;
            setTimeout(() => document.querySelectorAll('.date-cell.selecting').forEach(c => c.classList.remove('selecting')), 100);
            if (state.dragStartDate && state.dragEndDate && state.dragStartDate !== state.dragEndDate) {
                if (new Date(state.dragStartDate) > new Date(state.dragEndDate)) [state.dragStartDate, state.dragEndDate] = [state.dragEndDate, state.dragStartDate];
                elements.longTermRangeText.textContent = `${state.dragStartDate} ~ ${state.dragEndDate}`;
                showModal(elements.longTermConfirmModal);
            } else if (state.dragStartDate) {
                openDayMemoModal(state.dragStartDate);
            }
        });
        elements.longTermEventLayer.addEventListener('click', (e) => {
            const bar = e.target.closest('.long-term-event-bar');
            if (bar?.dataset.eventId) {
                openLongTermMemoModal(Number(bar.dataset.eventId));
            }
        });
        
        // 장기 일정 생성 모달
        elements.confirmLongTermYesBtn.addEventListener('click', () => { closeAllModals(); elements.longTermModalTitle.textContent = `${state.dragStartDate} ~ ${state.dragEndDate}`; elements.longTermEventInput.value = ''; showModal(elements.longTermEventModal); });
        elements.confirmLongTermNoBtn.addEventListener('click', closeAllModals);
        elements.saveLongTermEventBtn.addEventListener('click', () => {
            const text = elements.longTermEventInput.value.trim();
            if (text) { state.calendarData.longTermEvents.push({ id: Date.now(), start: state.dragStartDate, end: state.dragEndDate, text, events: [], memo: '' }); saveData(); renderCalendar(); }
            closeAllModals();
        });
    };

    // 6. 애플리케이션 초기화
    const init = () => {
        addEventListeners();
        renderCalendar();
    };

    init();
})();