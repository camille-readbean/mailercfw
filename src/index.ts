import {config, ApiKeyConfig, MailRequest, error404Page, errorPageTag, toEmail} from './config'
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

const handler: ExportedHandler = {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);
			if (url.pathname.slice(0,11) != '/mailercfw/') {
				return new Response(error404Page, 
					{status: 404, headers: {"content-type" : "text/html"}});
			}

			// Check request came from a valid user
			const requester = url.pathname.slice(11, 27);
			if (!(requester in config)) {
				return new Response(error404Page, 
					{status: 404, headers: {"content-type" : "text/html"}})
			}

			// must be a POST request with json
			if (request.method != "POST" || 
				request.headers.get("content-type") != "application/json") {
				return new Response(errorPageTag("405 Not Allowed"), 
					{status: 405, headers: {"content-type" : "text/html"}})
			}

			const mailRequest:MailRequest = await request.json();
			// console.log(mailRequest.apiKey);
			// console.log(mailRequest.message);
			// console.log(mailRequest.toAddr);
			// authenticate the api user
			// yes the api key is hard coded in a config.ts...
			// just serverless things, its a toy project anyway
			// TODO: move towards public key cryptography using webCrypto
			// don't use this in production
			const apiConfig: ApiKeyConfig = config[requester];
			if (mailRequest.apiKey != apiConfig.apiKey) {
				return new Response(errorPageTag("401 Authorization Required"), 
					{status: 401, headers: {"content-type" : "text/html"}})
			}
			if (mailRequest.message == undefined || mailRequest.toAddr == undefined) {
				return new Response(
					"400 Bad Request\n" + 
						`${mailRequest.message == undefined ? "No message\n" : ""}` +
						`${mailRequest.toAddr == undefined ? "No toAddr\n" : ""}`, 
					{status: 400})
			}

			// validate all emails
			const emailDomainCheck = ((addr: toEmail) => 
				apiConfig.allowedToDomain.includes(addr.email.split('@').slice(-1)[0]))
			// mailRequest.toAddr.map((r) => r.email).forEach(console.log);
			// console.log(`\n${mailRequest.toAddr.map((r) => r.name)[0]}\n`)
			if (!mailRequest.toAddr.every(emailDomainCheck)) {
				return new Response(
					"400 Bad Request\n Invalid destination email domains: " + 
					`${mailRequest.toAddr.filter(e => !emailDomainCheck(e)).map(e => e.email)}\n`, 
					{status: 400}
				)
			}

			// send!
			const emailPOST = new Request("https://api.mailchannels.net/tx/v1/send", {
				"method": "POST",
				"headers": {
					"content-type": "application/json",
				},
				"body": JSON.stringify({
					"personalizations": [
						// take note that multiple to address allows
						// recipients to see each other
						{ "to": mailRequest.toAddr}
					],
					"from": {
						"email": apiConfig.allowedFromAddr,
						"name": apiConfig.allowedFromName,
					},
					"subject": mailRequest.message.subject,
					"content": mailRequest.message.content,
				}),
			});
			const resp = await fetch(emailPOST);
			const respText = await resp.text();
			return new Response(
				`\n${resp.status} ${resp.statusText}\n${respText}`, 
				{status: resp.status}
			)
		} catch (error) {
			return new Response(
				`500 \n${error}`, 
				{status: 500}
			)
		}
	},
};

export default handler;