// ==============================================
// 스케줄 관리 클래스 (기존 호환성 유지)
// ==============================================

// 전역 스케줄 변수
let schedule = {};

class ScheduleManager {
    static initialize() {
        schedule = Utils.createEmptySchedule();
    }

    static setMandatoryOffs() {
        // 새로운 생성기 사용하여 필수 오프 설정
        schedule = ScheduleGenerator.assignMandatoryOffs(schedule);
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