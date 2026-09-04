/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * Author: Even Yohans
 * Email: eveniezeryohans@gmail.com
 * Purpose and Comment: Viso Final Revised Code V.1
 */
define(['N/file', 'N/record', 'N/ui/serverWidget', 'N/search'],
    (file, record, ui, search) => {
        const fid = 45477
        function onRequest(context) {
            if (context.request.method === 'GET') {
                const form = ui.createForm({
                    title: 'Image Upload'
                })

                form.clientScriptModulePath = './client.js'

                const sublist = form.addSublist({
                    id: 'item',
                    type: ui.SublistType.INLINEEDITOR,
                    label: 'Upload Lines'
                })

                sublist.addField({
                    id: 'custcol_image',
                    type: ui.FieldType.TEXT,
                    label: 'Image File ID'
                })

                sublist.addField({
                    id: 'custcol_upload_image_cb',
                    type: ui.FieldType.CHECKBOX,
                    label: 'Upload Image'
                })

                for (let i = 0; i < 5; i++) {
                    sublist.setSublistValue({
                        id: 'custcol_image',
                        line: i,
                        value: ''
                    })
                }

                context.response.writePage(form)
            }

            else {
                try {
                    const body = JSON.parse(context.request.body)
                    if (body.action === 'upload') {
                        if (!body.data || !body.name) {
                            throw new Error('Missing image data or filename')
                        }
                        const fileObj = file.create({
                            name: body.name,
                            fileType: file.Type.JPGIMAGE,
                            contents: body.data,
                            encoding: file.Encoding.BASE_64,
                            folder: fid,
                            isOnline: true
                        })
                        const fileId = fileObj.save()

                        record.create({
                            type: 'customrecord_image_tracker'
                        })
                            .setValue('name', body.name)
                            .setValue('custrecord_qi_quote', body.recordId)
                            .setValue('custrecord_qi_line', body.line)
                            .setValue('custrecord_qi_fileid', fileId)
                            .setValue('custrecord_qi_name', body.name)
                            .setValue('custrecord_qi_created', new Date())
                            .setValue('custrecord_qi_status', 'active')
                            .save()

                        context.response.write(JSON.stringify({
                            success: true,
                            fileId,
                            message: 'Image uploaded successfully'
                        }))
                    } else if (body.action === 'delete') {
                        try {
                            log.debug('DELETE REQUEST', body)
                            if (!body.fileId) {
                                throw new Error('Missing fileId')
                            }

                            const fileId = Number(body.fileId)

                            file.delete({
                                id: fileId
                            })

                            // optional: delete tracker record
                            const res = search.create({
                                type: 'customrecord_image_tracker',
                                filters: [
                                    ['custrecord_qi_fileid', 'is', fileId]
                                ],
                                columns: ['internalid']
                            }).run().getRange({ start: 0, end: 1 })

                            if (res.length) {
                                record.delete({
                                    type: 'customrecord_image_tracker',
                                    id: res[0].getValue('internalid')
                                })
                            }

                            context.response.write(JSON.stringify({
                                success: true,
                                message: `Image ${body.name} removed successfully`
                            }))
                            return
                        } catch (e) {
                            log.error('DELETE FAILED', e)
                            context.response.write(JSON.stringify({
                                success: false,
                                message: e.message
                            }))
                            return
                        }
                    }
                } catch (e) {
                    context.response.write(JSON.stringify({
                        success: false,
                        message: e.message || e
                    }))
                }
            }
        }
        return { onRequest }
    })
