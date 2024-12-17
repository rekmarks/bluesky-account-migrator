# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/rekmarks/bluesky-account-migrator.git/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rekmarks/bluesky-account-migrator.git/releases/tag/v0.1.0
