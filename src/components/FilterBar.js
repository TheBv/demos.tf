import React, {Component} from 'react';
import Select from 'react-select';
import {PlayerProvider} from '../Providers/PlayerProvider.js'

require('./FilterBar.css');
require('react-select/dist/react-select.css');

export class FilterBar extends Component {
	selectedUsers = [];

	constructor () {
		super();
		this.playerProvider = new PlayerProvider();
	}

	getMaps = async () => {
		var maps = await this.props.provider.listMaps();
		return {
			options: maps.map(map=> {
				return {value: map, label: map};
			}),
			complete: true
		};
	};

	setFilter = (type, value) => {
		if (type === 'players[]') {
			this.selectedUsers = value;
		}
		if (value && value.value) {
			value = value.value;
		}
		if (value && value.map) {
			value = value.map(player=>player.value);
		}
		this.props.provider.setFilter(type, value);
		if (this.props.onChange) {
			this.props.onChange();
		}
	};

	searchUsers = (query) => {
		return this.playerProvider.search(query)
			.then(users => users.map(user => {
				return {
					value: user.steamid,
					label: user.name
				}
			}))
			.then(users => {
				const selectedUsers = this.props.filter['players[]'].map(steamId => {
					return {
						value: steamId,
						label: PlayerProvider.nameMap[steamId]
					};
				});
				return {
					options: users.concat(selectedUsers),
					complete: false
				};
			});
	};

	render () {
		var typeOptions = [
			{value: '4v4', label: '4v4'},
			{value: '6v6', label: '6v6'},
			{value: 'hl', label: 'Highlander'}
		];

		var nameOptions = [];
		for (var steamid in PlayerProvider.nameMap) {
			if (PlayerProvider.nameMap.hasOwnProperty(steamid)) {
				nameOptions.push({
					value: steamid,
					label: PlayerProvider.nameMap[steamid]
				})
			}
		}

		return (
			<div className="filterbar">
				<Select
					className="type"
					value={this.props.filter.type}
					placeholder="All Types"
					options={typeOptions}
					onChange={value=>this.setFilter('type', value)}
				/>
				<Select.Async
					className="map"
					value={this.props.filter.map}
					placeholder="All Maps"
					loadOptions={this.getMaps}
					onChange={value=>this.setFilter('map', value)}
				/>
				<Select.Async
					className="players"
					multi={true}
					value={this.props.filter['players[]']}
					placeholder="All Players"
					loadOptions={this.searchUsers}
					onChange={value=>this.setFilter('players[]', value)}
					minimumInput={2}
					cache={false}
				/>
			</div>
		);
	}

}
