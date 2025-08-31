export default {
	"**/*.ts": "biome check --write",
	"src/**/*.ts": () => "npm run typecheck",
};
