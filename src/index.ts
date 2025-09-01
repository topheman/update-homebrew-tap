import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import ejs from "ejs";

interface Inputs {
	formulaTargetRepository: string;
	formulaTargetFile: string;
	formulaTemplate: string;
	tarFiles: string;
	metadata: string;
	commitMessage: string;
	token: string;
}

function safeParse(input: string): any {
	try {
		return JSON.parse(input);
	} catch {
		core.setFailed(`Failed to parse input as JSON. Original input:\n${input}`);
		return null;
	}
}

async function getInputs(): Promise<Inputs> {
	const tarFiles = core.getInput("tar-files", { required: true });
	const metadata = core.getInput("metadata", { required: true });

	// Prefer explicit token input, then fallback to GITHUB_TOKEN env
	const token =
		core.getInput("token") ||
		process.env.GITHUB_TOKEN ||
		process.env.PT_TOKEN ||
		"";

	if (!token) {
		throw new Error(
			"No authentication token provided. Please set `token` input or ensure `GITHUB_TOKEN`/`PT_TOKEN` is available.",
		);
	}

	return {
		formulaTargetRepository: core.getInput("formula-target-repository", {
			required: true,
		}),
		formulaTargetFile: core.getInput("formula-target-file", { required: true }),
		formulaTemplate: core.getInput("formula-template", { required: true }),
		tarFiles: safeParse(tarFiles),
		metadata: safeParse(metadata),
		commitMessage:
			core.getInput("commit-message") || "chore: update Homebrew formula",
		token,
	};
}

async function sha256FromUrl(url: string): Promise<string> {
	core.info(`Downloading ${url} to compute sha256...`);
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(
			`Failed to download ${url}: ${res.status} ${res.statusText}`,
		);
	}
	const buffer = Buffer.from(await res.arrayBuffer());
	return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function renderFormula(templatePath: string, data: any): Promise<string> {
	const template = await fs.readFile(templatePath, "utf-8");
	return ejs.render(template, data);
}

async function cloneAndCommit(
	repo: string,
	filePath: string,
	content: string,
	commitMessage: string,
	token: string,
): Promise<void> {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "homebrew-tap-"));
	const url = `https://x-access-token:${token}@github.com/${repo}.git`;

	core.info(`Cloning ${repo} into ${tempDir}`);
	await exec.exec("git", ["clone", url, tempDir]);

	const fullPath = path.join(tempDir, filePath);
	await fs.mkdir(path.dirname(fullPath), { recursive: true });
	await fs.writeFile(fullPath, content, "utf-8");

	await exec.exec("git", [
		"-C",
		tempDir,
		"config",
		"user.name",
		"github-actions[bot]",
	]);
	await exec.exec("git", [
		"-C",
		tempDir,
		"config",
		"user.email",
		"41898282+github-actions[bot]@users.noreply.github.com",
	]);

	await exec.exec("git", ["-C", tempDir, "add", filePath]);
	await exec.exec("git", ["-C", tempDir, "commit", "-m", commitMessage]);
	await exec.exec("git", ["-C", tempDir, "push"]);
}

async function run(): Promise<void> {
	try {
		const inputs = await getInputs();
		core.info(`Inputs: ${JSON.stringify(inputs, null, 2)}`);

		// Compute sha256 for each tarball
		const tarFilesWithSha: Record<string, { url: string; sha256: string }> = {};
		for (const [arch, url] of Object.entries(inputs.tarFiles)) {
			tarFilesWithSha[arch] = {
				url,
				sha256: await sha256FromUrl(url),
			};
		}

		// Prepare data for template
		const data = {
			metadata: inputs.metadata,
			tarFiles: tarFilesWithSha,
		};

		// Render formula
		const formulaContent = await renderFormula(inputs.formulaTemplate, data);

		// Commit to target tap repo
		await cloneAndCommit(
			inputs.formulaTargetRepository,
			inputs.formulaTargetFile,
			formulaContent,
			inputs.commitMessage,
			inputs.token,
		);

		core.info("✅ Homebrew tap updated successfully");
	} catch (error: any) {
		core.setFailed(error.message);
	}
}

run();
