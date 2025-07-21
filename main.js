// ==============================================
// 메인 함수들 (HTML에서 호출)
// ==============================================

function generateSchedule() {
    console.log('🚀 스케줄 생성 시작...');
    
    // 새로운 생성기 사용
    schedule = ScheduleGenerator.generate();
    
    UIManager.showStatus('3단계 완료: 필수 오프 + 나이트 전담자 패턴 + 24시간 커버리지 보장');
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