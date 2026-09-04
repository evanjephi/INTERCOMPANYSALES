/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * Author: Even Yohans
 * Email: eveniezeryohans@gmail.com
 * Purpose and Comment: Viso Final Revised Code V.1
 */

define(['N/url', 'N/currentRecord'], (urlMod, currentRecord) => {
    
    let imagesToDelete = []

    async function fieldChanged(context) {
        if (context.sublistId !== 'item') return
        if (context.fieldId !== 'custcol_upload_image_cb') return

        const rec = currentRecord.get()
        const line = context.line

        const isUpload = rec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_upload_image_cb'
        })

        const existingFileId = rec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_image'
        })

        if (isUpload) {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'

            // rechecks, removes from deletion queue
            if (existingFileId) {
                imagesToDelete = imagesToDelete.filter(id => id !== existingFileId)
            }

            input.onchange = async () => {
                //first file from the array
                const file = input.files[0]
                if (!file) return

                const unique = Date.now()
                const randomize = Math.floor(Math.random() * 1000)
                const tranid = rec.getValue({ fieldId: 'tranid' })
                const recordId = rec.id
                const recordType = rec.type
                const isRealTranId = tranid && tranid !== 'To Be Generated'
                
                let fileName
                if (recordId && isRealTranId) fileName = `${tranid}-${line + 1}.jpg`
                else fileName = `${recordType}_D${unique}_R${randomize}_L${line + 1}.jpg`

                const compressed = await compressImage(file);
                const url = urlMod.resolveScript({
                    scriptId: 'customscript_ey_receive_save_sl',
                    deploymentId: 'customdeploy_ey_receive_save_sl'
                })

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'upload',
                        name: fileName,
                        data: compressed.base64, 
                        line,
                        recordId: rec.id
                    })
                })

                const result = await response.json();
                if (result.success) {
                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_image',
                        value: result.fileId
                    })
                }
                alert(result.message)
            }
            input.click()
        } 
        
        else {
            if (!existingFileId) return;

            if (!imagesToDelete.includes(existingFileId)) {
                imagesToDelete.push(existingFileId);
            }

            rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_image',
                value: ''
            })
        }
    }

    async function saveRecord(context) {
        if (imagesToDelete.length === 0) return true
        try {
            const url = urlMod.resolveScript({
                scriptId: 'customscript_ey_receive_save_sl',
                deploymentId: 'customdeploy_ey_receive_save_sl'
            })

            for (const fileId of imagesToDelete) {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', fileId: fileId })
                })
            }
            return true
        } catch (e) {
            return true
        }
    }

    function compressImage(file, maxWidth = 1000, quality = 0.9) {
        return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = e => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const scale = Math.min(maxWidth / img.width, 1)
                    canvas.width = img.width * scale
                    canvas.height = img.height * scale
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1]
                    resolve({ base64 })
                };
                img.src = e.target.result
            };
            reader.readAsDataURL(file)
        })
    }

    return { fieldChanged, saveRecord }
});
