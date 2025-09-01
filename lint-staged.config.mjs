export default {
	"**/*.ts": (files) => [
		`biome check --write ${files.join(" ")}`,
		"npm run build",
	],
	"src/**/*.ts": () => "npm run typecheck",
};
