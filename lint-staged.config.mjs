export default {
	"**/*.ts": (files) => [
		`biome check --write ${files.join(" ")}`,
		"npm run build",
		"npm run test",
	],
	"src/**/*.ts": () => "npm run typecheck",
};
