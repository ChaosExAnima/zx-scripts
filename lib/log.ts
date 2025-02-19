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

export function writeIfTrue(conditional: boolean, ...messages: string[]) {
	if (conditional) {
		return messages;
	}
	return '';
}

type ArgType =
	| {
			name: string;
			optional?: boolean;
			type?: 'string' | 'number' | 'boolean';
			help?: string;
	  }
	| string;

interface ArgsAndHelp {
	args: ArgType[];
	help?: string | string[];
	flags?: string[];
}

export function checkArgsOrShowHelp({
	args,
	help = [],
	flags = [],
}: ArgsAndHelp): string[] {
	const normalizedArgs = args.map((arg) =>
		typeof arg === 'string' ? { name: arg } : arg,
	);
	if (
		argv._.length !== normalizedArgs.filter((arg) => !arg.optional).length
	) {
		// TODO: There is probably a library for this.
		showHelpAndExit(
			...(typeof help === 'string' ? [help] : help),
			writeIfTrue(
				args.length > 0,
				'Arguments:',
				...normalizedArgs.map((arg) => {
					const optional = arg.optional ? '' : '*';
					const help = arg.help ? `: ${arg.help}` : '';
					return `  ${arg.name}${optional}${help}`;
				}),
			),
			writeIfTrue(flags.length > 0, 'Flags:', ...flags),
		);
	}
	return args.map((_arg, index) => {
		const value = argv._[index];
		return value;
	});
}
