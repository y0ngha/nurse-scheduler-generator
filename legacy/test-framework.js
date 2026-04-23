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