// plugin.ts

import axios from 'axios';
import process from 'process';
import webito, { paymentsCreate_input, paymentsCreate_output, paymentsVerify_input } from 'webito-plugin-sdk'

const starter = new webito.WebitoPlugin('starter');

starter.registerHook(
    webito.hooks.paymentsCreate,
    async ({ vars, data }: { vars: { merchant: string }, data: paymentsCreate_input }) => {
        const inputdata = {
            "merchant_id": vars.merchant,
            "amount": data.amount * 10,
            "callback_url": data.callback,
            "description": data.payment,
        }
        const create = await axios.post('https://payment.zarinpal.com/pg/v4/payment/request.json', inputdata)
        if (create.data.code == 100) {
            return {
                status: true,
                data: {
                    ...(create.data || {}),
                    url: 'https://payment.zarinpal.com/pg/StartPay/' + create.data.authority
                }
            }
        } else {
            return {
                status: false,
            }
        }
    });

starter.registerHook(
    webito.hooks.paymentsVerify,
    async ({ vars, data }: { vars: { merchant: string }, data: paymentsVerify_input }) => {
        const inputdata = {
            "merchant_id": vars.merchant,
            "authority": data.payment.transaction.authority,
            "amount": data.payment.amount * 10,
        }
        const verify = await axios.post('https://payment.zarinpal.com/pg/v4/payment/verify.json', inputdata)

        if ((verify.data.code == 100) || (verify.data.code == 101)) {
            return {
                status: true,
            }
        } else {
            return {
                status: false,
            }
        }
    });

const runPlugin = async (inputData: { hook: string; data: any }) => {
    const result = await starter.executeHook(inputData.hook, inputData.data);
    return result;
};


process.stdin.on('data', async (input) => {
    const msg = JSON.parse(input.toString());
    const result: any = await runPlugin(msg);
    starter.response({ status: result?.status, data: result?.data })
});