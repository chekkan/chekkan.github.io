---
layout: post
title: "Automating Rust Releases and Versioning: A Practical Guide"
excerpt: >-
  Release and versioning process, including tools and scripts used to release an application written in Rust.
tags:
  - Rust
  - Github
---

Shipping software is more than just writing code — it’s about delivering reliable, versioned artifacts to your users. In
the Rust ecosystem, you can automate much of this process, ensuring every release is consistent, traceable, and easy to
consume. Here’s how you can set up a robust release and versioning workflow for your Rust project.

---

## Why Automate Releases?

- **Consistency:** Every release follows the same steps, reducing human error.
- **Traceability:** Each release is tagged and versioned, making it easy to track changes.
- **Multi-platform:** Build and distribute binaries for Linux, macOS, and Windows.
- **Changelogs:** Automatically generate and publish changelogs for every release.

---

## 1. Semantic Versioning: The Foundation

Rust projects typically follow [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** version when you make incompatible API changes,
- **MINOR** version when you add functionality in a backwards-compatible manner,
- **PATCH** version when you make backwards-compatible bug fixes.

Example: `1.2.3` (major.minor.patch)

---

## 2. Keeping a Changelog

A good changelog helps users and contributors understand what’s changed. The
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format is widely adopted:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- New feature: Export notes to PDF

### Fixed

- Crash on startup when config is missing

## [1.2.0] - 2024-05-22

### Added

- Initial release
```

---

## 3. Automating Version Bumping and Tagging

Instead of manually editing `Cargo.toml` and creating git tags, use
[`cargo-release`](https://github.com/crate-ci/cargo-release):

```bash
cargo install cargo-release
cargo release minor --no-confirm --push
```

This will:

- Bump the version in `Cargo.toml` and `Cargo.lock`
- Commit the change
- Tag the release (e.g., `v1.2.0`)
- Push to your repository

---

## 4. Building and Packaging Binaries

To reach users on all major platforms, build binaries for Linux, macOS, and Windows. For Linux, you can even package
your app as a `.deb` file using [`cargo-deb`](https://github.com/mmstick/cargo-deb`):

```bash
cargo install cargo-deb
cargo deb --no-build --output juggernote-1.2.0.deb
```

---

## 5. Automating Releases with GitHub Actions

A typical workflow might look like this:

- **On every tag push** (e.g., `v1.2.0`), the workflow:
  - Builds binaries for all platforms
  - Packages the Linux binary as a `.deb`
  - Uploads all artifacts to the GitHub Release
  - Publishes the changelog

Example workflow snippet:

```yaml
on:
  push:
    tags:
      - v[0-9]+.*

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - name: Install Rust
        run: rustup update stable && rustup default stable
      - name: Build release binary
        run: cargo build --release
      # ... (packaging steps)
      - uses: actions/upload-artifact@v4
        with:
          name: juggernote-${{ matrix.os }}
          path: dist/

  create-release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          path: dist
      - uses: taiki-e/create-gh-release-action@v1
        with:
          changelog: CHANGELOG.md
          branch: main
          token: ${{ secrets.GITHUB_TOKEN }}
      - uses: taiki-e/upload-rust-binary-action@v1
        with:
          asset: dist/juggernote-1.2.0.deb
          bin: juggernote
          token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 6. Publishing to crates.io

If your project is a library or CLI tool, you can also publish it to [crates.io](https://crates.io):

```bash
cargo publish
```

Automate this in your workflow with a step that runs only on new tags, and use your `CARGO_REGISTRY_TOKEN` secret.

---

## 7. Final Thoughts

Automating your Rust release process saves time, reduces mistakes, and gives your users confidence in your project’s
quality. With tools like `cargo-release`, `cargo-deb`, and GitHub Actions, you can deliver professional, multi-platform
releases with a single command or tag push.

---

**References:**

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [cargo-release](https://github.com/crate-ci/cargo-release)
- [cargo-deb](https://github.com/mmstick/cargo-deb)
- [GitHub Actions](https://docs.github.com/en/actions)
