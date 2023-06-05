import { debug, error } from 'lib/log';
import { showHelpAndExit } from 'lib/log';

$.verbose = false;

const paths = argv._;

if (!paths.length) {
	showHelpAndExit(
		'Wrapper around the Home Assistant REST API',
		'',
		'ha ...paths [-x "{body}"]',
		'Flags:',
		'--body|-x: JSON body, converts to POST',
	);
}

const server = process.env.HASS_SERVER;
const token = process.env.HASS_TOKEN;
if (!server || !token) {
	error('Make sure HASS_SERVER and HASS_TOKEN env vars are set');
}

const body: string | undefined = argv.x || argv.body;
try {
	if (body) {
		debug('Parsing', body);
		JSON.parse(body); // Try to parse the body to make sure it's valid
	}
} catch (err: unknown) {
	error(new Error('Could not parse body', { cause: err }));
}
try {
	const url = new URL(`/api/${paths.join('/')}`, server);
	debug('Calling', body ? 'POST' : 'GET', url, body);
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		method: body ? 'POST' : 'GET',
		body,
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Got response ${message}`);
	}
	echo(JSON.stringify(await response.json(), null, '\t'));
} catch (err: unknown) {
	error(err);
}
