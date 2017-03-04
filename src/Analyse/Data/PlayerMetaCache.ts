import {SparseDataCache} from "./SparseDataCache";

export interface PlayerMeta {
	classId: number;
	teamId: number;
}

export class PlayerMetaCache extends SparseDataCache {
	constructor(tickCount: number) {
		super(tickCount, 1, 8, 6);
	}

	getMeta(playerId: number, tick: number): PlayerMeta {
		const data = super.get(playerId, tick);
		return {
			classId: data & 0x0F,
			teamId: (data & 0xF0) >> 4
		};
	}

	setMeta(playerId: number, tick: number, meta: PlayerMeta) {
		super.set(playerId, tick, meta.classId | (meta.teamId << 4));
	}
}
