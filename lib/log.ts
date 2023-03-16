import 'zx/globals';

export function debug(...text: unknown[]) {
	if (argv.v || argv.verbose) {
		echo(chalk.gray('Debug: ', ...text));
	}
}

export function line() {
	echo``;
}

export function bold(...text: unknown[]) {
	echo(chalk.bold(...text));
}

export function multiline(...strings: (string | string[])[]) {
	echo(strings.flat().join('\n'));
}

export function error(message: any, code = 1) {
	if (message instanceof Error) {
		message = message.message;
	}
	echo`${chalk.bold.red('Error:')} ${message}`;
	process.exit(code);
}

export function showHelpAndExit(...messages: Parameters<typeof multiline>) {
	multiline(...messages);
	process.exit();
}
