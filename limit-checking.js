const usersLimits = new Map();

class LimitChecking {

    static async addLimit(user, maxMemoryUsagePerRequest, maxNumberOfActions, maxTotalMemoryUsageInSecond) {
        usersLimits.set(user, {
            limit: {maxMemoryUsagePerRequest, maxNumberOfActions, maxTotalMemoryUsageInSecond},
            requests: []
        })
    }

    static async processRequest(user, timestamp, numberOfActions, memoryUsagePerAction, callback) {
        if (!usersLimits.get(user)) {
            return callback('NO_LIMITS');
        }

        const userData = usersLimits.get(user);

        userData.requests.unshift({timestamp, numberOfActions, memoryUsagePerAction});
        usersLimits.set(user, userData);

        if (numberOfActions * memoryUsagePerAction > userData.limit.maxMemoryUsagePerRequest) {
            return callback('MAX_MEMORY_LIMIT ' + user)
        }
        const lastRequestTimeStamp = userData.requests[0]['timestamp'];

        let lastTenSecondRequestsCount = 0;
        let lastOneSecondRequestsMemory = 0;

        for (let request of userData.requests) {
            const periodTimestamp = lastRequestTimeStamp - request.timestamp;
            if (periodTimestamp <= 10000) {
                lastTenSecondRequestsCount += request.numberOfActions;
                if (periodTimestamp <= 1000) {
                    lastOneSecondRequestsMemory += request.memoryUsagePerAction * request.numberOfActions;
                }
            } else {
                break;
            }
        }

        if (userData.limit.maxNumberOfActions < lastTenSecondRequestsCount) {
            return callback('MAX_ACTIONS_10S_LIMIT ' + user)
        }
        if (userData.limit.maxTotalMemoryUsageInSecond < lastOneSecondRequestsMemory) {
            return callback('MAX_ACTIONS_1S_LIMIT ' + user)
        }
    }
}

module.exports = LimitChecking;
