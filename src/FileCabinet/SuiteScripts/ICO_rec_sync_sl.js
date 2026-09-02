/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/task', 'N/log', 'N/record'], function (task, log, record) {

    const MR_SCRIPT_ID = 'customscript_ic_trade_mr'
    const IC_TRADE_TURNS = [
        'customdeploy_ic_trade_mr',
        'customdeploy2',
        'customdeploy3',
        'customdeploy4',
        'customdeploy5'
    ]

    function getTurn(turns) {
        const idx = new Date().getTime() % turns.length;
        return turns[idx];
    }

    // tries each deployment in turn, skipping any that report MAP_REDUCE_ALREADY_RUNNING
    function submitToFreeDeployment(turns, params) {
        let lastError;
        for (const depId of turns) {
            try {
                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MR_SCRIPT_ID,
                    deploymentId: depId,
                    params: params
                });
                const taskId = mrTask.submit();
                return { taskId, depId };
            } catch (e) {
                if (e.name === 'MAP_REDUCE_ALREADY_RUNNING') {
                    log.debug('Deployment busy, trying next', depId);
                    lastError = e;
                    continue;
                }
                throw e;
            }
        }
        throw lastError || new Error('No deployments available');
    }

    function sleep(ms) {
        const end = new Date().getTime() + ms;
        while (new Date().getTime() < end) { }
    }

    function waitForTask(taskId, maxAttempts = 80, delayMs = 3000) {
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
        const type = request.parameters.type;
        if (!soid || !type) {
            response.write('Error: Missing soid or type parameter');
            return;
        }

        try {
            const { taskId, depId } = submitToFreeDeployment(IC_TRADE_TURNS, {
                custscript_ic_mr_rec_id: soid,
                custscript_ic_mr_rec_type: type
            });
            log.audit('Submitted M/R', { taskId, depId });

            waitForTask(taskId);

            const so = record.load({ type: type, id: soid, isDynamic: false });
            const linkedPo = so.getValue('custbody_linked_po');
            const icNumber = so.getValue('custbody_ic_number');
            response.write(JSON.stringify({ linkedPo, icNumber }));

        } catch (e) {
            log.error('Suitelet Error', e);
            response.write('Error: ' + (e && e.message ? e.message : JSON.stringify(e)));
        }
    }

    return { onRequest }
})

