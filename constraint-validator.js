// ==============================================
// 제약조건 검증 클래스
// ==============================================
class ConstraintValidator {
    static validateMandatoryOffs(schedule) {
        const violations = [];
        
        CONFIG.PEOPLE.forEach(person => {
            const config = CONFIG.getPersonConfig(person);
            config.mandatoryOffs.forEach(day => {
                if (schedule[day][person] !== 'O') {
                    violations.push(`${config.name}은 8/${day}에 오프여야 합니다`);
                }
            });
        });
        
        return violations;
    }

    static validateEveningToDay(schedule) {
        const violations = [];
        
        if (!CONFIG.CONSTRAINTS.EVENING_TO_DAY_FORBIDDEN) return violations;
        
        for (let day = 1; day < CONFIG.DAYS_IN_AUGUST; day++) {
            // D, E 가능한 사람들만 체크
            for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
                const person = CONFIG.PEOPLE[i];
                const config = CONFIG.getPersonConfig(person);
                if (config.allowedShifts.includes('D') && config.allowedShifts.includes('E')) {
                    if (schedule[day][person] === 'E' && schedule[day + 1][person] === 'D') {
                        violations.push(config.name + ': ' + day + '일 이브닝 후 ' + (day + 1) + '일 데이 근무 불가');
                    }
                }
            }
        }
        
        return violations;
    }

    static validateNightLimits(schedule) {
        const violations = [];
        const nightCounts = Utils.getShiftCounts(schedule);
        
        CONFIG.PEOPLE.forEach(person => {
            const config = CONFIG.getPersonConfig(person);
            const actualNights = nightCounts[person].N;
            const maxNights = config.maxNightShifts;
            
            if (config.isNightSpecialist) {
                // 나이트 전담자는 정확히 맞춰야 함
                if (actualNights !== maxNights) {
                    violations.push(`${config.name}: 나이트 근무 ${actualNights}개 (정확히 ${maxNights}개 필요)`);
                }
            } else {
                // 일반 근무자는 최대값 이하
                if (actualNights > maxNights) {
                    violations.push(`${config.name}: 나이트 근무 ${actualNights}개 (최대 ${maxNights}개)`);
                }
            }
        });
        
        return violations;
    }

    static validateOffCounts(schedule) {
        const violations = [];
        const offCounts = Utils.getShiftCounts(schedule);
        
        CONFIG.PEOPLE.forEach(person => {
            const config = CONFIG.getPersonConfig(person);
            
            // 오프 개수 체크가 필요한 경우만 (나이트 전담자는 제외)
            if (config.requiredOffs) {
                const actualOffs = offCounts[person].O;
                const { min, max } = config.requiredOffs;
                
                if (actualOffs < min) {
                    violations.push(`${config.name}: 오프 ${actualOffs}개 (최소 ${min}개 필요)`);
                } else if (actualOffs > max) {
                    violations.push(`${config.name}: 오프 ${actualOffs}개 (최대 ${max}개 허용)`);
                }
            }
        });
        
        return violations;
    }

    static validateConsecutiveWork(schedule) {
        const violations = [];
        const maxConsecutive = CONFIG.CONSTRAINTS.MAX_CONSECUTIVE_WORK;
        
        // 연속근무 제한이 적용되는 사람들만 (나이트 전담자는 별도 규칙)
        for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
            const person = CONFIG.PEOPLE[i];
            const config = CONFIG.getPersonConfig(person);
            
            if (!config.isNightSpecialist) {
                let consecutiveWorkDays = 0;
                
                for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
                    const shift = schedule[day][person];
                    
                    if (shift !== 'O' && shift !== null) {
                        consecutiveWorkDays++;
                    } else {
                        consecutiveWorkDays = 0;
                    }
                    
                    if (consecutiveWorkDays > maxConsecutive) {
                        violations.push(config.name + ': ' + day + '일에 연속 근무 ' + maxConsecutive + '일 초과');
                    }
                }
            }
        }
        
        return violations;
    }

    static validateNightPattern(schedule) {
        const violations = [];
        const nightDays = CONFIG.CONSTRAINTS.NIGHT_CONSECUTIVE_DAYS;
        
        CONFIG.PEOPLE.forEach(person => {
            const config = CONFIG.getPersonConfig(person);
            
            // 나이트 근무 가능한 사람들만 체크
            if (config.allowedShifts.includes('N')) {
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
            }
        });
        
        return violations;
    }

    static _validateNightSequence(schedule, person, startDay) {
        const violations = [];
        const config = CONFIG.getPersonConfig(person);
        const requiredNightDays = CONFIG.CONSTRAINTS.NIGHT_CONSECUTIVE_DAYS;
        const requiredOffDays = config.nightOffDays;
        
        // 3일 연속 나이트 검증
        for (let i = 0; i < requiredNightDays; i++) {
            const day = startDay + i;
            if (!Utils.isValidDay(day) || schedule[day][person] !== 'N') {
                violations.push(`${config.name}: ${startDay}일부터 나이트 3일 연속 패턴 위반`);
                return violations;
            }
        }
        
        // 나이트 후 오프 검증
        for (let i = 1; i <= requiredOffDays; i++) {
            const offDay = startDay + requiredNightDays - 1 + i;
            if (Utils.isValidDay(offDay) && schedule[offDay][person] !== 'O') {
                violations.push(`${config.name}: ${offDay}일에 나이트 후 오프 패턴 위반`);
            }
        }
        
        return violations;
    }

    static validate24HourCoverage(schedule) {
        const violations = [];
        
        for (let day = 1; day <= CONFIG.DAYS_IN_AUGUST; day++) {
            const dayShifts = Utils.getDayShifts(schedule, day);
            
            // D, E, N이 모두 있는지 확인
            ['D', 'E', 'N'].forEach(function(shift) {
                if (!dayShifts.includes(shift)) {
                    const shiftName = { D: '데이', E: '이브닝', N: '나이트' }[shift];
                    violations.push(day + '일: ' + shiftName + '(' + shift + ') 근무자 없음');
                }
            });
            
            // 개별 사람별 제약조건 확인
            for (let i = 0; i < CONFIG.PEOPLE.length; i++) {
                const person = CONFIG.PEOPLE[i];
                const config = CONFIG.getPersonConfig(person);
                const personShift = schedule[day][person];
                
                // 허용되지 않은 근무를 하고 있는지 확인
                if (personShift && !config.allowedShifts.includes(personShift)) {
                    violations.push(day + '일: ' + config.name + '은 ' + personShift + ' 근무 불가');
                }
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