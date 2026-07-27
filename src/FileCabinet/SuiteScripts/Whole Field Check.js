/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/currentRecord'], (currentRecord) => {

    function validateLine(context) {
        const cr = context.currentRecord
        const qty = cr.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity'
        })

        if (qty % 1 !== 0) {
            alert('Quantity item cannnot be decimal.');
            log.debug('qty sid ' + rec.id, qty)
            return false;
        }

        return true
    }
    return { validateLine: validateLine }
})