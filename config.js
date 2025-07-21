// ==============================================
// 상수 및 설정
// ==============================================
const CONFIG = {
    DAYS_IN_AUGUST: 31,
    PEOPLE: ['person1', 'person2', 'person3'],
    SHIFTS: ['D', 'E', 'N', 'O'],
    CONSTRAINTS: {
        PERSON1_OFF_DAYS: [23, 24],
        PERSON3_OFF_DAYS: [2, 3],
        MAX_NIGHT_SHIFTS: { person1: 6, person2: 6, person3: 14 },
        REQUIRED_OFFS: { person1: { min: 9, max: 11 }, person2: { min: 9, max: 11 } },
        MAX_CONSECUTIVE_WORK: 4,
        NIGHT_CONSECUTIVE_DAYS: 3,
        NIGHT_OFF_DAYS: { person1: 2, person2: 2, person3: 3 }
    }
};