import {parseDemo} from "@demostf/parser";
import * as foo from "@demostf/parser";

// @ts-ignore
self.document = self;

declare function postMessage(message: any, transfer?: any[]): void;

/**
 * @global postMessage
 * @param event
 */
onmessage = (event: MessageEvent) => {
	const buffer: ArrayBuffer = event.data.buffer;
	const bytes = new Uint8Array(buffer);
	let parsed = parseDemo(bytes).then(parser => {
		console.log(parsed);
		postMessage({
			demo: parsed
		}, [parsed.data.buffer]);
	}).catch(e => {
		console.error(e);
		postMessage({
			error: e.message
		});
	});

};
