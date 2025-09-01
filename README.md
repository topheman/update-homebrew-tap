# topheman/update-homebrew-tap

Github action that updates a formula of a homebrew-tap repo based on your template.

## Inputs

### `formula-target-repository`

The repository to update the formula in. example: `topheman/homebrew-tap`

### `formula-target-file`

The path to the formula file inside the tap repository. example: `Formula/snakepipe.rb`

### `formula-template`

The path to the EJS template inside your **source repo**. example: `homebrew/formula.rb.ejs`

### `tar-files`

The YAML/JSON mapping of architectures to tarball URLs.

### `metadata`

The YAML/JSON metadata (e.g. version, custom variables).

### `commit-message` (optional)

The commit message to use when updating the formula.

Default: `"chore: update Homebrew formula"`

### `github-token` (optional)

The token to use for authentication. If not provided, the action will use the `GITHUB_TOKEN` environment variable.

Use it if you want to use a different token than the default one (if your homebrew-tap repo is in a different organization than your source repo for example).

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
          formula-target-file: Formula/snakepipe.rb
          formula-template: source-repo/homebrew/formula.rb.ejs
          tar-files: |
            linux-intel=https://github.com/topheman/snake-pipe-rust/releases/download/${{ github.ref_name }}/snakepipe-x86_64-unknown-linux-gnu.tar.gz
            mac-arm=https://github.com/topheman/snake-pipe-rust/releases/download/${{ github.ref_name }}/snakepipe-aarch64-apple-darwin.tar.gz
            mac-intel=https://github.com/topheman/snake-pipe-rust/releases/download/${{ github.ref_name }}/snakepipe-x86_64-apple-darwin.tar.gz
          metadata: |
            version=${{ github.ref_name }}
```

Based on a formula template like this:

```ejs
class Snakepipe < Formula
  desc "Snake game based on stdin/stdout in rust"
  homepage "https://github.com/topheman/snake-pipe-rust"
  version "<%= metadata.version %>"
  license "MIT"

  if OS.linux? && Hardware::CPU.intel?
    url "<%= urls["linux-intel"].url %>"
    sha256 "<%= urls["linux-intel"].sha256 %>"
  end
  if OS.mac? && Hardware::CPU.arm?
    url "<%= urls["mac-arm"].url %>"
    sha256 "<%= urls["mac-arm"].sha256 %>"
  end
  if OS.mac? && Hardware::CPU.intel?
    url "<%= urls["mac-intel"].url %>"
    sha256 "<%= urls["mac-intel"].sha256 %>"
  end

  def install
    bin.install "snakepipe"
    bash_completion.install "completions/bash/snakepipe"
    fish_completion.install "completions/fish/snakepipe.fish"
    zsh_completion.install "completions/zsh/_snakepipe"
  end

  test do
    system "#{bin}/snakepipe", "--version"
  end
end
```
