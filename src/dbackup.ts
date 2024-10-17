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

const destFileName = `${directory || process.cwd()}/${details.Name}.tar.gz`;

const node = details.Node;
const targetPath = '/backup/tmp.tar.gz';
const tmpDir = `/tmp/${details.Name}`;
await $`ssh ${node} mkdir -p ${tmpDir}`;
await $`docker run --rm --volumes-from=${details.Name}.${details.ID} -v ${tmpDir}:/backup ubuntu tar cvzf ${targetPath} ${path}`;
await $`rsync -zvhP ${node}:${tmpDir}/tmp.tar.gz ${destFileName}`;
await $`ssh ${node} rm -rf ${tmpDir}`;
echo(chalk.greenBright.bold(`Saved to ${destFileName} 🎉`));
