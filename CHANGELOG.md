<!-- markdownlint-disable -->
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.0.12] - 2026-04-13

### Fixed
- Fix unresolved dependencies on build

## [v1.0.11] - 2026-04-10

### Added
- Add base styles with theming to `IotaElement`

## [v1.0.10] - 2026-04-02

### Added
- Add lazy-loading support to `IotaElement`

## [v1.0.9] - 2026-04-01

### Added
- Add `theme` support to `IotaElement`

## [v1.0.8] - 2026-03-18

### Added
- Add `$html` tagged template (uses `@aegisjsproject/core/parsers/html.js`)

## [v1.0.7] - 2026-03-17

### Added
- Add `$proxy` and `createSignalProxy()`

### Deprecated
- Fix `$signal` to be `$state` and mark `$signal` as deprecated

## [v1.0.6] - 2026-03-16

### Added
- Add `IotaElement` as base class for custom elements

## [v1.0.5] - 2026-03-15

### Fixed
- Fixed binding to state (`$text()`) using of an empty string

## [v1.0.4] - 2026-03-15

### Changed
- Update `toString()` on signals to avoid need for hydration step

## [v1.0.3] - 2026-03-14

### Added
- Add support for boolean/array attributes
- Add helper attribute functions such as `$disabled`, `$hidden`, etc.
- Add `$peek()` and `$log()`

## [v1.0.2] - 2026-03-13

### Added
- Add support for boolean attributes
- Add `$render()` (observer & replace children of target)

## [v1.0.1] - 2026-03-11

### Added
- Add tests

## [v1.0.0] - 2026-03-11

Initial Release
