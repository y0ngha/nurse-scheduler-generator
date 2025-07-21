// ==============================================
// 스케줄 생성기 클래스
// ==============================================
class ScheduleGenerator {
    /**
     * 메인 스케줄 생성 함수
     * @returns {Object} 완성된 스케줄 객체
     */
    static generate() {
        let schedule = Utils.createEmptySchedule();
        
        // 1단계: 필수 오프 배치
        schedule = this.assignMandatoryOffs(schedule);
        console.log('1단계 완료: 필수 오프 배치');
        
        // TODO: 다음 단계들 추가 예정
        // schedule = this.assignPerson3Pattern(schedule);
        // schedule = this.assign24HourCoverage(schedule);
        // schedule = this.assignRemainingShifts(schedule);
        
        return schedule;
    }
    
    /**
     * 1단계: 필수 오프 배치 (순수함수)
     * @param {Object} inputSchedule - 입력 스케줄
     * @returns {Object} 필수 오프가 배치된 새로운 스케줄
     */
    static assignMandatoryOffs(inputSchedule) {
        // 입력 스케줄을 변경하지 않고 복사본 생성
        const schedule = Utils.deepCopy(inputSchedule);
        
        // 사람1 필수 오프 배치
        CONFIG.CONSTRAINTS.PERSON1_OFF_DAYS.forEach(day => {
            schedule[day].person1 = 'O';
        });
        
        // 사람3 필수 오프 배치  
        CONFIG.CONSTRAINTS.PERSON3_OFF_DAYS.forEach(day => {
            schedule[day].person3 = 'O';
        });
        
        return schedule;
    }
}