import * as React from 'react';

import {Link} from 'react-router-dom';
import {Section} from '../Components/Section';
import {PluginSection} from '../Components/PluginSection';

import './AboutPage.css';
import {Stats, DemoListProvider} from "../Providers/DemoProvider";
import {AuthProvider, User} from "../Providers/AuthProvider";
import {config} from '../config';

export interface AboutPageState {
	stats: Stats;
}

export interface AboutPageProps {
	demoListProvider: DemoListProvider;
	user: User | null;
}

export default class AboutPage extends React.Component<AboutPageProps, AboutPageState> {
	static page = 'about';
	demoProvider: DemoListProvider = DemoListProvider.instance;

	state: AboutPageState = {
		stats: {
			demos: 0,
			players: 0
		}
	};

	async componentDidMount() {
		document.title = "About - demos.tf";
		const stats = await this.demoProvider.getStats();
		this.setState({stats});
	};

	render() {
		const user = AuthProvider.instance.user;

		return (
			<div>
				<Section title="About">
					<p>
						{config.title} is a hosting platform for Team Fortress 2
						demo files and automatic stv demo uploader.
					</p>
				</Section>
				<Section title="Contact">
					<p>
						Contact us using any of the following methods for
						feedback or questions.
					</p>

					<p>
						<a href="https://steamcommunity.com/id/icewind1991">
							Steam
						</a>&nbsp;
						<a href="mailto:icewind@demos.tf">
							Email
						</a>&nbsp;
						<a href="https://twitter.com/icewind1991">
							Twitter
						</a>&nbsp;
						<a href="https://github.com/demostf/demos.tf">
							Github
						</a>
					</p>
				</Section>
				<PluginSection user={user}/>
				<Section title="Reporting issues">
					<p>
						Any issue, bug or suggestion can be reported over on&nbsp;
						<a href="https://github.com/demostf/demos.tf/issues">
							Github
						</a>.
					</p>
				</Section>
				<Section title="API">
					<p>
						The demos.tf data is available to 3rd parties using
						a REST api.
					</p>

					<p>
						See the <Link to='/api'>API Documentation</Link> for
						details.
					</p>
				</Section>
				{config.showDonate ?
					<Section title="Donate">
						<p>
							Storing demos isn't free, you can help paying the server costs by donating using PayPal.
						</p>
						<form action="https://www.paypal.com/cgi-bin/webscr"
							  method="post" target="_top">
							<input type="hidden" name="cmd"
								   value="_s-xclick"/>
							<input type="hidden" name="encrypted"
								   value="-----BEGIN PKCS7-----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-----END PKCS7-----"/>
							<input type="image"
								   src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif"
								   name="submit"
								   alt="PayPal - The safer, easier way to pay online!"/>
						</form>
					</Section>
					: []}
				<Section title="Statistics">
					<p>{this.state.stats.demos} Demos</p>

					<p>{this.state.stats.players} Players</p>
				</Section>
			</div>
		);
	}
}
