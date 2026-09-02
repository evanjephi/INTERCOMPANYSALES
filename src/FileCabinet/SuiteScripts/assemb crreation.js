/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

//Code Written by Even Yohans 2025/07/16
// define(['N/record', 'N/search', 'N/runtime', 'N/log'], function (record, search, runtime, log) {

//     function getInputData() {
//         const soId = runtime.getCurrentScript().getParameter({ name: 'custscriptcustscript_soid' })
//         if (!soId) return []

//         let so
//         try {
//             so = record.load({ type: record.Type.SALES_ORDER, id: soId, isDynamic: false })
//         } catch (e) {
//             log.error('Load SO Failed', e.message)
//             return []
//         }

//         const lineCount = so.getLineCount({
//             sublistId: 'item'
//         })
//         const vin = [
//             10720, 11033, 6097,
//             6100, 10721, 6102,
//             10719, 17397, 6101,
//             6096, 6095, 10722,
//             6098, 6099
//         ]

//         const soNum = so.getValue('tranid')
//         const baseAssemblyName = getAssemblyBaseName(soNum)
//         const startIndex = getExistingAssemblyIndexes(baseAssemblyName)
//         const inputs = []
//         for (let i = 0; i < lineCount; i++) {
//             const itemType = so.getSublistValue({
//                 sublistId: 'item',
//                 fieldId: 'itemtype',
//                 line: i
//             })
//             const itemId = so.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i })
//             const isReleased = so.getSublistValue({
//                 sublistId: 'item',
//                 fieldId: 'custcol_release_order',
//                 line: i
//             })
//             const lineId = so.getSublistValue({
//                 sublistId: 'item',
//                 fieldId: 'line',
//                 line: i
//             })

//             if (!lineId) continue
//             if (itemType !== 'InvtPart' || !(isReleased === true || isReleased === 'T')) continue
//             if (vin.indexOf(Number(itemId)) === -1) continue
//             inputs.push({
//                 soId,
//                 lineId,
//                 lineIndex: i,
//                 lineCount,
//                 description: so.getSublistValue({
//                     sublistId: 'item',
//                     fieldId: 'description',
//                     line: i
//                 }) || '',
//                 quantity: so.getSublistValue({
//                     sublistId: 'item',
//                     fieldId: 'quantity',
//                     line: i
//                 }) || 1,
//                 rate: so.getSublistValue({
//                     sublistId: 'item',
//                     fieldId: 'rate',
//                     line: i
//                 }) || 0,
//                 taxcode: so.getSublistValue({
//                     sublistId: 'item',
//                     fieldId: 'taxcode',
//                     line: i
//                 }),
//                 suffixIndex: startIndex + inputs.length,
//                 baseAssemblyName,
//                 location: so.getValue('location'),
//                 subsidiaryId: so.getValue('subsidiary'),
//                 subsidiaryText: so.getText('subsidiary') || '',
//                 currency: so.getValue('currency')
//             })
//         }
//         log.audit('1 EXTRACTION ' + soId, inputs)
//         return inputs
//     }

//     function map(context) {
//         const value = JSON.parse(context.value)

//         const assemblyName = `${value.baseAssemblyName}-${value.suffixIndex}`
//         const assemblyItemName = value.baseAssemblyName

//         context.write({
//             key: value.soId,
//             value: JSON.stringify({
//                 lineId: value.lineId,
//                 lineIndex: value.lineIndex,
//                 lineCount: value.lineCount,
//                 assemblyName,
//                 description: value.description,
//                 quantity: value.quantity,
//                 rate: value.rate,
//                 taxcode: value.taxcode,
//                 location: value.location,
//                 subsidiaryId: value.subsidiaryId,
//                 subsidiaryText: value.subsidiaryText,
//                 currency: value.currency,
//                 assemblyItemName
//             })
//         })
//     }

//     function reduce(context) {
//         const soId = context.key
//         const updates = context.values.map(JSON.parse)
//         try {
//             const soRec = record.load({
//                 type: record.Type.SALES_ORDER,
//                 id: soId,
//                 isDynamic: true
//             })
//             const sub = soRec.getValue('subsidiary')
//             const lineCount = soRec.getLineCount({ sublistId: 'item' })

//             updates.forEach(update => {
//                 const assemblyId = getAssemblyIdByName(soId, update)
//                 for (let i = 0; i < lineCount; i++) {
//                     const lineId = soRec.getSublistValue({
//                         sublistId: 'item',
//                         fieldId: 'line',
//                         line: i
//                     })
//                     if (lineId == update.lineId) {
//                         soRec.selectLine({ sublistId: 'item', line: i })
//                         if (Array.isArray(assemblyId)) {
//                             for (const id of assemblyId) {
//                                 const recId = soRec.getSublistValue({
//                                     sublistId: 'item',
//                                     fieldId: 'item', line: i
//                                 })
//                                 if (recId == id) soRec.setCurrentSublistValue({
//                                     sublistId: 'item',
//                                     fieldId: 'item',
//                                     value: id
//                                 });
//                             }
//                         } else soRec.setCurrentSublistValue({
//                             sublistId: 'item', fieldId: 'item', value: assemblyId
//                         })

//                         if (update.quantity) soRec.setCurrentSublistValue({
//                             sublistId: 'item',
//                             fieldId: 'quantity',
//                             value: update.quantity
//                         })
//                         if (update.rate !== null && update.rate !== undefined) {
//                             soRec.setCurrentSublistValue({
//                                 sublistId: 'item',
//                                 fieldId: 'rate',
//                                 value: update.rate
//                             });
//                         }
//                         if (sub === 3 && update.taxcode === -7) {
//                             soRec.setCurrentSublistValue({
//                                 sublistId: 'item',
//                                 fieldId: 'taxcode',
//                                 value: -8
//                             });
//                         } else if (update.taxcode) {
//                             soRec.setCurrentSublistValue({
//                                 sublistId: 'item',
//                                 fieldId: 'taxcode',
//                                 value: update.taxcode
//                             });
//                         }

//                         soRec.commitLine({ sublistId: 'item' })
//                         break
//                     }
//                 }
//             })

//             soRec.setValue({ fieldId: 'custbody_processing_assembly', value: false })
//             saveRec(soRec)
//             log.audit('2 SO Updated', `ID: ${soId}, Lines Updated: ${updates.length}, Updated Items:  ${JSON.stringify(updates)}`)

//         } catch (e) {
//             log.error('Reduce Error', `SO: ${soId}, Msg: ${e.message}`)
//         }
//     }

//     function getAssemblyBaseName(soid) {
//         soid = String(soid || '').toUpperCase()
//         if (soid.indexOf('SOD') === 0) return 'D' + soid.replace(/\D/g, '')
//         if (soid.indexOf('SOR') === 0) return 'R' + soid.replace(/\D/g, '')
//         if (soid.indexOf('SOM') === 0) return 'M' + soid.replace(/\D/g, '')
//         return soid.replace(/\D/g, '')
//     }

//     function getExistingAssemblyIndexes(baseAssemblyName) {
//         let maxIndex = 0
//         const as = search.create({
//             type: search.Type.ASSEMBLY_ITEM,
//             filters: [['itemid', 'startswith', baseAssemblyName + '-']],
//             columns: ['itemid']
//         })
//         as.run().each(r => {
//             const itemid = r.getValue('itemid')
//             const match = itemid && itemid.match(/-(\d+)$/)

//             if (match) {
//                 const idx = parseInt(match[1], 10)
//                 if (idx > maxIndex) maxIndex = idx
//             }
//             return true
//         })
//         return maxIndex + 1
//     }

//     function getAssemblyIdByName(soId, opts) {
//         try {
//             if (!soId || !opts.lineId) {
//                 log.audit('Skip Search', `Missing soId (${soId}) or lineId (${opts.lineId})`)
//                 return null
//             }

//             const asmSearch = search.create({
//                 type: record.Type.ASSEMBLY_ITEM,
//                 filters: [
//                     ['custitem_source_so', 'equalto', String(soId)],
//                     'AND',
//                     ['custitem_source_line', 'equalto', String(opts.lineId)]
//                 ],
//                 columns: ['internalid', 'custitem_source_so', 'custitem_source_line', 'itemid']
//             })

//             const result = asmSearch.run().getRange({ start: 0, end: 1 });

//             if (result && result.length > 0) {
//                 const asmId = result[0].getValue('internalid');
//                 const sourceSO = result[0].getValue('custitem_source_so');
//                 const sourceLine = result[0].getValue('custitem_source_line');
//                 const asmName = result[0].getValue('itemid');

//                 if (String(sourceSO) !== String(soId) || String(sourceLine) !== String(opts.lineId)) {
//                 } else {
//                     const updateFields = {};
//                     if (opts.description) updateFields.description = opts.description;
//                     if (opts.quantity) updateFields.custitem_so_item_qty = opts.quantity;

//                     if (Object.keys(updateFields).length) {
//                         record.submitFields({
//                             type: record.Type.ASSEMBLY_ITEM,
//                             id: asmId,
//                             values: updateFields
//                         });
//                     }

//                     return asmId;
//                 }
//             }

//             const recAsm = record.create({ type: record.Type.ASSEMBLY_ITEM, isDynamic: true });
//             recAsm.setValue({ fieldId: 'itemid', value: opts.assemblyName });
//             recAsm.setValue({ fieldId: 'displayname', value: opts.assemblyName });
//             if (opts.description) recAsm.setValue({ fieldId: 'description', value: opts.description });
//             if (opts.quantity) recAsm.setValue({ fieldId: 'custitem_so_item_qty', value: opts.quantity });
//             recAsm.setValue({ fieldId: 'class', value: 2 });
//             if (opts.location) recAsm.setValue({ fieldId: 'location', value: opts.location });

//             const fullSubsidiaryName = 'Parent Company : ' + (opts.subsidiaryText || '');
//             const subId = getSubsidiaryIdByName(fullSubsidiaryName) || opts.subsidiaryId
//             recAsm.setValue({ fieldId: 'subsidiary', value: subId })

//             recAsm.setValue({ fieldId: 'custitem_source_so', value: soId });
//             recAsm.setValue({ fieldId: 'custitem_source_line', value: opts.lineId });

//             recAsm.setValue({ fieldId: 'costcategory', value: 4 });
//             recAsm.setValue({ fieldId: 'cogsaccount', value: 355 });
//             recAsm.setValue({ fieldId: 'assetaccount', value: 260 });
//             recAsm.setValue({ fieldId: 'incomeaccount', value: 54 });
//             recAsm.setValue({ fieldId: 'scrapacct', value: 428 });
//             recAsm.setValue({ fieldId: 'wipacct', value: 264 });
//             recAsm.setValue({ fieldId: 'taxschedule', value: 1 });

//             if ([6, 2, 5].includes(subId)) {
//                 recAsm.setValue({ fieldId: 'billpricevarianceacct', value: 546 });
//             }

//             const newAsmId = recAsm.save();
//             const priceSL = {
//                 1: 'price1',
//                 2: 'price2',
//                 3: 'price3',
//                 4: 'price4',
//                 5: 'price5',
//                 6: 'price6'
//             }

//             if (opts.rate && opts.currency && priceSL[opts.currency]) {
//                 try {
//                     const recPrice = record.load({
//                         type: record.Type.ASSEMBLY_ITEM,
//                         id: newAsmId
//                     });
//                     recPrice.setSublistValue({
//                         sublistId: priceSL[opts.currency],
//                         fieldId: 'price_1_',
//                         line: 0,
//                         value: opts.rate
//                     });
//                     recPrice.save();
//                 } catch (e) {
//                     log.error('Price Update Failed', e.message);
//                 }
//             }

//             return newAsmId;

//         } catch (e) {
//             log.error('getAssemblyIdByName Error', e.message);
//             return null;
//         }
//     }

//     function getSubsidiaryIdByName(name) {
//         const searchSub = search.create({
//             type: search.Type.SUBSIDIARY,
//             filters: [['name', 'is', name]],
//             columns: ['internalid']
//         })
//         const res = searchSub.run().getRange({ start: 0, end: 1 }) || []
//         return res.length > 0 ? res[0].getValue({ name: 'internalid' }) : null
//     }

//     function summarize(summary) {
//         try {
//             const soId = runtime.getCurrentScript().getParameter({ name: 'custscriptcustscript_soid' })
//             if (soId) {
//                 record.submitFields({
//                     type: record.Type.SALES_ORDER,
//                     id: soId,
//                     values: { custbody_processing_assembly: false }
//                 })
//             }
//         } catch (e) {
//             log.error('Summarize flag clear failed', e.name + ': ' + e.message)
//         }

//         if (summary.mapSummary.errors) {
//             summary.mapSummary.errors.iterator().each((key, err) => {
//                 log.error('Map Error', `Key: ${key}, Error: ${err}`)
//                 return true
//             })
//         }
//         if (summary.reduceSummary.errors) {
//             summary.reduceSummary.errors.iterator().each((key, err) => {
//                 log.error('Reduce Error', `Key: ${key}, Error: ${err}`)
//                 return true
//             })
//         }
//     }

//     function saveRec(rec, maxRetries = 3) {
//         let attempt = 0;
//         while (attempt < maxRetries) {
//             try {
//                 return rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
//             } catch (e) {
//                 if (e.name === 'RCRD_HAS_BEEN_CHANGED') {
//                     log.audit('Retrying Save', `Record changed, retry ${attempt + 1}`);
//                     rec = record.load({
//                         type: record.Type.SALES_ORDER,
//                         id: rec.id,
//                         isDynamic: false
//                     });
//                     attempt++;
//                 } else {
//                     throw e;
//                 }
//             }
//         }
//         throw new Error(`Failed after ${maxRetries} retries`);
//     }

//     return {
//         getInputData,
//         map,
//         reduce,
//         summarize
//     }
// })

//define(["N/record","N/search","N/runtime","N/log"],function(e,t,i,s){return{getInputData:function(){const a=i.getCurrentScript().getParameter({name:"custscriptcustscript_soid"});if(!a)return[];let r;try{r=e.load({type:e.Type.SALES_ORDER,id:a,isDynamic:!1})}catch(e){return s.error("Load SO Failed",e.message),[]}const l=r.getLineCount({sublistId:"item"}),u=[10720,11033,6097,6100,10721,6102,10719,17397,6101,6096,6095,10722,6098,6099],n=(d=r.getValue("tranid"),0===(d=String(d||"").toUpperCase()).indexOf("SOD")?"D"+d.replace(/\D/g,""):0===d.indexOf("SOR")?"R"+d.replace(/\D/g,""):0===d.indexOf("SOM")?"M"+d.replace(/\D/g,""):d.replace(/\D/g,""));var d;const c=function(e){let i=0;return t.create({type:t.Type.ASSEMBLY_ITEM,filters:[["itemid","startswith",e+"-"]],columns:["itemid"]}).run().each(e=>{const t=e.getValue("itemid"),s=t&&t.match(/-(\d+)$/);if(s){const e=parseInt(s[1],10);e>i&&(i=e)}return!0}),i+1}(n),o=[];for(let e=0;e<l;e++){const t=r.getSublistValue({sublistId:"item",fieldId:"itemtype",line:e}),i=r.getSublistValue({sublistId:"item",fieldId:"item",line:e}),s=r.getSublistValue({sublistId:"item",fieldId:"custcol_release_order",line:e}),d=r.getSublistValue({sublistId:"item",fieldId:"line",line:e});d&&("InvtPart"!==t||!0!==s&&"T"!==s||-1!==u.indexOf(Number(i))&&o.push({soId:a,lineId:d,lineIndex:e,lineCount:l,description:r.getSublistValue({sublistId:"item",fieldId:"description",line:e})||"",quantity:r.getSublistValue({sublistId:"item",fieldId:"quantity",line:e})||1,rate:r.getSublistValue({sublistId:"item",fieldId:"rate",line:e})||0,taxcode:r.getSublistValue({sublistId:"item",fieldId:"taxcode",line:e}),suffixIndex:c+o.length,baseAssemblyName:n,location:r.getValue("location"),subsidiaryId:r.getValue("subsidiary"),subsidiaryText:r.getText("subsidiary")||"",currency:r.getValue("currency")}))}return s.audit("1 EXTRACTION "+a,o),o},map:function(e){const t=JSON.parse(e.value),i=`${t.baseAssemblyName}-${t.suffixIndex}`,s=t.baseAssemblyName;e.write({key:t.soId,value:JSON.stringify({lineId:t.lineId,lineIndex:t.lineIndex,lineCount:t.lineCount,assemblyName:i,description:t.description,quantity:t.quantity,rate:t.rate,taxcode:t.taxcode,location:t.location,subsidiaryId:t.subsidiaryId,subsidiaryText:t.subsidiaryText,currency:t.currency,assemblyItemName:s})})},reduce:function(i){const a=i.key,r=i.values.map(JSON.parse);try{const i=e.load({type:e.Type.SALES_ORDER,id:a,isDynamic:!0}),l=i.getValue("subsidiary"),u=i.getLineCount({sublistId:"item"});r.forEach(r=>{const n=function(i,a){try{if(!i||!a.lineId)return s.audit("Skip Search",`Missing soId (${i}) or lineId (${a.lineId})`),null;const r=t.create({type:e.Type.ASSEMBLY_ITEM,filters:[["custitem_source_so","equalto",String(i)],"AND",["custitem_source_line","equalto",String(a.lineId)]],columns:["internalid","custitem_source_so","custitem_source_line","itemid"]}).run().getRange({start:0,end:1});if(r&&r.length>0){const t=r[0].getValue("internalid"),s=r[0].getValue("custitem_source_so"),l=r[0].getValue("custitem_source_line");if(r[0].getValue("itemid"),String(s)===String(i)&&String(l)===String(a.lineId)){const i={};return a.description&&(i.description=a.description),a.quantity&&(i.custitem_so_item_qty=a.quantity),Object.keys(i).length&&e.submitFields({type:e.Type.ASSEMBLY_ITEM,id:t,values:i}),t}}const l=e.create({type:e.Type.ASSEMBLY_ITEM,isDynamic:!0});l.setValue({fieldId:"itemid",value:a.assemblyName}),l.setValue({fieldId:"displayname",value:a.assemblyName}),a.description&&l.setValue({fieldId:"description",value:a.description}),a.quantity&&l.setValue({fieldId:"custitem_so_item_qty",value:a.quantity}),l.setValue({fieldId:"class",value:2}),a.location&&l.setValue({fieldId:"location",value:a.location});const u=function(e){const i=t.create({type:t.Type.SUBSIDIARY,filters:[["name","is",e]],columns:["internalid"]}).run().getRange({start:0,end:1})||[];return i.length>0?i[0].getValue({name:"internalid"}):null}("Parent Company : "+(a.subsidiaryText||""))||a.subsidiaryId;u&&l.setValue({fieldId:"subsidiary",value:u}),l.setValue({fieldId:"custitem_source_so",value:i}),l.setValue({fieldId:"custitem_source_line",value:a.lineId}),l.setValue({fieldId:"costcategory",value:4}),l.setValue({fieldId:"cogsaccount",value:355}),l.setValue({fieldId:"assetaccount",value:260}),l.setValue({fieldId:"incomeaccount",value:54}),l.setValue({fieldId:"scrapacct",value:428}),l.setValue({fieldId:"wipacct",value:264}),l.setValue({fieldId:"taxschedule",value:1}),[6,2,5].includes(u)&&l.setValue({fieldId:"billpricevarianceacct",value:546});const n=l.save(),d={1:"price1",2:"price2",3:"price3",4:"price4",5:"price5",6:"price6"};if(a.rate&&a.currency&&d[a.currency])try{const t=e.load({type:e.Type.ASSEMBLY_ITEM,id:n});t.setSublistValue({sublistId:d[a.currency],fieldId:"price_1_",line:0,value:a.rate}),t.save()}catch(e){s.error("Price Update Failed",e.message)}return n}catch(e){return s.error("getAssemblyIdByName Error",e.message),null}}(a,r);for(let e=0;e<u;e++)if(i.getSublistValue({sublistId:"item",fieldId:"line",line:e})==r.lineId){if(i.selectLine({sublistId:"item",line:e}),Array.isArray(n))for(const t of n)i.getSublistValue({sublistId:"item",fieldId:"item",line:e})==t&&i.setCurrentSublistValue({sublistId:"item",fieldId:"item",value:t});else i.setCurrentSublistValue({sublistId:"item",fieldId:"item",value:n});if(r.quantity&&i.setCurrentSublistValue({sublistId:"item",fieldId:"quantity",value:r.quantity}),null!==r.rate&&void 0!==r.rate&&i.setCurrentSublistValue({sublistId:"item",fieldId:"rate",value:r.rate}),"3"===l)try{i.setCurrentSublistValue({sublistId:"item",fieldId:"taxcode",value:r.taxcode})}catch(e){const t=String(r.taxcode);if(e.message.includes(`Invalid Field Value ${t}`)&&e.message.includes("taxcode")){const a={"-7":-8,"-8":-7}[t];a||s.error("Value Field Error",e.message),i.setCurrentSublistValue({sublistId:"item",fieldId:"taxcode",value:a})}}else r.taxcode&&i.setCurrentSublistValue({sublistId:"item",fieldId:"taxcode",value:r.taxcode});i.commitLine({sublistId:"item"});break}}),i.setValue({fieldId:"custbody_processing_assembly",value:!1}),function(t,i=3){let a=0;for(;a<i;)try{return t.save({enableSourcing:!1,ignoreMandatoryFields:!0})}catch(i){if("RCRD_HAS_BEEN_CHANGED"!==i.name)throw i;s.audit("Retrying Save",`Record changed, retry ${a+1}`),t=e.load({type:e.Type.SALES_ORDER,id:t.id,isDynamic:!1}),a++}throw new Error(`Failed after ${i} retries`)}(i),s.audit("2 SO Updated",`ID: ${a}, Lines Updated: ${r.length}, Updated Items:  ${JSON.stringify(r)}`)}catch(e){s.error("Reduce Error",`SO: ${a}, Msg: ${e.message}`)}},summarize:function(t){try{const t=i.getCurrentScript().getParameter({name:"custscriptcustscript_soid"});t&&e.submitFields({type:e.Type.SALES_ORDER,id:t,values:{custbody_processing_assembly:!1}})}catch(e){s.error("Summarize flag clear failed",e.name+": "+e.message)}t.mapSummary.errors&&t.mapSummary.errors.iterator().each((e,t)=>(s.error("Map Error",`Key: ${e}, Error: ${t}`),!0)),t.reduceSummary.errors&&t.reduceSummary.errors.iterator().each((e,t)=>(s.error("Reduce Error",`Key: ${e}, Error: ${t}`),!0))}}});
define(["N/record","N/search","N/runtime","N/log"],function(e,t,i,s){return{getInputData:function(){const a=i.getCurrentScript().getParameter({name:"custscriptcustscript_soid"});if(!a)return[];let r;try{r=e.load({type:e.Type.SALES_ORDER,id:a,isDynamic:!1})}catch(e){return s.error("Load SO Failed",e.message),[]}const l=r.getLineCount({sublistId:"item"}),u=[10720,11033,6097,6100,10721,6102,10719,17397,6101,6096,6095,10722,6098,6099],n=(d=r.getValue("tranid"),0===(d=String(d||"").toUpperCase()).indexOf("SOD")?"D"+d.replace(/\D/g,""):0===d.indexOf("SOR")?"R"+d.replace(/\D/g,""):0===d.indexOf("SOM")?"M"+d.replace(/\D/g,""):d.replace(/\D/g,""));var d;const c=function(e){let i=0;return t.create({type:t.Type.ASSEMBLY_ITEM,filters:[["itemid","startswith",e+"-"]],columns:["itemid"]}).run().each(e=>{const t=e.getValue("itemid"),s=t&&t.match(/-(\d+)$/);if(s){const e=parseInt(s[1],10);e>i&&(i=e)}return!0}),i+1}(n),o=[];for(let e=0;e<l;e++){const t=r.getSublistValue({sublistId:"item",fieldId:"itemtype",line:e}),i=r.getSublistValue({sublistId:"item",fieldId:"item",line:e}),s=r.getSublistValue({sublistId:"item",fieldId:"custcol_release_order",line:e}),d=r.getSublistValue({sublistId:"item",fieldId:"line",line:e});d&&("InvtPart"!==t||!0!==s&&"T"!==s||-1!==u.indexOf(Number(i))&&o.push({soId:a,lineId:d,lineIndex:e,lineCount:l,description:r.getSublistValue({sublistId:"item",fieldId:"description",line:e})||"",quantity:r.getSublistValue({sublistId:"item",fieldId:"quantity",line:e})||1,rate:r.getSublistValue({sublistId:"item",fieldId:"rate",line:e})||0,taxcode:r.getSublistValue({sublistId:"item",fieldId:"taxcode",line:e}),suffixIndex:c+o.length,baseAssemblyName:n,location:r.getValue("location"),subsidiaryId:r.getValue("subsidiary"),subsidiaryText:r.getText("subsidiary")||"",currency:r.getValue("currency")}))}return s.audit("1 EXTRACTION "+a,o),o},map:function(e){const t=JSON.parse(e.value),i=`${t.baseAssemblyName}-${t.suffixIndex}`,s=t.baseAssemblyName;e.write({key:t.soId,value:JSON.stringify({lineId:t.lineId,lineIndex:t.lineIndex,lineCount:t.lineCount,assemblyName:i,description:t.description,quantity:t.quantity,rate:t.rate,taxcode:t.taxcode,location:t.location,subsidiaryId:t.subsidiaryId,subsidiaryText:t.subsidiaryText,currency:t.currency,assemblyItemName:s})})},reduce:function(i){const a=i.key,r=i.values.map(JSON.parse);try{const i=e.load({type:e.Type.SALES_ORDER,id:a,isDynamic:!0}),l=i.getValue("subsidiary"),u=i.getLineCount({sublistId:"item"});r.forEach(r=>{const n=function(i,a){try{if(!i||!a.lineId)return s.audit("Skip Search",`Missing soId (${i}) or lineId (${a.lineId})`),null;const r=t.create({type:e.Type.ASSEMBLY_ITEM,filters:[["custitem_source_so","equalto",String(i)],"AND",["custitem_source_line","equalto",String(a.lineId)]],columns:["internalid","custitem_source_so","custitem_source_line","itemid"]}).run().getRange({start:0,end:1});if(r&&r.length>0){const t=r[0].getValue("internalid"),s=r[0].getValue("custitem_source_so"),l=r[0].getValue("custitem_source_line");if(r[0].getValue("itemid"),String(s)===String(i)&&String(l)===String(a.lineId)){const i={};return a.description&&(i.description=a.description),a.quantity&&(i.custitem_so_item_qty=a.quantity),Object.keys(i).length&&e.submitFields({type:e.Type.ASSEMBLY_ITEM,id:t,values:i}),t}}const l=e.create({type:e.Type.ASSEMBLY_ITEM,isDynamic:!0});l.setValue({fieldId:"itemid",value:a.assemblyName}),l.setValue({fieldId:"displayname",value:a.assemblyName}),a.description&&l.setValue({fieldId:"description",value:a.description}),a.quantity&&l.setValue({fieldId:"custitem_so_item_qty",value:a.quantity}),l.setValue({fieldId:"class",value:2}),a.location&&l.setValue({fieldId:"location",value:a.location});const u=function(e){const i=t.create({type:t.Type.SUBSIDIARY,filters:[["name","is",e]],columns:["internalid"]}).run().getRange({start:0,end:1})||[];return i.length>0?i[0].getValue({name:"internalid"}):null}("Parent Company : "+(a.subsidiaryText||""))||a.subsidiaryId;u&&l.setValue({fieldId:"subsidiary",value:u}),l.setValue({fieldId:"custitem_source_so",value:i}),l.setValue({fieldId:"custitem_source_line",value:a.lineId}),l.setValue({fieldId:"costcategory",value:4}),l.setValue({fieldId:"cogsaccount",value:355}),l.setValue({fieldId:"assetaccount",value:260}),l.setValue({fieldId:"incomeaccount",value:54}),l.setValue({fieldId:"scrapacct",value:428}),l.setValue({fieldId:"wipacct",value:264}),l.setValue({fieldId:"taxschedule",value:1}),[6,2,5].includes(u)&&l.setValue({fieldId:"billpricevarianceacct",value:546});const n=l.save(),d={1:"price1",2:"price2",3:"price3",4:"price4",5:"price5",6:"price6"};if(a.rate&&a.currency&&d[a.currency])try{const t=e.load({type:e.Type.ASSEMBLY_ITEM,id:n});t.setSublistValue({sublistId:d[a.currency],fieldId:"price_1_",line:0,value:a.rate}),t.save()}catch(e){s.error("Price Update Failed",e.message)}return n}catch(e){return s.error("getAssemblyIdByName Error",e.message),null}}(a,r);for(let e=0;e<u;e++)if(i.getSublistValue({sublistId:"item",fieldId:"line",line:e})==r.lineId){if(i.selectLine({sublistId:"item",line:e}),Array.isArray(n))for(const t of n)i.getSublistValue({sublistId:"item",fieldId:"item",line:e})==t&&i.setCurrentSublistValue({sublistId:"item",fieldId:"item",value:t});else i.setCurrentSublistValue({sublistId:"item",fieldId:"item",value:n});if(r.quantity&&i.setCurrentSublistValue({sublistId:"item",fieldId:"quantity",value:r.quantity}),null!==r.rate&&void 0!==r.rate&&i.setCurrentSublistValue({sublistId:"item",fieldId:"rate",value:r.rate}),"3"===l)try{i.setCurrentSublistValue({sublistId:"item",fieldId:"taxcode",value:r.taxcode})}catch(e){const t=String(r.taxcode);if(e.message.includes(`Invalid Field Value ${t}`)&&e.message.includes("taxcode")){const a={"-7":-8,"-8":-7}[t];a||s.error("Value Field Error",e.message),i.setCurrentSublistValue({sublistId:"item",fieldId:"taxcode",value:a})}}else r.taxcode&&i.setCurrentSublistValue({sublistId:"item",fieldId:"taxcode",value:r.taxcode});i.commitLine({sublistId:"item"});break}}),i.setValue({fieldId:"custbody_processing_assembly",value:!1}),function(t,i=3){let a=0;for(;a<i;)try{return t.save({enableSourcing:!1,ignoreMandatoryFields:!0})}catch(i){if("RCRD_HAS_BEEN_CHANGED"!==i.name)throw i;s.audit("Retrying Save",`Record changed, retry ${a+1}`),t=e.load({type:e.Type.SALES_ORDER,id:t.id,isDynamic:!1}),a++}throw new Error(`Failed after ${i} retries`)}(i),s.audit("2 SO Updated",`ID: ${a}, Lines Updated: ${r.length}, Updated Items:  ${JSON.stringify(r)}`)}catch(e){s.error("Reduce Error",`SO: ${a}, Msg: ${e.message}`)}},summarize:function(t){try{const t=i.getCurrentScript().getParameter({name:"custscriptcustscript_soid"});t&&e.submitFields({type:e.Type.SALES_ORDER,id:t,values:{custbody_processing_assembly:!1}})}catch(e){s.error("Summarize flag clear failed",e.name+": "+e.message)}t.mapSummary.errors&&t.mapSummary.errors.iterator().each((e,t)=>(s.error("Map Error",`Key: ${e}, Error: ${t}`),!0)),t.reduceSummary.errors&&t.reduceSummary.errors.iterator().each((e,t)=>(s.error("Reduce Error",`Key: ${e}, Error: ${t}`),!0))}}}); 
