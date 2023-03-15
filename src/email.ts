import 'zx/globals';
import { createHash } from 'node:crypto';

const email = argv._[0];

if (!email) {
	echo('Generates a secure email: domain [-c] (copy to clipboard)');
	process.exit(1);
}

const domain = argv.domain ?? process.env.EMAIL_DOMAIN;
if (!domain) {
	echo('EMAIL_DOMAIN env var not set');
	process.exit(1);
}
let secret;
try {
	secret = await fs.readFile(path.resolve(os.homedir(), '.email'));
} catch (err) {
	echo('Could not get secret');
	process.exit(1);
}

const hash = createHash('md5')
	.update(`${secret}:${email}`)
	.digest('hex')
	.slice(0, 8);

const output = `${email}.${hash}@${domain}`;
if (argv.p) {
	await $`echo ${output} | pbcopy`.quiet();
	echo('Copied to 📋!');
} else {
	echo(output);
}

export {};
