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
        REQUIRED_OFFS: { person1: 11, person2: 11, person3: 17 },
        MAX_CONSECUTIVE_WORK: 4,
        NIGHT_CONSECUTIVE_DAYS: 3,
        NIGHT_OFF_DAYS: { person1: 2, person2: 2, person3: 3 }
    }
};

// ==============================================
// 전역 변수
// ==============================================
let schedule = {};

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

// ==============================================
// 테스트 프레임워크
// ==============================================
const TestFramework = {
    results: [],

    test(name, testFunc) {
        try {
            testFunc();
            this.results.push({ name, status: 'PASS', error: null });
            console.log(`✅ ${name}`);
        } catch (error) {
            this.results.push({ name, status: 'FAIL', error: error.message });
            console.log(`❌ ${name}: ${error.message}`);
        }
    },

    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
        }
    },

    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Expected true, got false. ${message}`);
        }
    },

    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`Expected false, got true. ${message}`);
        }
    },

    reset() {
        this.results = [];
    },

    getResults() {
        const passCount = this.results.filter(r => r.status === 'PASS').length;
        const failCount = this.results.filter(r => r.status === 'FAIL').length;
        return { passCount, failCount, details: this.results };
    }
};

// ==============================================
// 제약조건 검증 클래스
// ==============================================
class ConstraintValidator {
    static validateMandatoryOffs(schedule) {
        const violations = [];
        
        // 사람1 필수 오프
        CONFIG.CONSTRAINTS.PERSON1_OFF_DAYS.forEach(day => {
            if (schedule[day].person1 !== 'O') {
                violations.push(`사람1은 8/${day}에 오프여야 합니다`);
            }
        });
        
        // 사람3 필수 오프
        CONFIG.CONSTRAINTS.PERSON3_OFF_DAYS.forEach(day => {
            if (schedule[day].person3 !== 'O') {
                violations.push(`사람3은 8/${day}에 오프여야 합니다`);
            }
        });
        
        return violations;
    }

    static validateEveningToDay(schedule) {
        const violations = [];
        
        for (let day = 1; day < CONFIG.DAYS_IN_AUGUST; day++) {
            ['person1', 'person2'].forEach(person => {
                if (schedule[day][person] === 'E' && schedule[day + 1][person] === 'D') {
                    violations.push(`${person}: ${day}일 이브닝 후 ${day + 1}일 데이 근무 불가`);
                }
            });
        }
        
        return violations;
    }

    static validateNightLimits(schedule) {
        const violations = [];
        const nightCounts = Utils.getShiftCounts(schedule);
        
        Object.entries(CONFIG.CONSTRAINTS.MAX_NIGHT_SHIFTS).forEach(([person, maxNights]) => {
            const actualNights = nightCounts[person].N;
            
            if (person === 'person3') {
                // 사람3은 정확히 14개
                if (actualNights !== maxNights) {
                    violations.push(`${person}: 나이트 근무 ${actualNights}개 (정확히 ${maxNights}개 필요)`);
                }
            } else {
                // 사람1, 2는 6개 이하
                if (actualNights > maxNights) {
                    violations.push(`${person}: 나이트 근무 ${actualNights}개 (최대 ${maxNights}개)`);
                }
            }
        });
        
        return violations;
    }

    static validateOffCounts(schedule) {
        const violations = [];
        const offCounts = Utils.getShiftCounts(schedule);
        
        Object.entries(CONFIG.CONSTRAINTS.REQUIRED_OFFS).forEach(([person, requiredOffs]) => {
            const actualOffs = offCounts[person].O;
            if (actualOffs !== requiredOffs) {
                violations.push(`${person}: 오프 ${actualOffs}개 (정확히 ${requiredOffs}개 필요)`);
            }
        });
        
        return violations;
    }

    static validateConsecutiveWork(schedule) {
        const violations = [];
        
        ['person1', 'person2'].forEach(person => {
            let consecutiveWorkDays = 0;
            
            for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
                const shift = schedule[day][person];
                
                if (shift !== 'O' && shift !== null) {
                    consecutiveWorkDays++;
                } else {
                    consecutiveWorkDays = 0;
                }
                
                if (consecutiveWorkDays > CONFIG.CONSTRAINTS.MAX_CONSECUTIVE_WORK) {
                    violations.push(`${person}: ${day}일에 연속 근무 ${CONFIG.CONSTRAINTS.MAX_CONSECUTIVE_WORK}일 초과`);
                }
            }
        });
        
        return violations;
    }

    static validateNightPattern(schedule) {
        const violations = [];
        
        CONFIG.PEOPLE.forEach(person => {
            for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST - 2; day++) {
                const currentShift = schedule[day][person];
                
                // 나이트 근무 시작 감지
                if (currentShift === 'N') {
                    const prevShift = day > 1 ? schedule[day - 1][person] : null;
                    
                    // 나이트 패턴 시작인 경우
                    if (prevShift !== 'N') {
                        const violations_here = this._validateNightSequence(schedule, person, day);
                        violations.push(...violations_here);
                    }
                }
            }
        });
        
        return violations;
    }

    static _validateNightSequence(schedule, person, startDay) {
        const violations = [];
        const requiredNightDays = CONFIG.CONSTRAINTS.NIGHT_CONSECUTIVE_DAYS;
        const requiredOffDays = CONFIG.CONSTRAINTS.NIGHT_OFF_DAYS[person];
        
        // 3일 연속 나이트 검증
        for (let i = 0; i < requiredNightDays; i++) {
            const day = startDay + i;
            if (!Utils.isValidDay(day) || schedule[day][person] !== 'N') {
                violations.push(`${person}: ${startDay}일부터 나이트 3일 연속 패턴 위반`);
                return violations;
            }
        }
        
        // 나이트 후 오프 검증
        for (let i = 1; i <= requiredOffDays; i++) {
            const offDay = startDay + requiredNightDays - 1 + i;
            if (Utils.isValidDay(offDay) && schedule[offDay][person] !== 'O') {
                violations.push(`${person}: ${offDay}일에 나이트 후 오프 패턴 위반`);
            }
        }
        
        return violations;
    }

    static validate24HourCoverage(schedule) {
        const violations = [];
        
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            const dayShifts = [schedule[day].person1, schedule[day].person2, schedule[day].person3];
            
            // D, E, N이 모두 있는지 확인
            ['D', 'E', 'N'].forEach(shift => {
                if (!dayShifts.includes(shift)) {
                    const shiftName = { D: '데이', E: '이브닝', N: '나이트' }[shift];
                    violations.push(`${day}일: ${shiftName}(${shift}) 근무자 없음`);
                }
            });
            
            // 사람3은 나이트 또는 오프만 가능
            if (!['N', 'O'].includes(schedule[day].person3)) {
                violations.push(`${day}일: 사람3은 나이트(N) 또는 오프(O)만 가능`);
            }
        }
        
        return violations;
    }

    static validateAll(schedule) {
        let allViolations = [];
        
        allViolations = allViolations.concat(this.validateMandatoryOffs(schedule));
        allViolations = allViolations.concat(this.validateEveningToDay(schedule));
        allViolations = allViolations.concat(this.validateNightLimits(schedule));
        allViolations = allViolations.concat(this.validateOffCounts(schedule));
        allViolations = allViolations.concat(this.validateConsecutiveWork(schedule));
        allViolations = allViolations.concat(this.validateNightPattern(schedule));
        allViolations = allViolations.concat(this.validate24HourCoverage(schedule));
        
        return allViolations;
    }
}

// ==============================================
// UI 관리 클래스
// ==============================================
class UIManager {
    static displaySchedule() {
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
        
        this.updateSummary();
    }

    static updateSummary() {
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

// ==============================================
// 스케줄 관리 클래스
// ==============================================
class ScheduleManager {
    static initialize() {
        schedule = Utils.createEmptySchedule();
    }

    static setMandatoryOffs() {
        // 사람1 필수 오프
        CONFIG.CONSTRAINTS.PERSON1_OFF_DAYS.forEach(day => {
            schedule[day].person1 = 'O';
        });
        
        // 사람3 필수 오프
        CONFIG.CONSTRAINTS.PERSON3_OFF_DAYS.forEach(day => {
            schedule[day].person3 = 'O';
        });
    }

    static validate() {
        const violations = ConstraintValidator.validateAll(schedule);
        
        if (violations.length === 0) {
            UIManager.showStatus('모든 제약조건을 만족합니다! 🎉');
            return true;
        } else {
            UIManager.showStatus(`제약조건 위반: ${violations.length}개\n${violations.join('\n')}`, true);
            return false;
        }
    }
}

// ==============================================
// 테스트 케이스들
// ==============================================
function runTestSuite() {
    console.log('\n=== 제약조건 검증 함수 테스트 ===');
    TestFramework.reset();
    
    // 1. 필수 오프 테스트
    TestFramework.test('필수 오프 - 정상 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[23].person1 = 'O';
        testSchedule[24].person1 = 'O';
        testSchedule[2].person3 = 'O';
        testSchedule[3].person3 = 'O';
        
        const violations = ConstraintValidator.validateMandatoryOffs(testSchedule);
        TestFramework.assertEqual(violations.length, 0);
    });
    
    TestFramework.test('필수 오프 - 위반 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[23].person1 = 'D'; // 위반
        
        const violations = ConstraintValidator.validateMandatoryOffs(testSchedule);
        TestFramework.assertTrue(violations.length > 0);
    });
    
    // 2. 이브닝 후 데이 근무 테스트
    TestFramework.test('이브닝 후 데이 - 정상 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[1].person1 = 'E';
        testSchedule[2].person1 = 'O';
        
        const violations = ConstraintValidator.validateEveningToDay(testSchedule);
        TestFramework.assertEqual(violations.length, 0);
    });
    
    TestFramework.test('이브닝 후 데이 - 위반 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[1].person1 = 'E';
        testSchedule[2].person1 = 'D'; // 위반
        
        const violations = ConstraintValidator.validateEveningToDay(testSchedule);
        TestFramework.assertTrue(violations.length > 0);
    });
    
    // 3. 나이트 근무 제한 테스트
    TestFramework.test('나이트 제한 - 정상 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        // 사람1에게 나이트 6개 할당
        for (let i = 1; i <= 6; i++) {
            testSchedule[i].person1 = 'N';
        }
        // 사람3에게 나이트 14개 할당
        for (let i = 4; i <= 17; i++) {
            testSchedule[i].person3 = 'N';
        }
        
        const violations = ConstraintValidator.validateNightLimits(testSchedule);
        TestFramework.assertEqual(violations.length, 0);
    });
    
    TestFramework.test('나이트 제한 - 위반 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        // 사람1에게 나이트 7개 할당 (위반)
        for (let i = 1; i <= 7; i++) {
            testSchedule[i].person1 = 'N';
        }
        
        const violations = ConstraintValidator.validateNightLimits(testSchedule);
        TestFramework.assertTrue(violations.length > 0);
    });
    
    // 4. 연속 근무 테스트
    TestFramework.test('연속 근무 - 정상 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[1].person1 = 'D';
        testSchedule[2].person1 = 'E';
        testSchedule[3].person1 = 'D';
        testSchedule[4].person1 = 'E';
        testSchedule[5].person1 = 'O'; // 4일 후 오프
        
        const violations = ConstraintValidator.validateConsecutiveWork(testSchedule);
        TestFramework.assertEqual(violations.length, 0);
    });
    
    TestFramework.test('연속 근무 - 위반 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[1].person1 = 'D';
        testSchedule[2].person1 = 'E';
        testSchedule[3].person1 = 'D';
        testSchedule[4].person1 = 'E';
        testSchedule[5].person1 = 'D'; // 5일 연속 (위반)
        
        const violations = ConstraintValidator.validateConsecutiveWork(testSchedule);
        TestFramework.assertTrue(violations.length > 0);
    });
    
    // 5. 24시간 커버리지 테스트
    TestFramework.test('24시간 커버리지 - 정상 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[1].person1 = 'D';
        testSchedule[1].person2 = 'E';
        testSchedule[1].person3 = 'N';
        
        const violations = ConstraintValidator.validate24HourCoverage(testSchedule);
        // 다른 날들은 비어있어서 위반이 있을 수 있지만, 1일은 정상
        TestFramework.assertTrue(violations.filter(v => v.includes('1일')).length === 0);
    });
    
    TestFramework.test('24시간 커버리지 - 위반 케이스', () => {
        const testSchedule = Utils.createEmptySchedule();
        testSchedule[1].person1 = 'D';
        testSchedule[1].person2 = 'D'; // E가 없음 (위반)
        testSchedule[1].person3 = 'O';
        
        const violations = ConstraintValidator.validate24HourCoverage(testSchedule);
        TestFramework.assertTrue(violations.filter(v => v.includes('1일') && v.includes('이브닝')).length > 0);
    });
    
    // 테스트 결과 출력
    const results = TestFramework.getResults();
    console.log('\n=== 테스트 결과 ===');
    console.log(`통과: ${results.passCount}, 실패: ${results.failCount}`);
    
    if (results.failCount > 0) {
        console.log('\n실패한 테스트:');
        results.details.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`- ${r.name}: ${r.error}`);
        });
    }
}

// ==============================================
// 메인 함수들 (HTML에서 호출)
// ==============================================
function generateSchedule() {
    ScheduleManager.initialize();
    ScheduleManager.setMandatoryOffs();
    
    // TODO: 여기서 실제 알고리즘 구현
    UIManager.showStatus('스케줄 생성 알고리즘을 구현 중입니다...', true);
    
    UIManager.displaySchedule();
}

function validateSchedule() {
    ScheduleManager.validate();
}

function runTests() {
    runTestSuite();
}

function clearSchedule() {
    ScheduleManager.initialize();
    UIManager.displaySchedule();
    UIManager.showStatus('스케줄이 초기화되었습니다.');
}

// ==============================================
// 초기화
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    ScheduleManager.initialize();
    UIManager.displaySchedule();
    console.log('🧪 테스트를 실행하려면 "테스트 실행" 버튼을 클릭하거나 runTests()를 호출하세요.');
});