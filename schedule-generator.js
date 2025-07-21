// ==============================================
// 스케줄 생성기 클래스
// ==============================================
class ScheduleGenerator {
    /**
     * 메인 스케줄 생성 함수
     * @returns {Object} 완성된 스케줄 객체
     */
    static generate() {
        let schedule = Utils.createEmptySchedule();
        
        // 1단계: 필수 오프 배치
        schedule = ScheduleGenerator.assignMandatoryOffs(schedule);
        console.log('1단계 완료: 필수 오프 배치');
        
        // 2단계: 사람3 나이트 패턴 배치
        schedule = ScheduleGenerator.assignPerson3Pattern(schedule);
        console.log('2단계 완료: 사람3 나이트 패턴 배치');
        
        // TODO: 다음 단계들 추가 예정
        // schedule = ScheduleGenerator.assign24HourCoverage(schedule);
        // schedule = ScheduleGenerator.assignRemainingShifts(schedule);
        
        return schedule;
    }
    
    /**
     * 1단계: 필수 오프 배치 (순수함수)
     * @param {Object} inputSchedule - 입력 스케줄
     * @returns {Object} 필수 오프가 배치된 새로운 스케줄
     */
    static assignMandatoryOffs(inputSchedule) {
        // 입력 스케줄을 변경하지 않고 복사본 생성
        const schedule = Utils.deepCopy(inputSchedule);
        
        // 사람1 필수 오프 배치
        CONFIG.CONSTRAINTS.PERSON1_OFF_DAYS.forEach(day => {
            schedule[day].person1 = 'O';
        });
        
        // 사람3 필수 오프 배치  
        CONFIG.CONSTRAINTS.PERSON3_OFF_DAYS.forEach(day => {
            schedule[day].person3 = 'O';
        });
        
        return schedule;
    }

    /**
     * 2단계: 사람3 나이트 패턴 배치 (순수함수)
     * 나이트 3일 연속 + 오프 3일 패턴으로 총 14개 나이트 배치
     * @param {Object} inputSchedule - 입력 스케줄
     * @returns {Object} 사람3 나이트 패턴이 배치된 새로운 스케줄
     */
    static assignPerson3Pattern(inputSchedule) {
        const schedule = Utils.deepCopy(inputSchedule);
        
        // 사람3의 현재 오프 날짜 확인
        const existingOffs = ScheduleGeneratorHelpers.getExistingOffs(schedule, 'person3');
        
        // 가능한 나이트 패턴 위치들 계산
        const possiblePatterns = ScheduleGeneratorHelpers.findPossibleNightPatterns(schedule, existingOffs);
        
        // 최적의 패턴 조합 선택하여 배치
        const selectedPatterns = ScheduleGeneratorHelpers.selectOptimalPatterns(possiblePatterns);
        
        // 선택된 패턴들을 스케줄에 적용
        ScheduleGeneratorHelpers.applyNightPatterns(schedule, selectedPatterns);
        
        return schedule;
    }
}

// ==============================================
// 스케줄 생성기 헬퍼 함수들
// ==============================================
const ScheduleGeneratorHelpers = {
    /**
     * 기존 오프 날짜들을 가져오는 헬퍼 함수
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @returns {Array} 오프 날짜 배열
     */
    getExistingOffs(schedule, person) {
        const offs = [];
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            if (schedule[day][person] === 'O') {
                offs.push(day);
            }
        }
        return offs;
    },
    
    /**
     * 가능한 나이트 패턴 위치들을 찾는 함수
     * @param {Object} schedule - 스케줄
     * @param {Array} existingOffs - 기존 오프 날짜들
     * @returns {Array} 가능한 패턴 시작 날짜들
     */
    findPossibleNightPatterns(schedule, existingOffs) {
        const possibleStarts = [];
        
        for (let startDay = 1; startDay <= CONFIG.DAYS_IN_AUGUST - 5; startDay++) {
            if (this.canPlacePattern(schedule, startDay, existingOffs)) {
                possibleStarts.push(startDay);
            }
        }
        
        return possibleStarts;
    },
    
    /**
     * 특정 위치에 나이트 패턴을 배치할 수 있는지 확인
     * @param {Object} schedule - 스케줄
     * @param {number} startDay - 시작 날짜
     * @param {Array} existingOffs - 기존 오프 날짜들
     * @returns {boolean} 배치 가능 여부
     */
    canPlacePattern(schedule, startDay, existingOffs) {
        // 나이트 3일 + 오프 3일 = 총 6일 필요
        for (let i = 0; i < 6; i++) {
            const day = startDay + i;
            
            // 날짜 범위 초과 체크
            if (day > CONFIG.DAYS_IN_AUGUST) return false;
            
            // 이미 배치된 근무가 있는지 체크
            if (schedule[day].person3 !== null) {
                // 기존 오프와 겹치는 경우는 허용 (오프 3일 구간에서)
                if (i >= 3 && schedule[day].person3 === 'O') {
                    continue;
                } else {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    /**
     * 최적의 패턴 조합을 선택하는 함수
     * @param {Array} possiblePatterns - 가능한 패턴 시작 날짜들
     * @returns {Array} 선택된 패턴 시작 날짜들 (14개 나이트가 되도록)
     */
    selectOptimalPatterns(possiblePatterns) {
        // 나이트 14개 = 패턴 4번 + 나이트 2개 추가 또는 패턴 4번 + 패턴 1부분
        // 일단 간단하게 4패턴 + 2개 나이트로 구현
        const selected = [];
        let nightsPlaced = 0;
        const patternLength = 6; // 나이트 3일 + 오프 3일
        
        for (const startDay of possiblePatterns) {
            // 겹치지 않는 패턴만 선택
            if (this.isPatternOverlapping(selected, startDay, patternLength)) {
                continue;
            }
            
            selected.push(startDay);
            nightsPlaced += 3; // 패턴당 나이트 3개
            
            // 목표 나이트 수에 도달하면 중단
            if (nightsPlaced >= 12) { // 4패턴 = 12개 나이트
                break;
            }
        }
        
        return selected;
    },
    
    /**
     * 패턴이 기존 선택된 패턴들과 겹치는지 확인
     * @param {Array} selectedPatterns - 이미 선택된 패턴들
     * @param {number} newStart - 새로운 패턴 시작 날짜
     * @param {number} patternLength - 패턴 길이
     * @returns {boolean} 겹침 여부
     */
    isPatternOverlapping(selectedPatterns, newStart, patternLength) {
        for (const existingStart of selectedPatterns) {
            const existingEnd = existingStart + patternLength - 1;
            const newEnd = newStart + patternLength - 1;
            
            // 겹침 체크
            if (!(newEnd < existingStart || newStart > existingEnd)) {
                return true;
            }
        }
        return false;
    },
    
    /**
     * 선택된 패턴들을 스케줄에 적용하는 함수
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {Array} selectedPatterns - 선택된 패턴 시작 날짜들
     */
    applyNightPatterns(schedule, selectedPatterns) {
        for (const startDay of selectedPatterns) {
            // 나이트 3일
            for (let i = 0; i < 3; i++) {
                const day = startDay + i;
                if (day <= CONFIG.DAYS_IN_AUGUST) {
                    schedule[day].person3 = 'N';
                }
            }
            
            // 오프 3일
            for (let i = 3; i < 6; i++) {
                const day = startDay + i;
                if (day <= CONFIG.DAYS_IN_AUGUST && schedule[day].person3 === null) {
                    schedule[day].person3 = 'O';
                }
            }
        }
        
        // 추가 나이트가 필요한 경우 (14개 목표)
        this.addRemainingNights(schedule, selectedPatterns);
    },
    
    /**
     * 목표 나이트 수(14개)를 맞추기 위해 추가 나이트 배치
     * @param {Object} schedule - 스케줄 (변경됨)  
     * @param {Array} selectedPatterns - 이미 배치된 패턴들
     */
    addRemainingNights(schedule, selectedPatterns) {
        const currentNights = Utils.countShifts(schedule, 'person3', 'N');
        const needMoreNights = CONFIG.CONSTRAINTS.MAX_NIGHT_SHIFTS.person3 - currentNights;
        
        if (needMoreNights <= 0) return;
        
        // 빈 날짜들 중에서 나이트 배치 가능한 곳 찾기
        let nightsAdded = 0;
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST && nightsAdded < needMoreNights; day++) {
            if (schedule[day].person3 === null) {
                // 나이트 패턴 규칙 확인 (단독 나이트는 허용하지 않음)
                // 임시로 단독 나이트도 허용
                schedule[day].person3 = 'N';
                nightsAdded++;
            }
        }
    }
};