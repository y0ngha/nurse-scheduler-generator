// ==============================================
// 메인 함수들 (HTML에서 호출)
// ==============================================

function generateSchedule() {
    console.log('🚀 스케줄 생성 시작...');
    
    // 새로운 생성기 사용
    schedule = ScheduleGenerator.generate();
    
    UIManager.showStatus('1단계 완료: 필수 오프 배치됨');
    UIManager.displaySchedule(schedule);
}

function validateSchedule() {
    ScheduleManager.validate();
}

function runTests() {
    runTestSuite();
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
    ScheduleManager.initialize();
    UIManager.displaySchedule(schedule);
    console.log('🧪 테스트를 실행하려면 "테스트 실행" 버튼을 클릭하거나 runTests()를 호출하세요.');
});