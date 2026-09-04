/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/task', 'N/log', 'N/record'], function (task, log, record) {

    const TURNS = [
        'customdeploy_calc_m_item_size',
        'customdeploy_calc_skid_est_ey2',
        'customdeploy_calc_skid_est_ey3',
        'customdeploy_calc_skid_est_ey4',
        'customdeploy_calc_skid_est_ey5'
    ]

    function getTurns() {        
        const idx = new Date().getTime() % TURNS.length;
        return TURNS[idx];
    }

    function sleep(ms) {
        const end = new Date().getTime() + ms;
        while (new Date().getTime() < end) { }
    }

    function waitForTask(taskId, maxAttempts = 15, delayMs = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            const status = task.checkStatus({ taskId });
            if (status.status === task.TaskStatus.COMPLETE) {
                log.debug('M/R Task Complete', status);
                return true;
            } else if (status.status === task.TaskStatus.FAILED || status.status === task.TaskStatus.ABORTED) {
                throw new Error('Task failed or was aborted');
            }
            sleep(delayMs);
        }
        throw new Error('Task timed out after waiting');
    }

    function onRequest(context) {
        const request = context.request;
        const response = context.response;

        const soid = request.parameters.soid;
        const type = request.parameters.type
        if (!soid) {
            response.write('Missing Sales Order ID');
            return;
        }

        try {
            const depId = getTurns();
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_calc_m_item_size',
                deploymentId: depId,
                params: {
                    custscriptcustscript_soid_skid_calc: soid,
                    custscriptcustscript_rt_skid_calc: type
                }
            });

            const taskId = mrTask.submit()
            log.audit('Submitted M/R', {taskId, depId});

            waitForTask(taskId);

            const so = record.load({ type: type, id: soid, isDynamic: false });
            log.debug('Loading Record', { type, soid });
            const summary = so.getValue('custbody_bol_delivery_instructions') || '';
            response.write(summary || '')

        } catch (e) {
            log.error('Suitelet Error', e);
            //response.write('Error: ' + e.message);
            response.write('Error: ' + (e && e.message ? e.message : JSON.stringify(e)));
        }
    }

    return {
        onRequest
    };
});
