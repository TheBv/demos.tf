import * as React from 'react';
import {Parser} from "../Data/Parser";

export interface TimelineProps {
	parser: AsyncParser;
	tick: number;
	onSetTick: (tick: number) => any;
	disabled?: boolean;
}

export class Timeline extends React.Component<TimelineProps, {}> {
	background: Element;

	render() {
		const {parser, tick, onSetTick}= this.props;
		if (!this.background) {
			this.background =<TimeLineBackground parser={parser}/>;
		}
		return (<div className="timeline">
			{this.background}
			<input className="timeline-progress" type="range" min={0}
			       max={parser.ticks} value={tick}
			       disabled={this.props.disabled}
			       onChange={(event) => {onSetTick(parseInt(event.target.value, 10))}}
			/>
		</div>);
	}
}

import './Timeline.css';
import Element = JSX.Element;
import {AsyncParser} from "../Data/AsyncParser";

function TimeLineBackground({parser}:{parser: AsyncParser}) {
	const length = Math.floor(parser.ticks / 30);
	const blueHealth = new Uint16Array(length);
	const redHealth = new Uint16Array(length);
	let index = 0;
	let maxHealth = 0;
	for (let tick = 0; tick < parser.ticks; tick += 30) {
		index++;
		const players = parser.getPlayersAtTick(tick);
		for (const player of players) {
			if (player.teamId === 2) {
				redHealth[index] += player.health;
			} else if (player.teamId === 3) {
				blueHealth[index] += player.health;
			}
		}
		if (blueHealth[index] > 0 && redHealth[index] > 0) {
			maxHealth = Math.max(maxHealth, blueHealth[index], redHealth[index]);
		}
	}

	let darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	let redStroke = darkMode ? '#ff756bff' : '#ff000088';
	let blueStroke = darkMode ? '#7378ffff' : '#0000ff88';

	const redHealthPath = redHealth.reduce(pathReducer, 'M 0 0');
	const blueHealthPath = blueHealth.reduce(pathReducer, 'M 0 0');

	return (
		<svg className="timeline-background"
		     viewBox={`0 0 ${length} ${maxHealth}`}
		     preserveAspectRatio="none">
			<path d={redHealthPath} stroke={redStroke} strokeWidth={2}
			      fill="transparent"
			      vectorEffect="non-scaling-stroke"/>
			<path d={blueHealthPath} stroke={blueStroke} strokeWidth={2}
			      fill="transparent"
			      vectorEffect="non-scaling-stroke"/>
		</svg>);
}

function pathReducer(path, y, x) {
	return `${path} L ${x} ${y}`
}
