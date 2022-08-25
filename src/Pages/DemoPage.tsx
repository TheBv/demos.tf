import * as React from 'react';
import {Link} from 'react-router-dom';
import {fuzzyTime} from '../FuzzyTime';
import {Duration} from '../Components/Duration'
import {PlayerTable} from '../Components/PlayerTable'
import {TeamBanner} from '../Components/TeamBanner'
import {ChatTable} from '../Components/ChatTable'
import {DemoProvider} from '../Providers/DemoProvider';
import {Footer} from '../Components/Footer';
import Spinner from 'react-spinner';
import {config} from '../config';
import './DemoPage.css';
import {Demo, ChatMessage} from "../Providers/DemoProvider";
import {Location} from "history";

export interface DemoPageState {
	demo: Demo;
	chat: ChatMessage[];
	showChat: boolean;
	highlightUsers: string[];
}

export interface DemoPageProps {
	provider: DemoProvider;
	match: {
		id?: string;
	},
	location: Location
}

export default class DemoPage extends React.Component<DemoPageProps, DemoPageState> {
	static page = 'demo';
	loadedChat = false;
	provider: DemoProvider;

	state: DemoPageState = {
		demo: {
			id: 0,
			name: '',
			red: '',
			blue: '',
			blueScore: 0,
			redScore: 0,
			server: '',
			playerCount: 0,
			players: [],
			duration: 0,
			map: '',
			nick: '',
			time: new Date(0),
			uploader: {
				id: 0,
				steamid: '',
				name: ''
			},
			url: ''
		},
		chat: [],
		showChat: false,
		highlightUsers: []
	};

	constructor(props) {
		super(props);
		this.loadedChat = false;
		this.provider = DemoProvider.instance;
	}

	async componentDidMount() {
		document.title = 'Loading - demos.tf';
		const demo = await this.provider.getDemo(parseInt(this.props.match.id || '0', 10));
		const hash = this.props.location.hash ? this.props.location.hash.substring(1) : '';
		document.title = demo.server + ' - demos.tf';
		this.setState({demo, highlightUsers: hash.split(';')});
	};

	toggleChat = () => {
		this.setState({
			showChat: !this.state.showChat
		});
		if (!this.loadedChat) {
			this.loadChat();
		}
	};

	async loadChat() {
		if (this.loadedChat) {
			return;
		}
		this.loadedChat = true;
		const chat = await this.provider.getChat(this.props.match.id);
		this.setState({chat});
	}

	render() {
		let chatTable;
		if (this.state.showChat) {
			chatTable = (
				<ChatTable messages={this.state.chat}/>
			);
		} else {
			chatTable = [];
		}
		const demo = this.state.demo;

		// emulate teams in 1v1 ffa
		if (demo.players.length === 2 && demo.players[0].team === '' && demo.players[1].team === '') {
			demo.players[0].team = 'red';
			demo.players[1].team = 'blue';
			demo.red = demo.players[0].name;
			demo.blue = demo.players[1].name;
		}
		if (demo.map.substring(0, 3) === 'dm_') {
			demo.redScore = 0;
			demo.blueScore = 0;
			for (const player of demo.players) {
				switch (player.team) {
					case 'red':
						demo.redScore += player.kills;
						break;
					case 'blue':
						demo.blueScore += player.kills;
						break;
				}
			}
		}
		if (this.state.demo.id !== 0) {
			return (
				<div>
					{demo.url == '' ? <p className="deleted-demo">
						This demo has been deleted and can no longer be downloaded.
					</p> : []}
					<h2>{demo.server} - {demo.red}
						&nbsp;vs&nbsp;{demo.blue}</h2>

					<h3>{demo.name}</h3>

					<p>Demo uploaded&nbsp;
						{config.showUpload ? ['by ', <Link
							to={'/uploads/' + demo.uploader.steamid}>{demo.uploader.name}
						</Link>, ' '] : []} {fuzzyTime(demo.time.getTime())}
					</p>
					<TeamBanner redScore={demo.redScore}
								blueScore={demo.blueScore}
								redName={demo.red} blueName={demo.blue}/>
					<PlayerTable players={demo.players} highlightUsers={this.state.highlightUsers}/>

					<p className="demo-info">
						<span>{demo.map}</span>
						<Duration className="time"
								  duration={demo.duration}/>
					</p>

					{chatTable}

					<p className="demo-download">
						{demo.url != '' ?
							<>
								<a className=" pure-button pure-button-primary"
								   href={demo.url} download={demo.name}>Download</a>
								<Link className="pure-button-secondary pure-button"
									  to={"/viewer/" + this.state.demo.id}>
									View
								</Link>
							</>
							: []}
						<button className="pure-button-tertiary pure-button"
								onClick={this.toggleChat}>{this.state.showChat ? 'Hide Chat' : 'Show Chat'}
						</button>
					</p>
					<Footer/>
				</div>
			);
		} else {
			return <Spinner/>
		}
	}
}
