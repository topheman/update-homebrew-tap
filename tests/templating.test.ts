import assert from "node:assert";
import { describe, it } from "node:test";
import { render } from "ejs";
// @ts-expect-error
import { defaultTemplate } from "../src/formulaTemplate.ts";

function makeData(moreData: Record<string, any> = {}): Record<string, any> {
	return {
		metadata: {
			binaryName: "hello",
			description: "This is a Description",
			className: "Hello",
			version: "1.0.0",
			license: "MIT",
			...moreData.metadata,
		},
		tarFiles: {
			...moreData.tarFiles,
		},
	};
}

describe("templating", () => {
	it("should render with mandatory variables", () => {
		const result = render(
			defaultTemplate,
			makeData({
				tarFiles: {
					linuxArm: {
						url: "https://example.com/linux-arm.tar.gz",
						sha256: "linuxArm1234567890",
					},
					linuxIntel: {
						url: "https://example.com/linux-intel.tar.gz",
						sha256: "linuxIntel1234567890",
					},
					macArm: {
						url: "https://example.com/mac-arm.tar.gz",
						sha256: "macArm1234567890",
					},
					macIntel: {
						url: "https://example.com/mac-intel.tar.gz",
						sha256: "macIntel1234567890",
					},
				},
			}),
		);
		assert.strictEqual(
			result,
			`class Hello < Formula
  desc "This is a Description"
  homepage ""
  version "1.0.0"
  license "MIT"

  if OS.linux? && Hardware::CPU.arm?
    url "https://example.com/linux-arm.tar.gz"
    sha256 "linuxArm1234567890"
  end
  if OS.linux? && Hardware::CPU.intel?
    url "https://example.com/linux-intel.tar.gz"
    sha256 "linuxIntel1234567890"
  end
  if OS.mac? && Hardware::CPU.arm?
    url "https://example.com/mac-arm.tar.gz"
    sha256 "macArm1234567890"
  end
  if OS.mac? && Hardware::CPU.intel?
    url "https://example.com/mac-intel.tar.gz"
    sha256 "macIntel1234567890"
  end

  def install
    bin.install "hello"
    bash_completion.install "completions/bash/hello"
    fish_completion.install "completions/fish/hello.fish"
    zsh_completion.install "completions/zsh/_hello"
  end

  test do
    system "#{bin}/hello", "--version"
  end
end`,
		);
	});
});
