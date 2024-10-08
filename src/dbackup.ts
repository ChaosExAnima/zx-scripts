import { getServiceEnv } from 'lib/docker';
import { error, line, showHelpAndExit } from 'lib/log';
import { createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Transform } from 'node:stream';

if (argv._.length > 2 || argv._.length < 1) {
	showHelpAndExit('Required args: [service]:[path] <directory>');
}

const [target, directory] = argv._;
const [service, path] = target.split(':');

if (directory) {
	const statDir = await stat(directory);
	if (!statDir.isDirectory()) {
		error(`"${directory}" is not a directory`);
	}
}

const details = await getServiceEnv(service);

const destFileName = `${directory || process.cwd()}/${details.Name}.tar`;
const destStream = createWriteStream(destFileName);

let size = 0;
const progressStream = new Transform({
	transform(chunk, _encoding, callback) {
		if (chunk instanceof Buffer) {
			size += chunk.byteLength;
		} else if (typeof chunk === 'string') {
			size += chunk.length;
		}
		console.log(`\x1b[FTransferred: ${size.toLocaleString()} bytes`);
		callback(null, chunk);
	},
});
progressStream.pipe(destStream);

echo('Transferred: 0 bytes');
await $`docker run --rm --volumes-from=${details.Name}.${details.ID} ubuntu tar cvf - ${path}`
	.quiet()
	.pipe(progressStream);
echo(chalk.greenBright.bold(`Saved to ${destFileName} 🎉`));
