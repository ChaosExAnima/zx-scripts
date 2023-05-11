import 'zx/globals';
import { createHash } from 'node:crypto';
import { error, showHelpAndExit } from 'lib/log';
import { loadSecret } from 'lib/env';

$.verbose = false;

const email = argv._[0];

if (!email) {
	showHelpAndExit(
		'Generates a secure email: domain [-c]',
		'',
		'Flags:',
		' c: Copies output to clipboard using pbcopy',
	);
}

const domain = argv.domain ?? process.env.EMAIL_DOMAIN;
if (!domain) {
	error('EMAIL_DOMAIN env var not set');
}
const secret = loadSecret('email');
if (!secret) {
	error('Could not load email secret');
}

const hash = createHash('md5')
	.update(`${secret}:${email}`)
	.digest('hex')
	.slice(0, 8);

const output = `${email}.${hash}@${domain}`;
if (argv.p) {
	await $`echo ${output} | pbcopy`;
	echo('Copied to 📋!');
} else {
	echo(output);
}
