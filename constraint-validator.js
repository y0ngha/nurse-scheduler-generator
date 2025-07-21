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
        
        Object.entries(CONFIG.CONSTRAINTS.REQUIRED_OFFS).forEach(([person, offRange]) => {
            const actualOffs = offCounts[person].O;
            
            if (actualOffs < offRange.min) {
                violations.push(`${person}: 오프 ${actualOffs}개 (최소 ${offRange.min}개 필요)`);
            } else if (actualOffs > offRange.max) {
                violations.push(`${person}: 오프 ${actualOffs}개 (최대 ${offRange.max}개 허용)`);
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