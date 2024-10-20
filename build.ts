import * as esbuild from 'esbuild';
import * as fs from 'fs/promises';
import { Plugin } from 'esbuild';
import { log, warn } from 'console';
import path from 'path';
import { argv } from 'process';

import 'dotenv/config';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

const linkPath = process.env.LINK_PATH;
const outPath = path.resolve(process.cwd(), 'bin');

const linkPlugin: Plugin = {
	name: 'link',
	async setup(build) {
		if (!linkPath) {
			warn('LINK_PATH not set');
			return;
		}
		build.onStart(async () => {
			performance.mark('build');
			const files = await fs.readdir(outPath);
			try {
				await Promise.allSettled(files.map((file) => fs.rm(file)));
			} catch (err) {
				warn(err);
			}
		});
		build.onEnd(async () => {
			const files = await fs.readdir(outPath);
			try {
				await Promise.allSettled(
					files.map(async (fileName) => {
						const filePath = path.resolve(outPath, fileName);
						await fs.chmod(filePath, 0o700);
						const fileLinkPath = path.resolve(
							linkPath,
							path.basename(filePath, '.js'),
						);
						await fs.link(filePath, fileLinkPath);
						log('Linked', filePath, 'to', fileLinkPath);
					}),
				);
			} catch (err) {
				warn(err);
			}
			const ms = performance.measure('built', 'build').duration;
			log(
				chalk.dim(
					`Built ${files.length} files in ${Math.round(ms)} ms`,
				),
			);
		});
	},
};

const ctx = await esbuild.context({
	entryPoints: ['src/*.ts'],
	bundle: true,
	outdir: 'bin',
	outbase: 'src',
	platform: 'node',
	format: 'esm',
	banner: {
		js: '#!/usr/bin/env /Users/echo/.volta/bin/zx',
	},
	external: ['zx'],
	plugins: [linkPlugin],
});

if (argv.at(-1) === '--watch') {
	log('Watching...');
	await ctx.watch();
} else {
	await ctx.rebuild();
	await ctx.dispose();
	log(chalk.green('Finished successfully!'));
}
