/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */

define(['N/record', 'N/log', 'N/search'], function (record, log, search) {
    function getDueDate(nr) {
        return new Date(new Date(nr.getValue('shipdate')).setDate(new Date(nr.getValue('shipdate')).getDate() - 7))
    }

    function internalTrade(context) {
        const nr = context.newRecord
        const transaction = currentTransaction(nr)
        let crpoId
        try {
            crpoId = intercompanyIntiator(nr, transaction)
        } catch (e) {
            log.error({
                title: `Failed to create po for ${nr.getText('tranid')}`,
                details: e.message || String(e)
            })
            return
        }
        try {
            intercompanyOrder(nr, transaction, crpoId)
        } catch (e) {
            log.error({
                title: `Failed to create so for ${nr.getText('tranid')}`,
                details: e.message || String(e)
            })
            return
        }
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
                const fullRateItems = { freight: 5667, rush: 5673 }
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
                    const itemText = nr.getSublistText({
                        sublistId,
                        fieldId: 'item',
                        line: i
                    })
                    const normalizedItem = (itemText || '').toLowerCase()
                    const matchedFullRateKey = Object.keys(fullRateItems).find(function (key) {
                        return normalizedItem.includes(key)
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
                    const targetItemId = matchedFullRateKey && crpo.type === 'salesorder'
                        ? fullRateItems[matchedFullRateKey]
                        : itemId
                    const targetRate = matchedFullRateKey
                        ? originalRate
                        : originalRate * multiplier

                    crpo.selectNewLine({ sublistId });
                    crpo.setCurrentSublistValue({ sublistId, fieldId: 'item', value: targetItemId })
                    crpo.setCurrentSublistValue({ sublistId, fieldId: 'quantity', value: qty })
                    crpo.setCurrentSublistValue({ sublistId, fieldId: 'rate', value: targetRate })
                    crpo.commitLine({ sublistId })
                }
            },
            itemType: itemType,
            item: itemId
        }
    }

    const clearance = {
        1: 1, 2: 2,
        7: 3, 9: 14, 15: 12,
        14: 9, 13: 8,
        cpvr: 10594,
        scx: 6458
    }

    return {
        onAction: internalTrade
    }

    function intercompanyIntiator(nr, rec) {
        const linkedPoId = nr.getValue('custbody_linked_po')
        let crpo
        let isNew = !linkedPoId

        if (linkedPoId) {
            try {
                crpo = record.load({
                    type: 'purchaseorder',
                    id: linkedPoId,
                    isDynamic: true
                })
            } catch (e) {
                log.error({
                    title: `Failed to load${linkedPoId}`,
                    details: e.message || String(e)
                })
                crpo = record.create({
                    type: 'purchaseorder',
                    isDynamic: true
                })
                isNew = true
            }
        } else {
            crpo = record.create({
                type: 'purchaseorder',
                isDynamic: true
            })
        }

        setPoHeader(crpo, nr, rec)

        if (!isNew) {
            clearSublistLines(crpo, 'item')
        }

        rec.items(crpo, rec.resalePct, true)

        crpo.setValue({
            fieldId: 'class',
            value: clearance[rec.orderType]
        })

        const crpoId = crpo.save()

        if (isNew) {
            record.submitFields({
                type: nr.type,
                id: nr.id,
                values: {
                    custbody_linked_po: crpoId
                }
            })
        }

        log.debug('Intercompany PO upsert complete', 'POID: ' + crpoId)
        return crpoId
    }

    function setPoHeader(crpo, nr, rec) {
        crpo.setValue({
            fieldId: 'entity',
            value: clearance.cpvr
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
            value: getDueDate(nr)
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
    }

    function clearSublistLines(recObj, sublistId) {
        let count = recObj.getLineCount({ sublistId: sublistId })
        while (count > 0) {
            recObj.removeLine({
                sublistId: sublistId,
                line: count - 1
            })
            count--
        }
    }

    function intercompanyOrder(nr, trans, otherref) {
        const icNumber = Number(nr.getValue('custbody_ic_number'))
        log.debug('icNumber', icNumber)
        let crso
        let isNew = !icNumber

        if (icNumber) {
            try {
                crso = record.load({
                    type: 'salesorder',
                    id: icNumber,
                    isDynamic: true
                })
            } catch (e) {
                log.error({
                    title: `Failed to load linked sales order ${icNumber}`,
                    details: e.message || String(e)
                })
                crso = record.create({
                    type: 'salesorder',
                    isDynamic: true
                })
                isNew = true
            }
        } else {
            crso = record.create({
                type: 'salesorder',
                isDynamic: true
            })
        }

        const ponum = search.lookupFields({
            type: 'purchaseorder',
            id: otherref,
            columns: ['tranid']
        }).tranid

        setSalesOrderHeader(crso, nr, trans, ponum)

        if (!isNew) {
            clearSublistLines(crso, 'item')
        }

        trans.items(crso, trans.resalePct, false)

        const crsoId = crso.save({
            ignoreMandatoryFields: true
        })

        if (isNew) {
            record.submitFields({
                type: nr.type,
                id: nr.id,
                values: {
                    custbody_ic_number: crsoId,
                    custbody_intercompany_ref_so:
                        search.lookupFields({
                            type: 'salesorder',
                            id: crsoId,
                            columns: ['tranid']
                        }).tranid
                }
            })
        }

        log.debug('Intercompany SO upsert complete', 'SOID: ' + crsoId)
    }

    function setSalesOrderHeader(crso, nr, trans, ponum) {
        crso.setValue({
            fieldId: 'entity',
            value: clearance.scx
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
        crso.setValue({
            fieldId: 'custbody_intercompany_ref_so',
            value: nr.getText('tranid')
        })
    }
})

