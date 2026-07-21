/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */

define(['N/record', 'N/search', 'N/log'], function (record, search, log) {
    function onAction(context) {
        const nr = context.newRecord
        const typeselector = {
            1: 1,2: 2, 7: 3, 9: 14,15: 12, 14: 9,13: 8
        }
        const crpo = record.create({
            type: 'purchaseorder',
            isDynamic: true
        })

        crpo.setValue({
            fieldId: 'entity',
            value: 10954
        })
        crpo.setValue({
            fieldId: 'custbody_ship_ref_so',
            value: nr.id
        })
        crpo.setValue({
            fieldId: 'memo',
            value: `Project Name: ${nr.getValue('custbody_viso_project')} 1. Please put your delivery date on the invoice. 2. Please put our PO number on the invoice. 3. Each Carton must be labeled with: PO number, Part number, Project name, Quantity and Carton number. 4. Please refer to drawings for more details. 5. Please sign the work back schedule.`
        })
        crpo.setValue({
            fieldId: 'duedate',
            value: new Date(new Date(nr.getValue('shipdate')).setDate(new Date(nr.getValue('shipdate')).getDate() - 7))
        })
        crpo.setValue({
            fieldId: 'custbody_viso_project',
            value: nr.getValue('custbody_viso_project')
        })
        crpo.setValue({
            fieldId: 'location',
            value: nr.getValue('location')
        })
        crpo.setValue({
            fieldId: 'terms',
            value: nr.getValue('terms')
        })
        crpo.setValue({
            fieldId: 'class',
            value: typeselector[nr.getValue('ordertype')]
        })
        

    }
    return {
        onAction: onAction
    };
});