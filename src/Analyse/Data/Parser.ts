import {
	Demo, Header, Packet, Player, UserInfo,
	Match
} from 'tf2-demo/build/es6';
import {PositionCache, Point} from './PositionCache';
import {getMapBoundaries} from "../MapBoundries";
import {HealthCache} from "./HealthCache";
import {PlayerMetaCache} from "./PlayerMetaCache";
import {ViewAngleCache} from "./ViewAngleCache";
import {LifeState} from "tf2-demo/build/es6/Data/Player";
import {Death} from "tf2-demo/build/es6/Data/Death";
import {killAlias} from "../Render/killAlias";

export class CachedPlayer {
	position: Point;
	user: UserInfo;
	health: number;
	teamId: number;
	classId: number;
	team: string;
	viewAngle: number;
}

export interface CachedDeath {
	tick: number;
	victim: Player;
	assister: Player|null;
	killer: Player|null;
	weapon: string;
	victimTeam: number;
	assisterTeam: number;
	killerTeam: number;
}

export class Parser {
	demo: Demo;
	header: Header;
	positionCache: PositionCache;
	healthCache: HealthCache;
	metaCache: PlayerMetaCache;
	viewAngleCache: ViewAngleCache;
	entityPlayerReverseMap: {[entityId: string]: number} = {};
	nextMappedPlayer = 0;
	entityPlayerMap: {[playerId: string]: Player} = {};
	ticks: number;
	match: Match;
	startTick = 0;
	deaths: {[tick: string]: CachedDeath[]} = {};

	constructor(demo: Demo, head: Header) {
		this.demo = demo;
		this.header = head;
		const parser = this.demo.getParser();
		this.match = parser.match;
		while (this.match.world.boundaryMin.x === 0) {
			parser.tick();
		}
		const boundaryOverWrite = getMapBoundaries(this.header.map);
		if (boundaryOverWrite) {
			this.match.world.boundaryMax.x = boundaryOverWrite.boundaryMax.x;
			this.match.world.boundaryMax.y = boundaryOverWrite.boundaryMax.y;
			this.match.world.boundaryMin.x = boundaryOverWrite.boundaryMin.x;
			this.match.world.boundaryMax.y = boundaryOverWrite.boundaryMax.y;
		} else {
			throw new Error(`Map not supported "${this.header.map}".`);
		}

		// skip to >1sec after the first player joined
		while (this.match.players.length < 1) {
			parser.tick();
		}
		for (let i = 0; i < 100; i++) {
			parser.tick();
		}
		this.startTick = this.match.tick;
		this.ticks = Math.ceil((head.ticks) / 2); // scale down to 30fps
		this.positionCache = new PositionCache(this.ticks, this.match.world.boundaryMin);
		this.healthCache = new HealthCache(this.ticks);
		this.metaCache = new PlayerMetaCache(this.ticks);
		this.viewAngleCache = new ViewAngleCache(this.ticks);
	}

	scaleTick(matchTick: number): number {
		return Math.ceil((matchTick - this.startTick) / 2);
	}

	setTick(tick: number, players: Player[]) {
		for (const player of players) {
			const playerId = this.getPlayerId(player);
			this.positionCache.setPosition(playerId, tick, player.position);
			this.healthCache.set(playerId, tick, player.lifeState === LifeState.ALIVE ? player.health : 0);
			this.metaCache.setMeta(playerId, tick, {
				classId: player.classId,
				teamId: player.team
			});
			this.viewAngleCache.set(playerId, tick, player.viewAngle);
		}
	}

	cacheData() {
		let lastTick = 0;
		const demoParser = this.demo.getParser();
		const match = demoParser.match;
		let index = 0;
		demoParser.on('packet', (packet: Packet) => {
			const tick = Math.floor((match.tick - this.startTick) / 2);
			if (tick > lastTick) {
				this.setTick(tick, match.players);
				if (tick > lastTick + 1) {
					// demo skipped ticks, copy/interpolote
					for (let i = lastTick; i < tick; i++) {
						this.setTick(i, match.players);
					}
				}
				lastTick = tick;
			}
		});
		demoParser.parseBody();
		for (const death of match.deaths) {
			const deathTick = this.scaleTick(death.tick);
			if (!this.deaths[deathTick]) {
				this.deaths[deathTick] = [];
			}
			let killer: Player|null;
			try {
				killer = match.getPlayerByUserId(death.killer);
			} catch (e) {
				killer = null;
			}
			let victim: Player|null = null;
			let assister: Player|null = null;
			try {
				victim = match.getPlayerByUserId(death.victim);
			} catch (e) {
				continue;
			}
			try {
				assister = death.assister ? match.getPlayerByUserId(death.assister) : null;
			} catch (e) {

			}

			const killerId = killer ? this.entityPlayerReverseMap[killer.user.entityId] : null;
			const assisterId = assister ? this.entityPlayerReverseMap[assister.user.entityId] : null;
			const victimId = this.entityPlayerReverseMap[victim.user.entityId];

			try {
				const alias = killAlias[death.weapon] ? killAlias[death.weapon] : death.weapon;
				require(`../../images/kill_icons/${alias}.png`) as string;
			} catch (e) {
				console.log(death.weapon, killer && killer.classId);
			}

			this.deaths[deathTick].push({
				tick: deathTick,
				victim: victim,
				killer: killer,
				assister: assister,
				weapon: death.weapon,
				victimTeam: this.metaCache.getMeta(victimId, deathTick).teamId,
				assisterTeam: (assisterId) ? this.metaCache.getMeta(assisterId, deathTick).teamId : 0,
				killerTeam: (killerId) ? this.metaCache.getMeta(killerId, deathTick).teamId : 0
			});
		}
	}

	private getPlayerId(player: Player) {
		if (!this.entityPlayerReverseMap[player.user.entityId]) {
			this.entityPlayerMap[this.nextMappedPlayer] = player;
			this.entityPlayerReverseMap[player.user.entityId] = this.nextMappedPlayer;
			this.nextMappedPlayer++;
		}
		return this.entityPlayerReverseMap[player.user.entityId];
	}

	getPlayersAtTick(tick: number) {
		const players: CachedPlayer[] = [];
		for (let i = 0; i < this.nextMappedPlayer; i++) {
			const meta = this.metaCache.getMeta(i, tick);
			const team = (meta.teamId === 2) ? 'red' : (meta.teamId === 3 ? 'blue' : '');
			players.push({
				position: this.positionCache.getPosition(i, tick),
				user: this.entityPlayerMap[i].user,
				health: this.healthCache.get(i, tick),
				teamId: meta.teamId,
				classId: meta.classId,
				team,
				viewAngle: this.viewAngleCache.get(i, tick)
			});
		}
		return players;
	}
}
