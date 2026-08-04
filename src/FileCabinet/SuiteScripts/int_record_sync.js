/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */

define(['N/record', 'N/runtime', 'N/log', 'N/search'], function (record, runtime, log, search) {
    function internalTrade(context) {
        const rt = runtime.getCurrentScript()
        const nr = context.newRecord
        const transaction = currentTransaction(nr)
        let crpoId
        try {
            crpoId = intercompanyIntiator(nr, transaction)
        } catch (e) {
            log.error({
                title: `Failed to create purchase order for ${nr.getText('tranid')}`,
                details: e.message || String(e)
            })
            return
        }
        try {
            intercompanyOrder(nr, transaction, crpoId)
        } catch (e) {
            log.error({
                title: `Failed to create sales order for ${nr.getText('tranid')}`,
                details: e.message || String(e)
            })
            return
        }
        log.debug('Remaining limit', rt.getRemainingUsage())
    }

    const currentTransaction = (nr) => {
        let itemType, itemId
        return {
            requester: nr.getText('custbody_project_manager') ? nr.getText('custbody_project_manager') : nr.getText('salesrep'),
            memo: `Project Name: ${nr.getText('custbody_viso_project')} 1. Please put your delivery date on the invoice. 2. Please put our PO number on the invoice. 3. Each Carton must be labeled with: PO number, Part number, Project name, Quantity and Carton number. 4. Please refer to drawings for more details. 5. Please sign the work back schedule.`,
            project: nr.getValue('custbody_viso_project'),
            location: nr.getValue('location'),
            terms: nr.getValue('terms'),
            orderType: nr.getValue('ordertype'),
            icproject: nr.getText('custbody_viso_project'),
            resalePct: !nr.getValue('custbody_intercomp_resale_pct') ? .4 : nr.getValue('custbody_intercomp_resale_pct'),
            items: (crpo, multiplier, submitIntercompanyOrder = false) => {
                const sublistId = 'item'
                const len = nr.getLineCount({ sublistId })
                for (let i = 0; i < len; i++) {
                    const originalRate = nr.getSublistValue({
                        sublistId,
                        fieldId: 'rate',
                        line: i
                    })
                    itemId = nr.getSublistValue({
                        sublistId,
                        fieldId: 'item',
                        line: i
                    })
                    itemType = nr.getSublistValue({
                        sublistId,
                        fieldId: 'itemtype',
                        line: i
                    })
                    const qty = nr.getSublistValue({
                        sublistId,
                        fieldId: 'quantity',
                        line: i
                    })
                    if (itemType === 'Assembly' && submitIntercompanyOrder) {
                        record.submitFields({
                            type: 'assemblyitem',
                            id: itemId,
                            values: {
                                location: '',
                                subsidiary: ['3', '2']
                            }
                        })
                    }
                    crpo.selectNewLine({ sublistId });
                    crpo.setCurrentSublistValue({ sublistId, fieldId: 'item', value: itemId })
                    crpo.setCurrentSublistValue({ sublistId, fieldId: 'quantity', value: qty })
                    crpo.setCurrentSublistValue({ sublistId, fieldId: 'rate', value: originalRate * multiplier })
                    crpo.commitLine({ sublistId })
                }
            },
            itemType: itemType,
            item: itemId
        }
    }

    return {
        onAction: internalTrade
    }
    
    function intercompanyIntiator(nr, rec) {
        const typeselector = {
            1: 1, 2: 2, 7: 3, 9: 14, 15: 12, 14: 9, 13: 8
        }
        const isCreated = nr.getValue('custbody_linked_po')
        if (!isCreated) {
            const crpo = record.create({
                type: 'purchaseorder',
                isDynamic: true
            })

            crpo.setValue({
                fieldId: 'entity',
                value: 10594
            })
            crpo.setValue({
                fieldId: 'custbody_ship_ref_so',
                value: nr.id
            })
            crpo.setValue({
                fieldId: 'memo',
                value: rec.memo
            })
            crpo.setValue({
                fieldId: 'duedate',
                value: new Date(new Date(nr.getValue('shipdate')).setDate(new Date(nr.getValue('shipdate')).getDate() - 7))
            })
            crpo.setValue({
                fieldId: 'custbody_viso_project',
                value: rec.project
            })
            crpo.setValue({
                fieldId: 'custbodyrequestedby',
                value: rec.requester
            })
            crpo.setValue({
                fieldId: 'location',
                value: rec.location
            })
            crpo.setValue({
                fieldId: 'terms',
                value: rec.terms
            })
            rec.items(crpo, rec.resalePct, true)

            crpo.setValue({
                fieldId: 'class',
                value: typeselector[rec.orderType]
            })
            var crpoId = crpo.save()
            log.debug('Execution reached end of scripit', ' POID: ' + crpoId)
            return crpoId
        } else {

        }
    }

    function intercompanyOrder(nr, trans, otherref) {
        const crso = record.create({
            type: 'salesorder',
            isDynamic: true
        })
        const ponum = search.lookupFields({
            type: 'purchaseorder',
            id: otherref,
            columns: ['tranid']
        }).tranid
        crso.setValue({
            fieldId: 'entity',
            value: 6458
        })
        crso.setValue({
            fieldId: 'otherrefnum',
            value: ponum
        })
        crso.setValue({
            fieldId: 'ordertype',
            value: trans.orderType
        })
        crso.setValue({
            fieldId: 'custbody12',
            value: trans.icproject
        })
        trans.items(crso, trans.resalePct, false)
        const crsoId = crso.save({
            ignoreMandatoryFields: true
        })
        log.debug('Execution reached end of scripit', 'SOID: ' + crsoId)
    }
})

