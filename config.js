// ==============================================
// 상수 및 설정
// ==============================================
const CONFIG = {
    DAYS_IN_AUGUST: 31,
    SHIFTS: ['D', 'E', 'N', 'O'],
    
    // 사람별 설정 (사람 추가/제거 시 여기만 수정)
    PEOPLE_CONFIG: {
        person1: {
            name: '사람1',
            allowedShifts: ['D', 'E', 'N', 'O'],
            mandatoryOffs: [23, 24],
            maxNightShifts: 6,
            requiredOffs: { min: 9, max: 11 },
            nightOffDays: 2
        },
        person2: {
            name: '사람2', 
            allowedShifts: ['D', 'E', 'N', 'O'],
            mandatoryOffs: [],
            maxNightShifts: 6,
            requiredOffs: { min: 9, max: 11 },
            nightOffDays: 2
        },
        person3: {
            name: '사람3',
            allowedShifts: ['N', 'O'],
            mandatoryOffs: [2, 3], // 8/2, 8/3 오프 추가
            maxNightShifts: 16,
            requiredOffs: null, // 나이트 패턴에 의해 자동 결정
            nightOffDays: 3,
            isNightSpecialist: true // 나이트 전담
        },
        person4: {
            name: '사람4',
            allowedShifts: ['D', 'E', 'N', 'O'], // 나이트 가능으로 변경
            mandatoryOffs: [], // 필수 오프 없음
            maxNightShifts: 6, // 6개로 변경
            requiredOffs: { min: 9, max: 11 },
            nightOffDays: 2
        }
    },
    
    // 공통 제약조건
    CONSTRAINTS: {
        MAX_CONSECUTIVE_WORK: 4,
        NIGHT_CONSECUTIVE_DAYS: 3,
        EVENING_TO_DAY_FORBIDDEN: true
    },
    
    // 유틸리티 함수들
    get PEOPLE() {
        return Object.keys(this.PEOPLE_CONFIG);
    },
    
    get NIGHT_WORKERS() {
        return this.PEOPLE.filter(person => 
            this.PEOPLE_CONFIG[person].allowedShifts.includes('N')
        );
    },
    
    get DAY_EVENING_WORKERS() {
        return this.PEOPLE.filter(person => {
            const shifts = this.PEOPLE_CONFIG[person].allowedShifts;
            return shifts.includes('D') || shifts.includes('E');
        });
    },
    
    canPersonDoShift(person, shift) {
        return this.PEOPLE_CONFIG[person].allowedShifts.includes(shift);
    },
    
    getPersonConfig(person) {
        return this.PEOPLE_CONFIG[person];
    }
};