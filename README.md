# topheman/update-homebrew-tap

Github action that updates a formula of a homebrew-tap repo based on your template.

## Inputs

### `formula-target-repository`

The repository to update the formula in. example: `topheman/homebrew-tap`

### `formula-target-file`

The path to the formula file inside the tap repository. example: `Formula/snakepipe.rb`

### `formula-template` (optional)

The path to the EJS template inside your **source repo**. example: `homebrew/formula.rb.ejs`.

If you don't provide this, the action will use the [default template](./src/formulaTemplate.ts).

### `tar-files`

The YAML/JSON mapping of architectures to tarball URLs.

### `metadata`

The YAML/JSON metadata (e.g. version, custom variables).

### `commit-message` (optional)

The commit message to use when updating the formula.

Default: `"chore: update Homebrew formula"`

### `github-token` (optional)

Needed if you want to push to a different repository than the one you're in.

1. Create a personal access token
- Go to GitHub → Settings → Developer settings → [Personal access tokens](https://github.com/settings/personal-access-tokens)
- Generate a new token with `contents: write` scope
2. Add the secret to your repository:
- Go to your repository → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name it `HOMEBREW_TAP_TOKEN` or whatever you want
- Paste the token as the value


## Outputs

None.

## Example

```yaml
name: Update Homebrew Tap

on:
  release:
    types: [published]

jobs:
  update-homebrew-tap:
    runs-on: ubuntu-latest

    permissions:
      contents: write  # ✅ minimal required for pushing commits

    steps:
      - uses: actions/checkout@v4
      - name: Update Homebrew Formula
        uses: topheman/update-homebrew-tap@v2
        with:
          formula-target-repository: topheman/homebrew-tap
          formula-target-file: Formula/greet.rb
          tar-files: |
            {
              "linuxArm": "https://github.com/topheman/update-homebrew-tap-playground/releases/download/${{ github.ref_name }}/greet-aarch64-unknown-linux-gnu.tar.gz",
              "linuxIntel": "https://github.com/topheman/update-homebrew-tap-playground/releases/download/${{ github.ref_name }}/greet-x86_64-unknown-linux-gnu.tar.gz",
              "macArm": "https://github.com/topheman/update-homebrew-tap-playground/releases/download/${{ github.ref_name }}/greet-aarch64-apple-darwin.tar.gz",
              "macIntel": "https://github.com/topheman/update-homebrew-tap-playground/releases/download/${{ github.ref_name }}/greet-x86_64-apple-darwin.tar.gz"
            }
          metadata: |
            {
              "version": "${{ github.ref_name }}",
              "binaryName": "greet",
              "description": "Greet CLI application",
              "homepage": "https://github.com/topheman/update-homebrew-tap-playground",
              "license": "MIT"
            }
          github-token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```


You can customize the template to your needs, keep it in your source repo and pass it as `formula-template` input.
