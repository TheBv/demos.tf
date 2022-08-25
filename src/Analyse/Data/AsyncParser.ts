import {ParsedDemo, PlayerState, WorldBoundaries, Header, Kill} from "@demostf/parser-worker";
import {getMapBoundaries} from "../MapBoundries";

export class AsyncParser {
	buffer: ArrayBuffer;
	demo: ParsedDemo;
	world: WorldBoundaries;
	progressCallback: (progress: number) => void;

	constructor(buffer: ArrayBuffer, progressCallback: (progress: number) => void) {
		this.buffer = buffer;
		this.progressCallback = progressCallback;
	}

	cache(): Promise<ParsedDemo> {
		return new Promise((resolve, reject) => {
			const worker = new Worker(new URL('./ParseWorker.ts', import.meta.url));
			worker.postMessage({
				buffer: this.buffer
			}, [this.buffer]);
			worker.onmessage = (event) => {
				if (event.data.error) {
					reject(event.data.error);
					return;
				} else if (event.data.progress) {
					console.log(event.data.progress);
					this.progressCallback(event.data.progress);
					return;
				} else if (event.data.demo) {
					const cachedData: ParsedDemo = event.data.demo;
					console.log(cachedData.data.length);
					this.world = cachedData.world;
					this.demo = new ParsedDemo(cachedData.playerCount, cachedData.buildingCount, cachedData.world, cachedData.header, cachedData.data, cachedData.kills, cachedData.playerInfo);
					resolve(this.demo);
				}
			}
		});
	}

	getPlayersAtTick(tick: number): PlayerState[] {
		const players: PlayerState[] = [];
		for (let i = 0; i < this.demo.playerCount; i++) {
			players.push(this.demo.getPlayer(tick, i));
		}

		return players;
	}

	getKills(): Kill[] {
		return this.demo.kills
	}
}
