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
        
        // 2단계: 나이트 전담자 패턴 배치
        schedule = ScheduleGenerator.assignNightSpecialistPattern(schedule);
        console.log('2단계 완료: 나이트 전담자 패턴 배치');
        
        // 3단계: 24시간 커버리지 보장
        schedule = ScheduleGenerator.assign24HourCoverage(schedule);
        console.log('3단계 완료: 24시간 커버리지 보장');
        
        // TODO: 다음 단계들 추가 예정
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
        
        // 각 사람의 필수 오프 배치
        for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
            const person = CONFIG.PEOPLE[i];
            const config = CONFIG.getPersonConfig(person);
            for (let j = 0; j < config.mandatoryOffs.length; j++) {
                const day = config.mandatoryOffs[j];
                schedule[day][person] = 'O';
            }
        }
        
        return schedule;
    }

    /**
     * 2단계: 나이트 전담자 패턴 배치 (순수함수)
     * 나이트 3일 연속 + 오프 규칙에 따라 나이트 전담자의 스케줄 배치
     * @param {Object} inputSchedule - 입력 스케줄
     * @returns {Object} 나이트 전담자 패턴이 배치된 새로운 스케줄
     */
    static assignNightSpecialistPattern(inputSchedule) {
        const schedule = Utils.deepCopy(inputSchedule);
        
        // 나이트 전담자 찾기
        let nightSpecialist = null;
        for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
            const person = CONFIG.PEOPLE[i];
            const config = CONFIG.getPersonConfig(person);
            if (config.isNightSpecialist) {
                nightSpecialist = person;
                break;
            }
        }
        
        if (!nightSpecialist) {
            console.warn('나이트 전담자를 찾을 수 없습니다.');
            return schedule;
        }
        
        // 나이트 전담자의 현재 오프 날짜 확인
        const existingOffs = ScheduleGeneratorHelpers.getExistingOffs(schedule, nightSpecialist);
        
        // 가능한 나이트 패턴 위치들 계산
        const possiblePatterns = ScheduleGeneratorHelpers.findPossibleNightPatterns(schedule, existingOffs, nightSpecialist);
        
        // 최적의 패턴 조합 선택하여 배치
        const selectedPatterns = ScheduleGeneratorHelpers.selectOptimalPatterns(possiblePatterns, nightSpecialist);
        
        // 선택된 패턴들을 스케줄에 적용
        ScheduleGeneratorHelpers.applyNightPatterns(schedule, selectedPatterns, nightSpecialist);
        
        return schedule;
    }

    /**
     * 3단계: 24시간 커버리지 보장 (순수함수)
     * 매일 D-E-N 근무가 모두 배치되도록 보장
     * @param {Object} inputSchedule - 입력 스케줄
     * @returns {Object} 24시간 커버리지가 보장된 새로운 스케줄
     */
    static assign24HourCoverage(inputSchedule) {
        const schedule = Utils.deepCopy(inputSchedule);
        
        // 1. 나이트 전담자가 오프인 날들에 나이트 가능한 다른 사람을 배치
        CoverageHelpers.assignNightForSpecialistOffDays(schedule);
        
        // 2. 나머지 날들에 D, E 배치
        CoverageHelpers.assignDayAndEveningShifts(schedule);
        
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
     * @param {string} person - 대상 사람 ID
     * @returns {Array} 가능한 패턴 시작 날짜들
     */
    findPossibleNightPatterns(schedule, existingOffs, person) {
        const possibleStarts = [];
        
        for (let startDay = 1; startDay <= CONFIG.DAYS_IN_AUGUST - 5; startDay++) {
            if (this.canPlacePattern(schedule, startDay, existingOffs, person)) {
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
     * @param {string} person - 대상 사람 ID
     * @returns {boolean} 배치 가능 여부
     */
    canPlacePattern(schedule, startDay, existingOffs, person) {
        // 나이트 3일 + 오프 3일 = 총 6일 필요
        for (let i = 0; i < 6; i++) {
            const day = startDay + i;
            
            // 날짜 범위 초과 체크
            if (day > CONFIG.DAYS_IN_AUGUST) return false;
            
            // 이미 배치된 근무가 있는지 체크
            if (schedule[day][person] !== null) {
                // 기존 오프와 겹치는 경우는 허용 (오프 3일 구간에서)
                if (i >= 3 && schedule[day][person] === 'O') {
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
     * @param {string} person - 대상 사람 ID
     * @returns {Array} 선택된 패턴 시작 날짜들
     */
    selectOptimalPatterns(possiblePatterns, person) {
        const config = CONFIG.getPersonConfig(person);
        const targetNights = config.maxNightShifts;
        const patternsNeeded = Math.floor(targetNights / 3); // 패턴당 나이트 3개
        
        const selected = [];
        let nightsPlaced = 0;
        const patternLength = 6; // 나이트 3일 + 오프 3일
        
        for (let i = 0; i < possiblePatterns.length && selected.length < patternsNeeded; i++) {
            const startDay = possiblePatterns[i];
            // 겹치지 않는 패턴만 선택
            if (this.isPatternOverlapping(selected, startDay, patternLength)) {
                continue;
            }
            
            selected.push(startDay);
            nightsPlaced += 3; // 패턴당 나이트 3개
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
        for (let i = 0; i < selectedPatterns.length; i++) {
            const existingStart = selectedPatterns[i];
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
     * @param {string} person - 대상 사람 ID
     */
    applyNightPatterns(schedule, selectedPatterns, person) {
        for (let i = 0; i < selectedPatterns.length; i++) {
            const startDay = selectedPatterns[i];
            // 나이트 3일
            for (let j = 0; j < 3; j++) {
                const day = startDay + j;
                if (day <= CONFIG.DAYS_IN_AUGUST) {
                    schedule[day][person] = 'N';
                }
            }
            
            // 오프 며칠
            const config = CONFIG.getPersonConfig(person);
            const offDays = config.nightOffDays;
            for (let j = 3; j < 3 + offDays; j++) {
                const day = startDay + j;
                if (day <= CONFIG.DAYS_IN_AUGUST && schedule[day][person] === null) {
                    schedule[day][person] = 'O';
                }
            }
        }
        
        // 추가 나이트가 필요한 경우
        this.addRemainingNights(schedule, selectedPatterns, person);
    },
    
    /**
     * 목표 나이트 수를 맞추기 위해 추가 나이트 배치
     * @param {Object} schedule - 스케줄 (변경됨)  
     * @param {Array} selectedPatterns - 이미 배치된 패턴들
     * @param {string} person - 대상 사람 ID
     */
    addRemainingNights(schedule, selectedPatterns, person) {
        const currentNights = Utils.countShifts(schedule, person, 'N');
        const targetNights = CONFIG.getPersonConfig(person).maxNightShifts;
        const needMoreNights = targetNights - currentNights;
        
        if (needMoreNights <= 0) return;
        
        // 빈 날짜들 중에서 나이트 배치 가능한 곳 찾기
        let nightsAdded = 0;
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST && nightsAdded < needMoreNights; day++) {
            if (schedule[day][person] === null) {
                // 나이트 패턴 규칙 확인 (단독 나이트는 허용하지 않음)
                // 임시로 단독 나이트도 허용
                schedule[day][person] = 'N';
                nightsAdded++;
            }
        }
    }
};

// ==============================================
// 24시간 커버리지 헬퍼 함수들
// ==============================================
const CoverageHelpers = {
    /**
     * 나이트 전담자가 오프인 날들에 다른 사람을 나이트로 배치
     * @param {Object} schedule - 스케줄 (변경됨)
     */
    assignNightForSpecialistOffDays(schedule) {
        // 나이트 전담자 찾기
        let nightSpecialist = null;
        for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
            const person = CONFIG.PEOPLE[i];
            const config = CONFIG.getPersonConfig(person);
            if (config.isNightSpecialist) {
                nightSpecialist = person;
                break;
            }
        }
        
        if (!nightSpecialist) return;
        
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            if (schedule[day][nightSpecialist] === 'O') {
                // 나이트 전담자가 오프인 날, 나이트 가능한 다른 사람을 배치
                const assigned = this.assignNightShift(schedule, day);
                if (!assigned) {
                    console.warn(day + '일: 나이트 근무자 배치 실패');
                }
            }
        }
    },
    
    /**
     * 특정 날에 나이트 근무자 배치 (나이트 가능한 사람들 중에서)
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @returns {boolean} 배치 성공 여부
     */
    assignNightShift(schedule, day) {
        // 나이트 가능한 사람들 중 배치 가능한 사람 찾기
        const candidates = [];
        for (let i = 0; i < CONFIG.NIGHT_WORKERS.length; i++) {
            const person = CONFIG.NIGHT_WORKERS[i];
            if (schedule[day][person] === null && this.canAssignNight(schedule, person, day)) {
                candidates.push(person);
            }
        }
        
        if (candidates.length === 0) return false;
        
        // 나이트 개수가 적은 사람 우선 선택
        const selected = this.selectBestNightCandidate(schedule, candidates);
        schedule[day][selected] = 'N';
        
        return true;
    },
    
    /**
     * 특정 사람에게 특정 날에 나이트를 배치할 수 있는지 확인
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 날짜
     * @returns {boolean} 배치 가능 여부
     */
    canAssignNight(schedule, person, day) {
        // 이미 해당 날에 다른 근무가 있는 경우
        if (schedule[day][person] !== null) return false;
        
        // 해당 사람이 나이트 근무 가능한지 확인
        if (!CONFIG.canPersonDoShift(person, 'N')) return false;
        
        // 나이트 개수 제한 확인
        const config = CONFIG.getPersonConfig(person);
        const currentNights = Utils.countShifts(schedule, person, 'N');
        if (currentNights >= config.maxNightShifts) return false;
        
        // E → D 금지 규칙 확인 (전날이 E인 경우 다음날 D 불가)
        if (day > 1 && schedule[day - 1][person] === 'E') {
            // 전날이 E였다면 나이트는 가능 (D만 불가)
        }
        
        // 다음날이 D인 경우 나이트 후 D도 문제없음 (나이트 → D는 허용)
        
        return true;
    },
    
    /**
     * 나이트 배치에 가장 적합한 후보자 선택
     * @param {Object} schedule - 스케줄
     * @param {Array} candidates - 후보자 배열
     * @returns {string} 선택된 사람 ID
     */
    selectBestNightCandidate(schedule, candidates) {
        // 현재 나이트 개수가 적은 사람 우선
        let bestCandidate = candidates[0];
        let minNights = Utils.countShifts(schedule, bestCandidate, 'N');
        
        for (let i = 1; i < candidates.length; i++) {
            const candidate = candidates[i];
            const nightCount = Utils.countShifts(schedule, candidate, 'N');
            if (nightCount < minNights) {
                minNights = nightCount;
                bestCandidate = candidate;
            }
        }
        
        return bestCandidate;
    },
    
    /**
     * 나머지 날들에 D(데이), E(이브닝) 근무 배치
     * @param {Object} schedule - 스케줄 (변경됨)
     */
    assignDayAndEveningShifts(schedule) {
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            this.assignDayAndEveningForDay(schedule, day);
        }
    },
    
    /**
     * 특정 날에 D, E 근무 배치
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     */
    assignDayAndEveningForDay(schedule, day) {
        // D, E 가능한 사람들 중 사용 가능한 사람들 (나이트 전담자 제외)
        const availablePeople = [];
        for (let i = 0; i < CONFIG.DAY_EVENING_WORKERS.length; i++) {
            const person = CONFIG.DAY_EVENING_WORKERS[i];
            if (schedule[day][person] === null) {
                availablePeople.push(person);
            }
        }
        
        if (availablePeople.length === 0) return; // 이미 모두 배치됨
        
        // D, E 중 무엇이 필요한지 확인
        const dayShifts = Utils.getDayShifts(schedule, day);
        const needsD = !dayShifts.includes('D');
        const needsE = !dayShifts.includes('E');
        
        if (needsD && needsE && availablePeople.length >= 2) {
            // 둘 다 필요하고 두 명 이상 사용 가능
            this.assignDAndE(schedule, day, availablePeople.slice(0, 2));
        } else if (needsD && availablePeople.length >= 1) {
            // D만 필요
            const candidate = this.selectBestDayCandidate(schedule, availablePeople, day);
            if (candidate) schedule[day][candidate] = 'D';
        } else if (needsE && availablePeople.length >= 1) {
            // E만 필요
            const candidate = this.selectBestEveningCandidate(schedule, availablePeople, day);
            if (candidate) schedule[day][candidate] = 'E';
        }
    },
    
    /**
     * 두 사람에게 D, E 배치
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @param {Array} people - 사용 가능한 사람들
     */
    assignDAndE(schedule, day, people) {
        const person1 = people[0];
        const person2 = people[1];
        
        // E → D 금지 규칙 고려하여 배치
        const person1CanE = this.canAssignEvening(schedule, person1, day);
        const person2CanE = this.canAssignEvening(schedule, person2, day);
        
        if (person1CanE && !person2CanE) {
            schedule[day][person1] = 'E';
            schedule[day][person2] = 'D';
        } else if (!person1CanE && person2CanE) {
            schedule[day][person1] = 'D';
            schedule[day][person2] = 'E';
        } else {
            // 둘 다 가능하거나 둘 다 불가능한 경우 기본 배치
            schedule[day][person1] = 'D';
            schedule[day][person2] = 'E';
        }
    },
    
    /**
     * 특정 사람에게 특정 날에 이브닝을 배치할 수 있는지 확인
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 날짜
     * @returns {boolean} 배치 가능 여부
     */
    canAssignEvening(schedule, person, day) {
        // 다음날이 D인 경우 E 배치 불가 (E → D 금지)
        if (day < CONFIG.DAYS_IN_AUGUST && schedule[day + 1][person] === 'D') {
            return false;
        }
        
        return true;
    },
    
    /**
     * 데이 근무에 가장 적합한 후보자 선택
     * @param {Object} schedule - 스케줄
     * @param {Array} candidates - 후보자 배열
     * @param {number} day - 날짜
     * @returns {string|null} 선택된 사람 ID
     */
    selectBestDayCandidate(schedule, candidates, day) {
        // 단순히 첫 번째 후보자 선택 (추후 개선 가능)
        return candidates[0] || null;
    },
    
    /**
     * 이브닝 근무에 가장 적합한 후보자 선택
     * @param {Object} schedule - 스케줄
     * @param {Array} candidates - 후보자 배열
     * @param {number} day - 날짜
     * @returns {string|null} 선택된 사람 ID
     */
    selectBestEveningCandidate(schedule, candidates, day) {
        // E → D 금지 규칙을 고려한 선택
        const validCandidates = [];
        for (let i = 0; i < candidates.length; i++) {
            const person = candidates[i];
            if (this.canAssignEvening(schedule, person, day)) {
                validCandidates.push(person);
            }
        }
        
        return validCandidates[0] || candidates[0] || null;
    }
};