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
    }
};