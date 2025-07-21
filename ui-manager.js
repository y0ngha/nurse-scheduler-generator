// ==============================================
// UI 관리 클래스
// ==============================================
class UIManager {
    static displaySchedule(schedule) {
        const tbody = document.getElementById('scheduleBody');
        tbody.innerHTML = '';

        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            const row = document.createElement('tr');
            
            // 날짜 컬럼
            const dateCell = document.createElement('td');
            dateCell.textContent = `8/${day}`;
            row.appendChild(dateCell);

            // 각 사람별 근무
            CONFIG.PEOPLE.forEach(person => {
                const cell = document.createElement('td');
                const shift = schedule[day][person] || '';
                cell.textContent = shift;
                cell.className = `shift-${shift}`;
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        }
        
        this.updateSummary(schedule);
    }

    static updateSummary(schedule) {
        const counts = Utils.getShiftCounts(schedule);
        
        // UI 업데이트
        Object.entries(counts).forEach(([person, shifts], index) => {
            const personNum = index + 1;
            Object.entries(shifts).forEach(([shift, count]) => {
                const elementId = `p${personNum}-${shift.toLowerCase()}`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = count;
                }
            });
        });

        document.getElementById('summary').style.display = 'flex';
    }

    static showStatus(message, isError = false) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'status error' : 'status success';
        statusDiv.style.display = 'block';
    }
}