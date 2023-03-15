import 'zx/globals';
import path from 'node:path';
import { bold, error, showHelpAndExit } from 'lib/log';

let [image] = argv._.slice(0);
let images: string[] = [];
const composePath = path.resolve(__dirname, 'docker-compose.yml');
try {
	/** @type string */
	const composeFile = fs.readFileSync(composePath, 'utf-8');
	if (!composeFile) {
		throw new Error();
	}
	interface ComposeFile {
		services: Record<string, any>;
	}
	const compose: ComposeFile = YAML.parse(composeFile);
	images = Object.keys(compose.services);
} catch (err) {
	error(`Could not find Compose file at ${composePath}? 😕`);
}

if (!images.includes(image) && image !== 'all') {
	showHelpAndExit(
		'Images available:',
		images.map((image) => ` - ${image}`),
	);
}

if (image === 'all') {
	image = '';
}

await $`docker context use default`.quiet();

bold(`Building image ${image}... 🔨`);
await $`docker compose -f ${composePath} build ${image}`;

const push = argv.push === 'true';
if (!push) {
	bold("That's all, folks! 👋");
	process.exit();
}

bold('Pushing to Docker Hub... ⬆🌥');
await $`docker compose -f ${composePath} push ${image}`;

bold('💥🎤💧');
