import 'zx/globals';

export function line() {
	echo``;
}

export function bold(...text: unknown[]) {
	echo(chalk.bold(...text));
}

export function multiline(...strings: (string | string[])[]) {
	echo(strings.flat().join('\n'));
}

export function error(message: string, code = 1) {
	echo`${chalk.bold.red('Error:')} ${message}`;
	process.exit(code);
}

export function showHelpAndExit(...messages: Parameters<typeof multiline>) {
	multiline(...messages);
	process.exit();
}
