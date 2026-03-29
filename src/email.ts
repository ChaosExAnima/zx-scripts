import { createHash } from 'node:crypto';
import { error, showHelpAndExit } from 'lib/log';
import { loadEnvVars, loadSecret } from 'lib/env';

$.verbose = false;

const prefix = argv._[0];

if (!prefix) {
	showHelpAndExit(
		'Generates a secure email: [prefix] [-d domain] [-p]',
		'',
		'Flags:',
		' d: Domain to use for email',
		' p: Copies output to clipboard using pbcopy',
	);
}

await loadEnvVars();
const domain = argv.domain ?? process.env.EMAIL_DOMAIN;
if (!domain) {
	error('EMAIL_DOMAIN env var not set');
}
const secret = await loadSecret('emailhash');

const hash = createHash('md5')
	.update(`${secret}:${prefix}`)
	.digest('hex')
	.slice(0, 8);

const email = `${prefix}.${hash}@${domain}`;
if (argv.p) {
	await $`echo -n ${email} | pbcopy`;
	echo('Copied to 📋!');
} else {
	echo(email);
}
