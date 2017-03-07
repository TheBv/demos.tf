export type DataArray = Uint32Array | Uint8Array | Uint16Array;

export class DataCache {
	data: DataArray[] = [];
	bitWidth: number;
	tickCount: number;
	valuesPerPlayer: number;

	constructor(tickCount: number, valuesPerPlayer: number, bitWidth: number) {
		this.tickCount = tickCount;
		this.valuesPerPlayer = valuesPerPlayer;
		this.bitWidth = bitWidth;
	}

	protected makeArray(): DataArray {
		switch (this.bitWidth) {
			case 8:
				return new Uint16Array(this.length);
			case 16:
				return new Uint16Array(this.length);
			case 32:
				return new Uint32Array(this.length);
			default:
				throw new Error('invalid bit width for cache');
		}
	}

	protected getPlayerData(playerId: number) {
		if (!this.data[playerId]) {
			this.data[playerId] = this.makeArray();
		}
		return this.data[playerId];
	}

	get length() {
		return this.valuesPerPlayer * this.tickCount;
	}

	protected getOffset(tick: number, offset: number) {
		return tick * this.valuesPerPlayer + offset;
	}

	get(playerId: number, tick: number, offset: number = 0): number {
		const data = this.getPlayerData(playerId);
		return data[this.getOffset(tick, offset)];
	}

	set(playerId: number, tick: number, value: number, offset: number = 0) {
		const data = this.getPlayerData(playerId);
		data[this.getOffset(tick, offset)] = value;
	}

	static rehydrate(data: DataCache) {
		Object.setPrototypeOf(data, DataCache.prototype);
	}
}
