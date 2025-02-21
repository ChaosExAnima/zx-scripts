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

type ArgType = {
	name: string;
	optional?: boolean;
	help?: string;
};

type FlagType = {
	name: string;
	alias?: string;
	help?: string;
};

type OrString<T> = T | string;

interface ArgsAndHelp {
	args: OrString<ArgType>[];
	help?: string | string[];
	flags?: OrString<FlagType>[];
	usage?: string;
}

export const commonFlags = [
	{
		name: 'verbose',
		alias: 'v',
		help: 'Enable verbose output',
	},
	{
		name: 'quiet',
		alias: 'q',
		help: 'Disable output (not yet implemented)',
	},
] satisfies FlagType[];

export function checkArgsOrShowHelp({
	args,
	help = [],
	flags = [],
	usage,
}: ArgsAndHelp) {
	const normalizedArgs = args.map((arg) =>
		typeof arg === 'string' ? { name: arg } : arg,
	);
	const normalizedFlags = flags.map((flag) =>
		typeof flag === 'string' ? { name: flag } : flag,
	);
	if (
		argv._.length !== normalizedArgs.filter((arg) => !arg.optional).length
	) {
		// TODO: Replace with Commander.js!
		showHelpAndExit(
			writeIfTrue(
				!!help,
				...(typeof help === 'string' ? [help] : help),
				'',
			),
			writeIfTrue(!!usage, `Usage: ${process.argv[2]} ${usage}`, ''),
			writeIfTrue(
				args.length > 0,
				'Arguments:',
				...normalizedArgs.map((arg) => {
					const help = arg.help ? `: ${arg.help}` : '';
					return `  ${argFormat(arg)}${help}`;
				}),
				'',
			),
			writeIfTrue(
				flags.length > 0,
				'Flags:',
				...normalizedFlags.map((flag) => {
					const alias = flag.alias ? `-${flag.alias}, ` : '';
					const help = flag.help ? `: ${flag.help}` : '';
					return `  ${alias}--${flag.name}${help}`;
				}),
			),
			// TODO: Add global flags but after implementing Commander.js.
		);
	}
	return {
		args: args.map((_, i) => argv._[i]),
		flags: normalizedFlags.reduce(
			(carry, { alias, name }) => ({
				...carry,
				[name]: argv[alias || name] ?? argv[name],
			}),
			{} as { [key: string]: string },
		),
	};
}

function argFormat(arg: ArgType) {
	return arg.optional ? `${arg.name} (optional)` : arg.name;
}
