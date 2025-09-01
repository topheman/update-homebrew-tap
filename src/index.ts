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
	githubToken: string;
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
		githubToken: core.getInput("github-token", { required: true }),
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
	const env = {
		...process.env,
		GH_TOKEN: token,
	};
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "homebrew-tap-"));

	core.info(`Cloning ${repo} into ${tempDir}`);
	await exec.exec("gh", ["repo", "clone", repo, tempDir], { env });

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

	// ✅ Push using authenticated URL directly
	const pushUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
	await exec.exec("git", ["-C", tempDir, "push", pushUrl, "HEAD"], { env });
}

async function run(): Promise<void> {
	try {
		const inputs = await getInputs();
		core.info(`Inputs: ${JSON.stringify(inputs, null, 2)}`);

		if (!inputs.githubToken) {
			core.setFailed("github-token is not set");
			return;
		}

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
			inputs.githubToken,
		);

		core.info("✅ Homebrew tap updated successfully");
	} catch (error: any) {
		core.setFailed(error.message);
	}
}

run();
