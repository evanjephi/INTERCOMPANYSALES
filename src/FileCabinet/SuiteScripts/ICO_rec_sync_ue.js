/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url', 'N/runtime', 'N/search', 'N/log', 'N/record'], function (w, x, e, y, log, z) {
    function beforeLoad(context) {
        const validateCrossSubOrders = (nr, e) => {
            const cd = contextDetail;
            var er = e.getCurrentUser();
            const tms = parseInt(nr.getValue(cd.o), 10)
            const tmq = parseInt(nr.getValue(cd.gc), 10)
            const ro = nr.getValue(cd.ro);
            const u = parseInt(er[cd.u], 10);
            const r = parseInt(er[cd.r], 10);
            const t = cd.t;
            const c = cd.c;
            const s = y.create({
                type: z.Type.EMPLOYEE,
                filter: ['internalid', 'anyof', u],
                columns: ['custentity_ico_access']
            }).custentity_ico_access;
            return { tms, tmq, ro, u, r, t, c, ac: cd.ac, s, f: cd.ac[2] };
        }
        if (context.type === context.UserEventType.VIEW) {
            const nr = context.newRecord;
            const { tms, tmq, ro, u, r, t, c, ac, s, f } = validateCrossSubOrders(nr, e);
            const form = context.form
            form.clientScriptFileId = f;

            if ((t.includes(tms) || c.includes(tmq)) && r !== ac[1]) {
                form.addButton({
                    id: 'custpage_estimate_skid',
                    label: 'Estimate Skid',
                    functionName: 'runSkidEstimation'
                })
                log.debug('Estimating Criteria Met', 'SO ' + nr.id)
            }
            log.debug('Validation Result', { ro, s, f });

            if (s && ro && ac.includes(r)) {
                form.addButton({
                    id: 'custpage_ic_orders',
                    label: 'Generate ICO',
                    functionName: 'crossSubOrders'
                })
            }
            // submitRevision(nr, form, url)
        }
    }

    const contextDetail = {
        o: 'ordertype',
        ro: 'custbody_release_order',
        so: 'salesorder',
        e: 'employee',
        u: 'id',
        gc: 'class',
        r: 'role',
        t: [13, 1],
        c: [8, 1],
        ac: [3, 1653, 54208],

    }

    // function submitRevision(nr, form, url) {
    //     const status = nr.getValue({ fieldId: 'status' });
    //     log.debug('Current Status', status);
    //     if (status === 'Expired') {
    //         form.clientScriptFileId = 64897
    //         const origTranId = nr.getValue({ fieldId: 'tranid' })
    //         const origId = nr.id
    //         const revUrl = '/app/accounting/transactions/estimate.nl?id='+ 
    //             origId +'&e=T&memdoc=0'+'&custparam_orig_tranid='+ 
    //             encodeURIComponent(origTranId)
    //         form.addButton({
    //             id: 'custpage_revise_quote_btn',
    //             label: 'Revise',
    //             functionName: 'triggerRevision(' + JSON.stringify(revUrl) + ')'
    //         })
    //     }
    // }

    return { beforeLoad }
});