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
        
        // 3.1단계: 24시간 커버리지 + 연속근무 제한 (🆕 통합 버전)
        schedule = ScheduleGenerator.assign24HourCoverageWithConsecutiveLimits(schedule);
        console.log('3.1단계 완료: 24시간 커버리지 + 연속근무 제한');
        
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
     * 🆕 3.1단계: 24시간 커버리지 + 연속근무 제한 (순수함수)
     * 매일 D-E-N 근무가 모두 배치되도록 보장하면서 연속근무 제한도 적용
     * @param {Object} inputSchedule - 입력 스케줄
     * @returns {Object} 24시간 커버리지 + 연속근무 제한이 적용된 새로운 스케줄
     */
    static assign24HourCoverageWithConsecutiveLimits(inputSchedule) {
        const schedule = Utils.deepCopy(inputSchedule);
        
        console.log('🔄 연속근무 제한을 고려한 24시간 커버리지 배치 시작...');
        
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            // 1단계: 스마트한 연속근무 제한 적용 (24시간 커버리지 고려)
            const forcedOffPeople = Utils.applyConsecutiveWorkLimitsSmartly(schedule, day);
            if (forcedOffPeople.length > 0) {
                console.log(`${day}일: 연속근무 제한으로 오프 배치 - ${forcedOffPeople.map(p => CONFIG.getPersonConfig(p).name).join(', ')}`);
            }
            
            // 2단계: 나이트 전담자 오프일 처리
            EnhancedCoverageHelpers.assignNightForSpecialistOffDays(schedule, day);
            
            // 3단계: D, E 근무 배치 (연속근무 제한 고려)
            EnhancedCoverageHelpers.assignDayAndEveningShiftsWithLimits(schedule, day);
            
            // 4단계: 커버리지 부족 시 응급 배치
            const coverageFixed = EnhancedCoverageHelpers.fixIncompleteCoverage(schedule, day);
            if (coverageFixed) {
                console.log(`${day}일: 커버리지 부족으로 응급 배치 수행`);
            }
            
            // 디버깅: 해당 날짜의 커버리지 상태 체크
            const dayShifts = Utils.getDayShifts(schedule, day);
            const hasD = dayShifts.includes('D');
            const hasE = dayShifts.includes('E');  
            const hasN = dayShifts.includes('N');
            
            if (!hasD || !hasE || !hasN) {
                console.warn(`⚠️ ${day}일 최종 커버리지 부족: D:${hasD}, E:${hasE}, N:${hasN}`);
            }
        }
        
        return schedule;
    }

    // 기존 3단계 함수는 레거시로 유지 (호환성)
    /**
     * 3단계: 24시간 커버리지 보장 (순수함수) - 레거시 버전
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
// 🆕 연속근무 제한을 고려한 커버리지 헬퍼 함수들
// ==============================================
const EnhancedCoverageHelpers = {
    /**
     * 나이트 전담자가 오프인 특정 날에 다른 사람을 나이트로 배치 (엄격한 규칙 적용)
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     */
    assignNightForSpecialistOffDays(schedule, day) {
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
        
        // 나이트 전담자가 오프인 경우에만 처리
        if (schedule[day][nightSpecialist] === 'O') {
            const assigned = this.assignNightShiftWithStrictRules(schedule, day);
            if (!assigned) {
                console.warn(`${day}일: 나이트 근무자 배치 실패 (엄격한 나이트 규칙으로 인해)`);
            }
        }
    },
    
    /**
     * 🆕 연속근무 제한을 고려한 사용 가능한 사람들 반환 (나이트 규칙 강화)
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @param {string} shiftType - 근무 유형 (선택적)
     * @returns {Array} 사용 가능한 사람들
     */
    getAvailablePeopleWithAllConstraints(schedule, day, shiftType = null) {
        return CONFIG.PEOPLE.filter(person => {
            // 이미 배치된 경우 제외
            if (schedule[day][person] !== null) return false;
            
            // 연속근무 제한으로 오프해야 하는 경우 제외
            if (Utils.needsMandatoryOff(schedule, person, day)) return false;
            
            // 🆕 나이트 후 의무 오프 기간인 경우 제외
            if (Utils.isInNightOffPeriod(schedule, person, day)) return false;
            
            // 특정 근무 유형이 지정된 경우 해당 근무 가능한지 확인
            if (shiftType && !CONFIG.canPersonDoShift(person, shiftType)) return false;
            
            return true;
        });
    },

    /**
     * 특정 날에 나이트 근무자 배치 (엄격한 나이트 규칙 적용)
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @returns {boolean} 배치 성공 여부
     */
    assignNightShiftWithStrictRules(schedule, day) {
        // 이미 나이트가 배치된 경우 스킵
        const dayShifts = Utils.getDayShifts(schedule, day);
        if (dayShifts.includes('N')) return true;
        
        // 나이트 가능한 후보자들 (3일 패턴 고려)
        const candidates = Utils.findNightCandidatesForDay(schedule, day);
        
        if (candidates.length === 0) return false;
        
        // 이미 나이트 근무 중인 사람이 있는지 확인
        for (let i = 0; i < candidates.length; i++) {
            const person = candidates[i];
            if (schedule[day][person] === 'N') {
                return true; // 이미 배치됨
            }
        }
        
        // 새로운 나이트 패턴 시작 가능한 사람 찾기
        const newPatternCandidates = candidates.filter(person => 
            schedule[day][person] === null && Utils.canStartNightShift(schedule, person, day)
        );
        
        if (newPatternCandidates.length === 0) return false;
        
        // 최적의 후보자 선택하여 3일 패턴 배치
        const selected = this.selectBestNightCandidateWithLimits(schedule, newPatternCandidates, day);
        const success = Utils.assignNightPattern(schedule, selected, day);
        
        if (success) {
            console.log(`🌙 ${day}일-${day+2}일: ${CONFIG.getPersonConfig(selected).name} 나이트 3일 패턴 배치`);
        }
        
        return success;
    },
    
    /**
     * 특정 사람에게 특정 날에 나이트를 배치할 수 있는지 확인 (연속근무 제한 포함)
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 날짜
     * @returns {boolean} 배치 가능 여부
     */
    canAssignNightWithLimits(schedule, person, day) {
        // 기본 체크: 이미 배치되었거나 나이트 불가능한 경우
        if (schedule[day][person] !== null) return false;
        if (!CONFIG.canPersonDoShift(person, 'N')) return false;
        
        // 연속근무 제한 체크
        if (Utils.needsMandatoryOff(schedule, person, day)) return false;
        
        // 나이트 개수 제한 확인
        const config = CONFIG.getPersonConfig(person);
        const currentNights = Utils.countShifts(schedule, person, 'N');
        if (currentNights >= config.maxNightShifts) return false;
        
        return true;
    },
    
    /**
     * 나이트 배치에 가장 적합한 후보자 선택 (연속근무 고려)
     * @param {Object} schedule - 스케줄
     * @param {Array} candidates - 후보자 배열
     * @param {number} day - 날짜
     * @returns {string} 선택된 사람 ID
     */
    selectBestNightCandidateWithLimits(schedule, candidates, day) {
        let bestCandidate = candidates[0];
        let bestScore = this.calculateCandidateScore(schedule, bestCandidate, day);
        
        for (let i = 1; i < candidates.length; i++) {
            const candidate = candidates[i];
            const score = this.calculateCandidateScore(schedule, candidate, day);
            
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }
        }
        
        return bestCandidate;
    },
    
    /**
     * 후보자의 우선순위 점수 계산 (낮은 점수가 더 좋음)
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 날짜
     * @returns {number} 점수 (낮을수록 우선순위 높음)
     */
    calculateCandidateScore(schedule, person, day) {
        let score = 0;
        
        // 1. 현재 나이트 개수 (적을수록 좋음)
        const nightCount = Utils.countShifts(schedule, person, 'N');
        score += nightCount * 10;
        
        // 2. 연속근무 일수 (적을수록 좋음)
        const consecutiveDays = Utils.getConsecutiveWorkDays(schedule, person, day);
        score += consecutiveDays * 5;
        
        // 3. 총 근무 일수 (적을수록 좋음)
        const totalWork = CONFIG.SHIFTS.filter(s => s !== 'O').reduce((sum, shift) => {
            return sum + Utils.countShifts(schedule, person, shift);
        }, 0);
        score += totalWork;
        
        return score;
    },
    
    /**
     * D, E 근무 배치 (모든 제약조건 고려)
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     */
    assignDayAndEveningShiftsWithLimits(schedule, day) {
        // 모든 제약조건을 고려한 사용 가능한 D/E 근무자들
        const availablePeople = this.getAvailablePeopleWithAllConstraints(schedule, day).filter(person =>
            CONFIG.DAY_EVENING_WORKERS.includes(person)
        );
        
        if (availablePeople.length === 0) {
            console.warn(`${day}일: D/E 배치 가능한 사람이 없음 (모든 제약조건으로 인해)`);
            return;
        }
        
        // D, E 중 무엇이 필요한지 확인
        const dayShifts = Utils.getDayShifts(schedule, day);
        const needsD = !dayShifts.includes('D');
        const needsE = !dayShifts.includes('E');
        
        if (needsD && needsE && availablePeople.length >= 2) {
            // 둘 다 필요하고 두 명 이상 사용 가능
            this.assignDAndEWithLimits(schedule, day, availablePeople.slice(0, 2));
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
     * 두 사람에게 D, E 배치 (연속근무 제한 고려)
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @param {Array} people - 사용 가능한 사람들 (2명)
     */
    assignDAndEWithLimits(schedule, day, people) {
        const person1 = people[0];
        const person2 = people[1];
        
        // 연속근무를 고려한 D/E 배치 우선순위
        const person1ConsecutiveDays = Utils.getConsecutiveWorkDays(schedule, person1, day);
        const person2ConsecutiveDays = Utils.getConsecutiveWorkDays(schedule, person2, day);
        
        // 연속근무가 적은 사람을 우선적으로 배치
        if (person1ConsecutiveDays <= person2ConsecutiveDays) {
            schedule[day][person1] = 'D';
            schedule[day][person2] = 'E';
        } else {
            schedule[day][person1] = 'E';
            schedule[day][person2] = 'D';
        }
    },
    
    /**
     * 데이 근무에 가장 적합한 후보자 선택
     * @param {Object} schedule - 스케줄
     * @param {Array} candidates - 후보자 배열
     * @param {number} day - 날짜
     * @returns {string|null} 선택된 사람 ID
     */
    selectBestDayCandidate(schedule, candidates, day) {
        // 연속근무가 적은 사람 우선 선택
        let bestCandidate = candidates[0];
        let minConsecutive = Utils.getConsecutiveWorkDays(schedule, bestCandidate, day);
        
        for (let i = 1; i < candidates.length; i++) {
            const candidate = candidates[i];
            const consecutive = Utils.getConsecutiveWorkDays(schedule, candidate, day);
            
            if (consecutive < minConsecutive) {
                minConsecutive = consecutive;
                bestCandidate = candidate;
            }
        }
        
        return bestCandidate;
    },
    
    /**
     * 이브닝 근무에 가장 적합한 후보자 선택
     * @param {Object} schedule - 스케줄
     * @param {Array} candidates - 후보자 배열
     * @param {number} day - 날짜
     * @returns {string|null} 선택된 사람 ID
     */
    selectBestEveningCandidate(schedule, candidates, day) {
        // 연속근무가 적은 사람 우선 선택
        return this.selectBestDayCandidate(schedule, candidates, day);
    },

    /**
     * 🆕 불완전한 커버리지 응급 처리
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     * @returns {boolean} 수정 여부
     */
    fixIncompleteCoverage(schedule, day) {
        const dayShifts = Utils.getDayShifts(schedule, day);
        const hasD = dayShifts.includes('D');
        const hasE = dayShifts.includes('E');
        const hasN = dayShifts.includes('N');
        
        let fixed = false;
        
        // 1. 나이트가 없는 경우 (가장 심각)
        if (!hasN) {
            fixed = this.emergencyAssignNight(schedule, day) || fixed;
        }
        
        // 2. D나 E가 없는 경우
        if (!hasD || !hasE) {
            fixed = this.emergencyAssignDayEvening(schedule, day) || fixed;
        }
        
        return fixed;
    },

    /**
     * 응급 나이트 배치 (엄격한 나이트 규칙 적용)
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     * @returns {boolean} 배치 성공 여부
     */
    emergencyAssignNight(schedule, day) {
        // 엄격한 나이트 규칙을 적용한 응급 배치
        const success = this.assignNightShiftWithStrictRules(schedule, day);
        
        if (success) {
            console.log(`⚡ ${day}일 응급 나이트 배치 (3일 패턴 보장)`);
        } else {
            console.warn(`💥 ${day}일 나이트 배치 완전 실패 - 3일 패턴 불가능`);
        }
        
        return success;
    },

    /**
     * 응급 D/E 배치 (연속근무 제한 완화)
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     * @returns {boolean} 배치 성공 여부
     */
    emergencyAssignDayEvening(schedule, day) {
        const dayShifts = Utils.getDayShifts(schedule, day);
        const needsD = !dayShifts.includes('D');
        const needsE = !dayShifts.includes('E');
        
        // 오프가 아닌 모든 D/E 가능자 중에서 선택 (연속근무 제한 무시)
        const emergencyCandidates = [];
        
        for (let i = 0; i < CONFIG.DAY_EVENING_WORKERS.length; i++) {
            const person = CONFIG.DAY_EVENING_WORKERS[i];
            if (schedule[day][person] === null) {
                emergencyCandidates.push(person);
            }
        }
        
        if (emergencyCandidates.length === 0) return false;
        
        let fixed = false;
        
        if (needsD && needsE && emergencyCandidates.length >= 2) {
            // 둘 다 필요하고 2명 이상 가능
            schedule[day][emergencyCandidates[0]] = 'D';
            schedule[day][emergencyCandidates[1]] = 'E';
            console.log(`⚡ ${day}일 응급 D/E 배치: ${CONFIG.getPersonConfig(emergencyCandidates[0]).name}(D), ${CONFIG.getPersonConfig(emergencyCandidates[1]).name}(E)`);
            fixed = true;
        } else if (needsD && emergencyCandidates.length >= 1) {
            // D만 필요
            schedule[day][emergencyCandidates[0]] = 'D';
            console.log(`⚡ ${day}일 응급 D 배치: ${CONFIG.getPersonConfig(emergencyCandidates[0]).name}`);
            fixed = true;
        } else if (needsE && emergencyCandidates.length >= 1) {
            // E만 필요
            schedule[day][emergencyCandidates[0]] = 'E';
            console.log(`⚡ ${day}일 응급 E 배치: ${CONFIG.getPersonConfig(emergencyCandidates[0]).name}`);
            fixed = true;
        }
        
        return fixed;
    }
};

// ==============================================
// 스케줄 생성기 헬퍼 함수들 (기존)
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
// 24시간 커버리지 헬퍼 함수들 (기존 - 레거시)
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