// ==============================================
// 메인 함수들 (HTML에서 호출)
// ==============================================

function generateSchedule() {
    console.log('🚀 스케줄 생성 시작...');
    
    // 새로운 통합 생성기 사용 (3.1단계)
    schedule = ScheduleGenerator.generate();
    
    UIManager.showStatus('3.1단계 완료: 필수 오프 + 나이트 전담자 패턴 + 24시간 커버리지 + 연속근무 제한');
    UIManager.displaySchedule(schedule);
}

function validateSchedule() {
    ScheduleManager.validate();
}

function runTests() {
    // runTestSuite가 정의되지 않은 경우를 대비한 안전한 호출
    if (typeof runTestSuite === 'function') {
        runTestSuite();
    } else {
        console.error('runTestSuite 함수를 찾을 수 없습니다. tests.js 파일이 올바르게 로드되었는지 확인하세요.');
        
        // 간단한 테스트 실행
        console.log('간단한 테스트 실행...');
        try {
            const schedule = Utils.createEmptySchedule();
            console.log('✅ 스케줄 생성 성공');
            
            const violations = ConstraintValidator.validateAll(schedule);
            console.log(`✅ 검증 실행 성공 (위반: ${violations.length}개)`);
            
            console.log('기본 기능들이 정상 작동합니다.');
        } catch (error) {
            console.error('❌ 기본 기능 테스트 실패:', error);
        }
    }
}

function clearSchedule() {
    ScheduleManager.initialize();
    UIManager.displaySchedule(schedule);
    UIManager.showStatus('스케줄이 초기화되었습니다.');
}

// ==============================================
// 🆕 3.1단계 테스트 및 디버깅 함수들
// ==============================================

/**
 * 연속근무 제한 기능 테스트
 */
function testConsecutiveWorkLimits() {
    console.log('\n🧪 연속근무 제한 기능 테스트...');
    
    // 테스트 스케줄 생성
    const testSchedule = Utils.createEmptySchedule();
    
    // person1에게 4일 연속 근무 배치
    const person1 = CONFIG.PEOPLE[0];
    testSchedule[1][person1] = 'D';
    testSchedule[2][person1] = 'E';
    testSchedule[3][person1] = 'D';
    testSchedule[4][person1] = 'E';
    
    // 5일째 연속근무 제한 체크
    const needsOff = Utils.needsMandatoryOff(testSchedule, person1, 5);
    console.log(`${CONFIG.getPersonConfig(person1).name} 5일째 강제오프 필요: ${needsOff}`);
    
    // 연속근무 일수 확인
    const consecutiveDays = Utils.getConsecutiveWorkDays(testSchedule, person1, 5);
    console.log(`연속근무 일수: ${consecutiveDays}일`);
    
    // 강제 오프 배치 테스트
    const forcedOff = Utils.applyConsecutiveWorkLimits(testSchedule, 5);
    console.log(`강제 오프 배치 대상: ${forcedOff.map(p => CONFIG.getPersonConfig(p).name).join(', ')}`);
    
    return testSchedule;
}

/**
 * 3.1단계 통합 기능 상세 테스트
 */
function test31Integration() {
    console.log('\n🧪 3.1단계 통합 기능 테스트...');
    
    // 1-2단계 완료된 스케줄 생성
    let testSchedule = Utils.createEmptySchedule();
    testSchedule = ScheduleGenerator.assignMandatoryOffs(testSchedule);
    testSchedule = ScheduleGenerator.assignNightSpecialistPattern(testSchedule);
    
    console.log('1-2단계 완료');
    
    // 3.1단계 적용
    const result = ScheduleGenerator.assign24HourCoverageWithConsecutiveLimits(testSchedule);
    
    // 결과 분석
    console.log('\n📊 3.1단계 결과 분석:');
    
    // 1. 24시간 커버리지 체크
    let fullCoverageDays = 0;
    let partialCoverageDays = 0;
    
    for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
        const dayShifts = Utils.getDayShifts(result, day);
        const hasD = dayShifts.includes('D');
        const hasE = dayShifts.includes('E');
        const hasN = dayShifts.includes('N');
        
        if (hasD && hasE && hasN) {
            fullCoverageDays++;
        } else if (hasD || hasE || hasN) {
            partialCoverageDays++;
            console.log(`⚠️ ${day}일 부분 커버리지: D:${hasD}, E:${hasE}, N:${hasN}`);
        }
    }
    
    console.log(`✅ 완전 커버리지: ${fullCoverageDays}/${CONFIG.DAYS_IN_AUGUST}일`);
    console.log(`⚠️ 부분 커버리지: ${partialCoverageDays}일`);
    
    // 2. 연속근무 제한 체크
    const consecutiveViolations = ConstraintValidator.validateConsecutiveWork(result);
    console.log(`✅ 연속근무 제한 위반: ${consecutiveViolations.length}개`);
    
    // 3. 각 사람별 연속근무 최대값 확인
    CONFIG.PEOPLE.forEach(person => {
        const config = CONFIG.getPersonConfig(person);
        if (!config.isNightSpecialist) {
            let maxConsecutive = 0;
            let currentConsecutive = 0;
            
            for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
                const shift = result[day][person];
                if (shift && shift !== 'O') {
                    currentConsecutive++;
                    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
                } else {
                    currentConsecutive = 0;
                }
            }
            
            console.log(`${config.name} 최대 연속근무: ${maxConsecutive}일`);
        }
    });
    
    return result;
}

/**
 * 성능 비교 테스트 (기존 vs 3.1단계)
 */
function comparePerformance() {
    console.log('\n⚡ 성능 비교 테스트...');
    
    // 기존 3단계 테스트
    console.time('기존 3단계');
    let schedule1 = Utils.createEmptySchedule();
    schedule1 = ScheduleGenerator.assignMandatoryOffs(schedule1);
    schedule1 = ScheduleGenerator.assignNightSpecialistPattern(schedule1);
    schedule1 = ScheduleGenerator.assign24HourCoverage(schedule1);
    console.timeEnd('기존 3단계');
    
    // 새로운 3.1단계 테스트
    console.time('새로운 3.1단계');
    let schedule2 = Utils.createEmptySchedule();
    schedule2 = ScheduleGenerator.assignMandatoryOffs(schedule2);
    schedule2 = ScheduleGenerator.assignNightSpecialistPattern(schedule2);
    schedule2 = ScheduleGenerator.assign24HourCoverageWithConsecutiveLimits(schedule2);
    console.timeEnd('새로운 3.1단계');
    
    // 제약조건 위반 개수 비교
    const violations1 = ConstraintValidator.validateAll(schedule1);
    const violations2 = ConstraintValidator.validateAll(schedule2);
    
    console.log(`기존 버전 제약조건 위반: ${violations1.length}개`);
    console.log(`새 버전 제약조건 위반: ${violations2.length}개`);
    console.log(`개선 효과: ${violations1.length - violations2.length}개 위반 감소`);
}

// ==============================================
// 초기화
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    // 단순하게 바로 초기화 시도
    try {
        console.log('DOM 로드 완료, 초기화 시작...');
        
        // UI 동적 생성 (오류가 있어도 계속 진행)
        try {
            UIManager.initializeUI();
        } catch (uiError) {
            console.warn('UI 초기화 중 일부 오류 발생:', uiError);
            console.log('기본 UI로 계속 진행합니다.');
        }
        
        // 스케줄 초기화 및 표시
        ScheduleManager.initialize();
        UIManager.displaySchedule(schedule);
        
        console.log('✅ 초기화 완료!');
        console.log('🧪 테스트를 실행하려면 "테스트 실행" 버튼을 클릭하거나 runTests()를 호출하세요.');
        console.log('🔧 3.1단계 테스트: testConsecutiveWorkLimits(), test31Integration(), comparePerformance()');
        
    } catch (error) {
        console.error('초기화 중 심각한 오류 발생:', error);
        
        // 최소한의 기능이라도 작동하도록
        try {
            ScheduleManager.initialize();
            console.log('최소 기능으로 초기화 완료');
        } catch (minError) {
            console.error('최소 기능 초기화도 실패:', minError);
        }
    }
});