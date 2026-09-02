/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/https', 'N/record'], function (currentRecord, url, https, record) {

    function pageInit(context) { }

    function runSkidEstimation() {
        const rec = currentRecord.get();
        const salesOrderId = rec.id;
        const type = rec.type

        const button = document.getElementById('custpage_estimate_skid');
        if (button) {
            button.value = 'Estimating...';
            button.setAttribute('readonly', true);
            button.style.pointerEvents = 'none';
            button.style.cursor = 'wait';
            button.style.opacity = '0.6';
        }

        const sl = url.resolveScript({
            scriptId: 'customscript_estimate_pallet_needed',
            deploymentId: 'customdeploy_estimate_pallet_needed',
            params: { soid: salesOrderId, type: type}
        });

        https.get.promise({ url: sl }).then(response => {
            location.reload();
        }).catch(error => {
            alert('Error estimating skid: ' + error.message);
            if (button) {
                button.value = 'Estimate Skid';
                button.removeAttribute('readonly');
                button.style.pointerEvents = 'auto';
                button.style.cursor = 'pointer';
                button.style.opacity = '1';
            }
        });
    }
    function prodRelease() {
        const rec = currentRecord.get();
        record.submitFields({
                type: rec.type,
                id: rec.id,
                values: {
                    'custbodyrelease_to_production': true
                },
                options: {
                    enforceTriggeringAndValidation: false 
                }
            });
        alert('Order is now released to production')
    }

    function crossSubOrders() {
        const rec = currentRecord.get();
        const salesOrderId = rec.id;
        const type = rec.type

        if (!salesOrderId) return
        

        const button = document.getElementById('custpage_ic_orders');
        if (button) {
            button.value = 'Processing...';
            button.setAttribute('readonly', true);
            button.style.pointerEvents = 'none';
            button.style.cursor = 'wait';
            button.style.opacity = '0.6';
        }

        const sl = url.resolveScript({
            scriptId: 'customscript_ic_trade_sl',
            deploymentId: 'customdeploy_ic_trade_sl',
            params: { soid: salesOrderId, type: type }
        });

        https.get.promise({ url: sl }).then(response => {
            const result = response.body;
            if (result && result.startsWith('Error:')) {
                alert('Failed to create intercompany orders: ' + result);
            } else {
                location.reload();
            }
        }).catch(error => {
            alert('Error creating intercompany orders: ' + error.message);
        }).finally(() => {
            if (button) {
                button.value = 'Generate ICO';
                button.removeAttribute('readonly');
                button.style.pointerEvents = 'auto';
                button.style.cursor = 'pointer';
                button.style.opacity = '1';
            }
        });
    }

    return {
        pageInit,
        runSkidEstimation,
        prodRelease,
        crossSubOrders
    };
});


/*

define(['N/currentRecord', 'N/url', 'N/https'], function (currentRecord, url, https) {

    function pageInit(context) {
    }

    function runSkidEstimation() {
        const rec = currentRecord.get();
        const salesOrderId = rec.id;

        const loader = document.createElement('div');
        loader.id = 'skid-loader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
kground: white; padding: 20px 40px; font-size: 16px; font-weight: bold; border-radius: 8px;">Estimating skid size, please wait...</div>';
        document.body.appendChild(loader);


            const result = response.body;
            if (result && result.startsWith('Error:')) {
                alert('Skid estimation failed: ' + result);
            } else {
                alert('Skid estimation complete:\n\n' + result);
                location.reload();
            }
        }).catch(error => {
            document.body.removeChild(loader);
            alert('Error estimating skid: ' + error.message);
        });
    }

    return {
        pageInit: pageInit,
        runSkidEstimation: runSkidEstimation
    };
});

CS Current -------------------------------------

define(['N/currentRecord', 'N/url', 'N/https', 'N/record'], function (currentRecord, url, https, record) {

    function pageInit(context) { }

    function runSkidEstimation() {
        const rec = currentRecord.get();
        const salesOrderId = rec.id;
        const type = rec.type

        const button = document.getElementById('custpage_estimate_skid');
        if (button) {
            button.value = 'Estimating...';
            button.setAttribute('readonly', true);
            button.style.pointerEvents = 'none';
            button.style.cursor = 'wait';
            button.style.opacity = '0.6';
        }

        const sl = url.resolveScript({
            scriptId: 'customscript_estimate_pallet_needed',
            deploymentId: 'customdeploy_estimate_pallet_needed',
            params: { soid: salesOrderId, type: type}
        });

        https.get.promise({ url: sl }).then(response => {
            //alert('Skid estimation complete.');
            location.reload();
        }).catch(error => {
            alert('Error estimating skid: ' + error.message);
            if (button) {
                button.value = 'Estimate Skid';
                button.removeAttribute('readonly');
                button.style.pointerEvents = 'auto';
                button.style.cursor = 'pointer';
                button.style.opacity = '1';
            }
        });
    }
    function prodRelease() {
        const rec = currentRecord.get();
        record.submitFields({
                type: rec.type,
                id: rec.id,
                values: {
                    'custbodyrelease_to_production': true
                },
                options: {
                    enforceTriggeringAndValidation: false 
                }
            });
        alert('Order is now released to production')
    }
    return {
        pageInit,
        runSkidEstimation,
        prodRelease
    };
});

----------------commented------------------------
define(['N/currentRecord', 'N/url', 'N/https'], function (currentRecord, url, https) {

    function pageInit(context) {
    }

    function runSkidEstimation() {
        const rec = currentRecord.get();
        const salesOrderId = rec.id;

        const loader = document.createElement('div');
        loader.id = 'skid-loader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
kground: white; padding: 20px 40px; font-size: 16px; font-weight: bold; border-radius: 8px;">Estimating skid size, please wait...</div>';
        document.body.appendChild(loader);


            const result = response.body;
            if (result && result.startsWith('Error:')) {
                alert('Skid estimation failed: ' + result);
            } else {
                alert('Skid estimation complete:\n\n' + result);
                location.reload();
            }
        }).catch(error => {
            document.body.removeChild(loader);
            alert('Error estimating skid: ' + error.message);
        });
    }

    return {
        pageInit: pageInit,
        runSkidEstimation: runSkidEstimation
    };
});

*/
