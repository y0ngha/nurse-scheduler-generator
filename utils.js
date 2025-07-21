// ==============================================
// 유틸리티 함수들
// ==============================================
const Utils = {
    createEmptySchedule() {
        const newSchedule = {};
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            newSchedule[day] = {};
            CONFIG.PEOPLE.forEach(person => {
                newSchedule[day][person] = null;
            });
        }
        return newSchedule;
    },

    /**
     * 스케줄 객체의 깊은 복사
     * @param {Object} schedule - 복사할 스케줄
     * @returns {Object} 복사된 새로운 스케줄
     */
    deepCopy(schedule) {
        const newSchedule = {};
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            newSchedule[day] = {};
            CONFIG.PEOPLE.forEach(person => {
                newSchedule[day][person] = schedule[day][person];
            });
        }
        return newSchedule;
    },

    countShifts(schedule, person, shift) {
        let count = 0;
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            if (schedule[day][person] === shift) {
                count++;
            }
        }
        return count;
    },

    getShiftCounts(schedule) {
        const counts = {};
        CONFIG.PEOPLE.forEach(person => {
            counts[person] = {};
            CONFIG.SHIFTS.forEach(shift => {
                counts[person][shift] = this.countShifts(schedule, person, shift);
            });
        });
        return counts;
    },

    isValidDay(day) {
        return day >= 1 && day <= CONFIG.DAYS_IN_AUGUST;
    },

    /**
     * 특정 날짜의 모든 사람의 근무를 배열로 반환
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @returns {Array} 근무 배열
     */
    getDayShifts(schedule, day) {
        return CONFIG.PEOPLE.map(person => schedule[day][person]);
    },

    /**
     * 특정 날짜에 특정 근무가 있는지 확인
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @param {string} shift - 근무 유형
     * @returns {boolean} 존재 여부
     */
    dayHasShift(schedule, day, shift) {
        return this.getDayShifts(schedule, day).includes(shift);
    },

    /**
     * 특정 날짜에 사용 가능한 사람들 반환
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @param {string} shiftType - 근무 유형 (선택적)
     * @returns {Array} 사용 가능한 사람들
     */
    getAvailablePeople(schedule, day, shiftType = null) {
        return CONFIG.PEOPLE.filter(person => {
            // 이미 배치된 경우 제외
            if (schedule[day][person] !== null) return false;
            
            // 특정 근무 유형이 지정된 경우 해당 근무 가능한지 확인
            if (shiftType && !CONFIG.canPersonDoShift(person, shiftType)) return false;
            
            return true;
        });
    },

    // ==============================================
    // 🆕 연속근무 추적 관련 유틸리티 함수들
    // ==============================================

    /**
     * 특정 사람의 특정 날짜까지의 연속 근무 일수 계산
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} upToDay - 계산할 날짜 (이 날짜 이전까지)
     * @returns {number} 연속 근무 일수
     */
    getConsecutiveWorkDays(schedule, person, upToDay) {
        let consecutiveDays = 0;
        
        // upToDay 이전 날짜부터 역순으로 체크
        for (let day = upToDay - 1; day >= 1; day--) {
            const shift = schedule[day][person];
            
            if (shift !== null && shift !== 'O') {
                consecutiveDays++;
            } else {
                break; // 오프나 null을 만나면 연속 중단
            }
        }
        
        return consecutiveDays;
    },

    /**
     * 특정 사람이 특정 날짜에 의무적으로 오프해야 하는지 확인 (유연한 버전)
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID  
     * @param {number} day - 확인할 날짜
     * @param {boolean} allowFlexible - 24시간 커버리지를 위한 유연성 허용
     * @returns {boolean} 의무 오프 필요 여부
     */
    needsMandatoryOff(schedule, person, day, allowFlexible = false) {
        const config = CONFIG.getPersonConfig(person);
        
        // 나이트 전담자는 연속근무 제한 적용 안함
        if (config.isNightSpecialist) {
            return false;
        }
        
        const consecutiveDays = this.getConsecutiveWorkDays(schedule, person, day);
        const maxConsecutive = CONFIG.CONSTRAINTS.MAX_CONSECUTIVE_WORK;
        
        // 기본 제한
        if (consecutiveDays >= maxConsecutive) {
            // 유연성 허용 시 1일 연장 가능 (최대 5일)
            if (allowFlexible && consecutiveDays < maxConsecutive + 1) {
                return false;
            }
            return true;
        }
        
        return false;
    },

    /**
     * 디버깅용: 특정 사람의 연속근무 상태 출력
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 현재 날짜
     */
    debugConsecutiveWork(schedule, person, day) {
        const consecutiveDays = this.getConsecutiveWorkDays(schedule, person, day);
        const needsOff = this.needsMandatoryOff(schedule, person, day);
        const isNightOff = this.isInNightOffPeriod(schedule, person, day);
        const config = CONFIG.getPersonConfig(person);
        
        console.log(`${config.name} (${day}일): 연속 ${consecutiveDays}일, 강제오프필요: ${needsOff}, 나이트후오프: ${isNightOff}`);
        
        // 최근 5일 근무 이력 출력
        const recentDays = [];
        for (let d = Math.max(1, day - 4); d < day; d++) {
            const shift = schedule[d][person] || 'null';
            recentDays.push(`${d}:${shift}`);
        }
        console.log(`  최근 근무: [${recentDays.join(', ')}]`);
    },

    /**
     * 특정 날짜에 연속근무 제한으로 오프해야 하는 사람들 반환 (유연한 버전)
     * @param {Object} schedule - 스케줄
     * @param {number} day - 확인할 날짜
     * @param {boolean} allowFlexible - 24시간 커버리지를 위한 유연성 허용
     * @returns {Array} 의무 오프 대상자 배열
     */
    getPeopleNeedingMandatoryOff(schedule, day, allowFlexible = false) {
        const needsOff = [];
        
        CONFIG.PEOPLE.forEach(person => {
            if (this.needsMandatoryOff(schedule, person, day, allowFlexible)) {
                needsOff.push(person);
            }
        });
        
        return needsOff;
    },

    /**
     * 특정 날짜에 연속근무 제한을 고려한 사용 가능한 사람들 반환
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @param {string} shiftType - 근무 유형 (선택적)
     * @returns {Array} 사용 가능한 사람들
     */
    getAvailablePeopleWithConsecutiveLimit(schedule, day, shiftType = null) {
        return CONFIG.PEOPLE.filter(person => {
            // 이미 배치된 경우 제외
            if (schedule[day][person] !== null) return false;
            
            // 연속근무 제한으로 오프해야 하는 경우 제외
            if (this.needsMandatoryOff(schedule, person, day)) return false;
            
            // 특정 근무 유형이 지정된 경우 해당 근무 가능한지 확인
            if (shiftType && !CONFIG.canPersonDoShift(person, shiftType)) return false;
            
            return true;
        });
    },

    /**
     * 연속근무 제한 위반자들에게 강제 오프 배치
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     * @returns {Array} 강제 오프 배치된 사람들
     */
    applyConsecutiveWorkLimits(schedule, day) {
        const forcedOffPeople = this.getPeopleNeedingMandatoryOff(schedule, day);
        
        forcedOffPeople.forEach(person => {
            schedule[day][person] = 'O';
        });
        
        return forcedOffPeople;
    },

    /**
     * 🆕 연속근무 제한 위반자들에게 강제 오프 배치 (스마트 버전)
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {number} day - 날짜
     * @returns {Array} 강제 오프 배치된 사람들
     */
    applyConsecutiveWorkLimitsSmartly(schedule, day) {
        // 1차: 엄격한 제한 적용
        const strictOffPeople = this.getPeopleNeedingMandatoryOff(schedule, day, false);
        
        // 24시간 커버리지 가능성 체크
        const availableAfterStrict = CONFIG.DAY_EVENING_WORKERS.filter(person => 
            schedule[day][person] === null && !strictOffPeople.includes(person)
        );
        
        // D/E 배치에 최소 2명 필요한데 부족한 경우
        if (availableAfterStrict.length < 2) {
            console.log(`${day}일: 엄격한 연속근무 제한 시 D/E 인력 부족 (${availableAfterStrict.length}명), 유연 적용`);
            
            // 2차: 유연한 제한 적용 (1일 연장 허용)
            const flexibleOffPeople = this.getPeopleNeedingMandatoryOff(schedule, day, true);
            
            flexibleOffPeople.forEach(person => {
                schedule[day][person] = 'O';
            });
            
            return flexibleOffPeople;
        } else {
            // 충분한 인력이 있으면 엄격하게 적용
            strictOffPeople.forEach(person => {
                schedule[day][person] = 'O';
            });
            
            return strictOffPeople;
        }
    },

    /**
     * 🆕 나이트 패턴 검증 관련 유틸리티 함수들
     */

    /**
     * 특정 사람이 특정 날짜에 나이트 근무를 시작할 수 있는지 확인
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 시작 날짜
     * @returns {boolean} 나이트 시작 가능 여부
     */
    canStartNightShift(schedule, person, day) {
        const config = CONFIG.getPersonConfig(person);
        
        // 나이트 근무 불가능한 사람
        if (!CONFIG.canPersonDoShift(person, 'N')) return false;
        
        // 나이트 개수 제한 확인 (3일치)
        const currentNights = Utils.countShifts(schedule, person, 'N');
        if (currentNights + 3 > config.maxNightShifts) return false;
        
        // 3일 연속 나이트 + 오프 기간이 가능한지 확인
        const totalDaysNeeded = 3 + config.nightOffDays; // 나이트 3일 + 오프
        
        for (let i = 0; i < totalDaysNeeded; i++) {
            const checkDay = day + i;
            
            // 날짜 범위 초과
            if (checkDay > CONFIG.DAYS_IN_AUGUST) return false;
            
            // 이미 다른 근무가 배치된 경우
            if (schedule[checkDay][person] !== null) {
                // 오프 구간에서 기존 오프와 겹치는 것은 허용
                if (i >= 3 && schedule[checkDay][person] === 'O') {
                    continue;
                } else {
                    return false;
                }
            }
        }
        
        return true;
    },

    /**
     * 특정 사람에게 나이트 3일 패턴을 배치
     * @param {Object} schedule - 스케줄 (변경됨)
     * @param {string} person - 사람 ID
     * @param {number} startDay - 시작 날짜
     * @returns {boolean} 배치 성공 여부
     */
    assignNightPattern(schedule, person, startDay) {
        if (!this.canStartNightShift(schedule, person, startDay)) {
            return false;
        }
        
        const config = CONFIG.getPersonConfig(person);
        
        // 나이트 3일 배치
        for (let i = 0; i < 3; i++) {
            const day = startDay + i;
            if (day <= CONFIG.DAYS_IN_AUGUST) {
                schedule[day][person] = 'N';
            }
        }
        
        // 나이트 후 의무 오프 배치
        for (let i = 3; i < 3 + config.nightOffDays; i++) {
            const day = startDay + i;
            if (day <= CONFIG.DAYS_IN_AUGUST && schedule[day][person] === null) {
                schedule[day][person] = 'O';
            }
        }
        
        return true;
    },

    /**
     * 특정 날짜에 나이트 근무가 가능한 사람 찾기 (3일 패턴 고려)
     * @param {Object} schedule - 스케줄
     * @param {number} day - 날짜
     * @returns {Array} 나이트 가능한 사람들
     */
    findNightCandidatesForDay(schedule, day) {
        const candidates = [];
        
        for (let i = 0; i < CONFIG.NIGHT_WORKERS.length; i++) {
            const person = CONFIG.NIGHT_WORKERS[i];
            
            // 이미 나이트 근무 중인지 확인
            if (schedule[day][person] === 'N') {
                candidates.push(person);
                continue;
            }
            
            // 새로운 나이트 패턴 시작 가능한지 확인
            if (schedule[day][person] === null && this.canStartNightShift(schedule, person, day)) {
                candidates.push(person);
            }
        }
        
        return candidates;
    },

    /**
     * 특정 사람이 나이트 후 의무 오프 기간인지 확인
     * @param {Object} schedule - 스케줄
     * @param {string} person - 사람 ID
     * @param {number} day - 확인할 날짜
     * @returns {boolean} 나이트 후 오프 필요 여부
     */
    isInNightOffPeriod(schedule, person, day) {
        const config = CONFIG.getPersonConfig(person);
        
        // 나이트 근무 불가능한 사람은 해당 없음
        if (!CONFIG.canPersonDoShift(person, 'N')) return false;
        
        // 최근 며칠간 나이트 패턴 체크
        for (let checkStart = Math.max(1, day - config.nightOffDays); checkStart <= day - 1; checkStart++) {
            // 3일 연속 나이트가 끝난 직후인지 확인
            let consecutiveNights = 0;
            for (let i = 0; i < 3; i++) {
                const nightDay = checkStart + i;
                if (nightDay <= CONFIG.DAYS_IN_AUGUST && schedule[nightDay][person] === 'N') {
                    consecutiveNights++;
                } else {
                    break;
                }
            }
            
            // 3일 연속 나이트를 마친 경우
            if (consecutiveNights === 3) {
                const nightEndDay = checkStart + 2; // 나이트 마지막 날
                const offStartDay = nightEndDay + 1; // 오프 시작일
                const offEndDay = offStartDay + config.nightOffDays - 1; // 오프 마지막일
                
                // 현재 날짜가 오프 기간에 포함되는지 확인
                if (day >= offStartDay && day <= offEndDay) {
                    return true;
                }
            }
        }
        
        return false;
    },
};
