# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0]

### Uncategorized

- feat!: Support custom handles on the new PDS ([#49](https://github.com/rekmarks/bluesky-account-migrator.git/pull/49))
- chore(deps): Bump @inquirer/prompts from 7.2.1 to 7.2.2 ([#51](https://github.com/rekmarks/bluesky-account-migrator.git/pull/51))
- chore(deps): Bump @atproto/crypto from 0.4.2 to 0.4.3 ([#50](https://github.com/rekmarks/bluesky-account-migrator.git/pull/50))
- chore(deps): Bump @atproto/api from 0.13.21 to 0.13.26 ([#48](https://github.com/rekmarks/bluesky-account-migrator.git/pull/48))
- chore(deps-dev): Bump @types/node from 22.10.2 to 22.10.5 ([#47](https://github.com/rekmarks/bluesky-account-migrator.git/pull/47))
- chore(deps-dev): Bump esbuild from 0.24.1 to 0.24.2 ([#41](https://github.com/rekmarks/bluesky-account-migrator.git/pull/41))
- chore(deps-dev): Bump eslint-plugin-n from 17.15.0 to 17.15.1 ([#40](https://github.com/rekmarks/bluesky-account-migrator.git/pull/40))
- chore: Configure Dependabot to only update prod dependencies
- chore(deps): Bump @inquirer/prompts from 7.2.0 to 7.2.1 ([#39](https://github.com/rekmarks/bluesky-account-migrator.git/pull/39))
- test: Remove default confirmation token param
- docs: Fix typo in readme
- docs: Document 2fa limitations ([#36](https://github.com/rekmarks/bluesky-account-migrator.git/pull/36))

## [0.3.0]

### Added

- Add `--pipe` mode ([#28](https://github.com/rekmarks/bluesky-account-migrator/pull/28))
  - This mode reads from `stdin` and writes to `stdout`.
- Add `--debug` flag ([#29](https://github.com/rekmarks/bluesky-account-migrator/pull/29))
  - This currently just controls whether stack traces are shown.
- Add `serialize()`/`deserialize()` methods to `Migration` class ([#28](https://github.com/rekmarks/bluesky-account-migrator/pull/28))
  - This makes it easier to restore/resume partially completed migrations.

### Changed

- **BREAKING:** Refactor main module exports ([#28](https://github.com/rekmarks/bluesky-account-migrator/pull/28))
  - The `migration` module is removed and its names are instead floated to the top.
- **BREAKING:** Replace `--mode` option with `--interactive` and `--pipe` flags ([#29](https://github.com/rekmarks/bluesky-account-migrator/pull/29))
  - Basically, modes are now mutually exclusive flags instead of a single string option.
- Make credential validation more stringent ([#28](https://github.com/rekmarks/bluesky-account-migrator/pull/28))
  - This should catch errors at earlier stage.

## [0.2.1]

### Fixed

- Prevent submission of invalid new handles during interactive migrations
  - The Bluesky PDS implementation requires that, for e.g. a PDS hosted at `pds.foo.com`,
    all created accounts must have handles of the form `*.pds.foo.com`.
  - If you are migrating an existing custom handle, you can restore it after the migration.

## [0.2.0]

### Changed

- Make `migrate` the default CLI command

### Fixed

- Fix support for custom handles on old PDS
  - Permits handles such as `foo.com` even if your old PDS is something else, like `bsky.social`.
  - The full handle must now always be entered, including the PDS URL (if it's in the handle).

## [0.1.0]

### Added

- Initial release ([#12](https://github.com/rekmarks/bluesky-account-migrator/pull/12))

[Unreleased]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rekmarks/bluesky-account-migrator.git/releases/tag/v0.1.0
