# topheman/update-homebrew-tap

Github action that updates a formula of a homebrew-tap repo based on your template.

## Inputs

### `formula-target-repository`

The repository to update the formula in. example: `topheman/homebrew-tap`

### `formula-target-file`

The path to the formula file inside the tap repository. example: `Formula/snakepipe.rb`

### `formula-template` (optional)

The path to the EJS template inside your **source repo**. example: `homebrew/formula.rb.ejs`.

If you don't provide this, the action will use the [default template](./src/formula.rb.ejs).

### `tar-files`

The YAML/JSON mapping of architectures to tarball URLs.

### `metadata`

The YAML/JSON metadata (e.g. version, custom variables).

### `commit-message` (optional)

The commit message to use when updating the formula.

Default: `"chore: update Homebrew formula"`

### `github-token` (optional)

Create a [personal access token](https://github.com/settings) with `contents: write` scope and pass it as environment variable (like in this example).

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
      # ...
      - name: Update Homebrew Formula
        uses: topheman/update-homebrew-tap@v1
        with:
          formula-target-repository: topheman/homebrew-tap
          formula-target-file: Formula/greet.rb
          tar-files: |
            {
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
