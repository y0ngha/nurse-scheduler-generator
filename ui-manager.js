// ==============================================
// UI 관리 클래스
// ==============================================
class UIManager {
    /**
     * 초기 UI 구성 요소들을 동적으로 생성
     */
    static initializeUI() {
        console.log('UI 초기화 시작...');
        
        let successCount = 0;
        let totalCount = 3;
        
        try {
            this.createConstraintsList();
            successCount++;
        } catch (error) {
            console.warn('제약조건 목록 생성 실패:', error);
        }
        
        try {
            this.createTableHeader();
            successCount++;
        } catch (error) {
            console.warn('테이블 헤더 생성 실패:', error);
        }
        
        try {
            this.createSummarySection();
            successCount++;
        } catch (error) {
            console.warn('요약 섹션 생성 실패:', error);
        }
        
        console.log('UI 초기화 완료: ' + successCount + '/' + totalCount + ' 성공');
    }

    /**
     * 제약조건 목록을 동적으로 생성
     */
    static createConstraintsList() {
        let constraintsList = document.getElementById('constraints-list');
        
        // 요소가 없으면 생성
        if (!constraintsList) {
            console.log('constraints-list 요소가 없어서 생성합니다.');
            const constraintsInfo = document.querySelector('.constraints-info');
            if (constraintsInfo) {
                constraintsList = document.createElement('div');
                constraintsList.id = 'constraints-list';
                constraintsInfo.appendChild(constraintsList);
            } else {
                console.error('constraints-info 요소도 찾을 수 없습니다');
                return;
            }
        }
        
        // 기존 내용 제거
        constraintsList.innerHTML = '';
        
        const ul = document.createElement('ul');
        
        // 사람별 제약조건
        for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
            const person = CONFIG.PEOPLE[i];
            const config = CONFIG.getPersonConfig(person);
            const li = document.createElement('li');
            
            let constraints = [];
            
            // 허용 근무 유형
            const shiftTypes = config.allowedShifts.filter(function(s) { return s !== 'O'; }).join('/');
            if (config.isNightSpecialist) {
                constraints.push('나이트 전담');
            } else {
                constraints.push(shiftTypes + ' 근무');
            }
            
            // 필수 오프
            if (config.mandatoryOffs.length > 0) {
                const offDays = config.mandatoryOffs.map(function(day) { return '8/' + day; }).join(', ');
                constraints.push(offDays + ' 오프');
            }
            
            // 나이트 제한
            if (config.maxNightShifts > 0) {
                if (config.isNightSpecialist) {
                    constraints.push('나이트 ' + config.maxNightShifts + '개');
                } else {
                    constraints.push('나이트 ≤' + config.maxNightShifts + '개');
                }
            }
            
            // 오프 개수
            if (config.requiredOffs) {
                constraints.push('오프 ' + config.requiredOffs.min + '-' + config.requiredOffs.max + '개');
            } else {
                constraints.push('오프는 나이트 패턴에 따라 자동 결정');
            }
            
            li.innerHTML = '<strong>' + config.name + '</strong>: ' + constraints.join(', ');
            ul.appendChild(li);
        }
        
        // 공통 제약조건
        const commonLi = document.createElement('li');
        commonLi.innerHTML = '<strong>공통</strong>: E 후 D 불가, 근무 4일 후 최소 1일 오프, N은 3일 연속';
        ul.appendChild(commonLi);
        
        const coverageLi = document.createElement('li');
        coverageLi.innerHTML = '<strong>24시간 커버리지</strong>: 매일 D-E-N 모두 배치';
        ul.appendChild(coverageLi);
        
        constraintsList.appendChild(ul);
        console.log('제약조건 목록 생성 완료');
    }

    /**
     * 테이블 헤더를 동적으로 생성
     */
    static createTableHeader() {
        const headerRow = document.getElementById('table-header');
        if (!headerRow) {
            console.error('table-header 요소를 찾을 수 없습니다');
            return;
        }
        
        headerRow.innerHTML = '';
        
        // 날짜 컬럼
        const dateHeader = document.createElement('th');
        dateHeader.textContent = '날짜';
        headerRow.appendChild(dateHeader);
        
        // 각 사람별 컬럼
        CONFIG.PEOPLE.forEach(person => {
            const config = CONFIG.getPersonConfig(person);
            const th = document.createElement('th');
            th.textContent = config.name;
            headerRow.appendChild(th);
        });
    }

    /**
     * 요약 섹션을 동적으로 생성
     */
    static createSummarySection() {
        const summaryDiv = document.getElementById('summary');
        if (!summaryDiv) {
            console.error('summary 요소를 찾을 수 없습니다');
            return;
        }
        
        summaryDiv.innerHTML = '';
        
        CONFIG.PEOPLE.forEach((person, index) => {
            const config = CONFIG.getPersonConfig(person);
            const personDiv = document.createElement('div');
            
            const heading = document.createElement('h4');
            heading.textContent = config.name;
            personDiv.appendChild(heading);
            
            const paragraph = document.createElement('p');
            const spans = CONFIG.SHIFTS.map(shift => {
                const spanId = `p${index + 1}-${shift.toLowerCase()}`;
                return `${shift}: <span id="${spanId}">0</span>`;
            }).join(', ');
            
            paragraph.innerHTML = spans;
            personDiv.appendChild(paragraph);
            
            summaryDiv.appendChild(personDiv);
        });
    }

    static displaySchedule(schedule) {
        const tbody = document.getElementById('scheduleBody');
        tbody.innerHTML = '';

        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            const row = document.createElement('tr');
            
            // 날짜 컬럼
            const dateCell = document.createElement('td');
            dateCell.textContent = `8/${day}`;
            row.appendChild(dateCell);

            // 각 사람별 근무 (동적으로 생성)
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
        
        // UI 업데이트 (동적으로 처리)
        CONFIG.PEOPLE.forEach((person, index) => {
            const personNum = index + 1;
            CONFIG.SHIFTS.forEach(shift => {
                const elementId = `p${personNum}-${shift.toLowerCase()}`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = counts[person][shift];
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