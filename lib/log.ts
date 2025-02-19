import chalkStderr from 'chalk';

export function debug(...text: unknown[]) {
	if (argv.v || argv.verbose) {
		process.stderr.write(chalkStderr.grey('Debug:', ...text, '\n'));
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

export function warning(...text: unknown[]) {
	echo(chalk.yellow('Warning:'), ...text);
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

type ArgType =
	| {
			name: string;
			optional?: boolean;
			type?: 'string' | 'number' | 'boolean';
	  }
	| string;

export function checkArgsOrShowHelp(
	args: ArgType[],
	...messages: Parameters<typeof multiline>
) {
	if (
		argv._.length !==
		args.filter((arg) => (typeof arg === 'string' ? true : !arg.optional))
			.length
	) {
		showHelpAndExit(
			...messages,
			'Args:',
			...args.map((arg) => (typeof arg === 'string' ? arg : arg.name)),
		);
	}
	return args.map((arg, index) => {
		const value = argv._[index];
		return value;
	});
}
