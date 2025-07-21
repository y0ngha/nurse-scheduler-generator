// ==============================================
// 유틸리티 함수들
// ==============================================
const Utils = {
    createEmptySchedule() {
        const newSchedule = {};
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            newSchedule[day] = {
                person1: null,
                person2: null,
                person3: null
            };
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
            newSchedule[day] = {
                person1: schedule[day].person1,
                person2: schedule[day].person2,
                person3: schedule[day].person3
            };
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
    }
};