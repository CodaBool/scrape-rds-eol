---
title: Amazon RDS for PostgreSQL
category: db
iconSlug: postgresql
permalink: /rds-postgresql
releasePolicyLink: >-
  https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html
releases:
  - latest: "15.2"
    releaseCycle: "15"
    releaseDate: 2023-02-27
    eol: 2027-11-01
    latestReleaseDate: 2023-02-28
  - latest: "14.6"
    releaseCycle: "14"
    releaseDate: 2022-02-03
    eol: 2026-11-01
    latestReleaseDate: 2023-01-24
  - latest: "13.9"
    releaseCycle: "13"
    releaseDate: 2021-02-24
    eol: 2025-11-01
    latestReleaseDate: 2023-01-24
  - latest: "12.13"
    releaseCycle: "12"
    releaseDate: 2020-03-31
    eol: 2024-11-01
    latestReleaseDate: 2023-01-24
  - latest: "11.18"
    releaseCycle: "11"
    releaseDate: 2019-03-13
    eol: 2023-11-01
    latestReleaseDate: 2023-01-24
  - latest: "10.23"
    releaseCycle: "10"
    releaseDate: 2018-02-27
    eol: 2023-04-01
    latestReleaseDate: 2023-01-24
  - latest: ""
    releaseCycle: "9.6"
    releaseDate: 2016-11-11
    eol: 2022-04-30

---

> [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql) is a PaaS offering from Amazon for creating PostgreSQL Databases on AWS. RDS makes it easier to set up, operate, and scale PostgreSQL deployments on AWS cloud. PostgreSQL runs against its source Community Edition.

**PostgreSQL recommends that all users run the latest available minor release for whatever major version is in use.**

- AWS will provide support for major releases 3 years after their RDS release date.

- AWS will provide support for minor versions 1 year after their RDS release date.

Keep in mind that by default minor versions are automatically upgraded during maintenance windows.

For more info on how RDS versions are deprecated see the AWS [documentation](https://aws.amazon.com/rds/faqs/#What_happens_when_an_Amazon_RDS_DB_engine_version_is_deprecated.3F).

Please follow [best practices](https://aws.amazon.com/blogs/database/best-practices-for-upgrading-amazon-rds-to-major-and-minor-versions-of-postgresql) when performing upgrades to your RDS instance.

### Minor Version Support

| Release | Security Support | RDS Release |
| ------- | ---------------- | ----------- |
| 15.2    | 2024-02-01       | 2023-02-28  |
| 14.6    | 2024-01-01       | 2023-01-24  |
| 14.5    | 2023-11-01       | 2022-11-18  |
| 14.4    | 2023-09-01       | 2022-09-01  |
| 14.3    | 2023-08-01       | 2022-08-04  |
| 14.2    | 2023-03-20       | 2022-03-15  |
| 14.1    | 2023-03-20       | 2022-01-27  |
| 13.9    | 2024-01-01       | 2023-01-24  |
| 13.8    | 2023-11-01       | 2022-11-18  |
| 13.7    | 2023-08-01       | 2022-08-04  |
| 13.6    | 2023-03-20       | 2022-03-15  |
| 13.5    | 2023-03-20       | 2022-01-24  |
| 13.4    | 2023-03-20       | 2021-10-01  |
| 13.3    | 2023-03-20       | 2021-07-12  |
| 12.13   | 2024-01-01       | 2023-01-24  |
| 12.12   | 2023-11-01       | 2022-11-18  |
| 12.11   | 2023-08-01       | 2022-08-04  |
| 12.10   | 2023-03-20       | 2022-03-15  |
| 12.9    | 2023-03-20       | 2022-01-24  |
| 12.8    | 2023-03-20       | 2021-10-01  |
| 12.7    | 2023-03-20       | 2021-07-12  |
| 11.18   | 2024-01-01       | 2023-01-24  |
| 11.17   | 2023-11-01       | 2022-11-18  |
| 11.16   | 2023-08-01       | 2022-08-04  |
| 11.15   | 2023-03-20       | 2022-03-15  |
| 11.14   | 2023-03-20       | 2022-01-24  |
| 11.13   | 2023-03-20       | 2021-10-01  |
| 11.12   | 2023-03-20       | 2021-07-12  |
| 10.23   | 2023-04-17       | 2023-01-24  |
| 10.22   | 2023-04-17       | 2022-11-18  |
| 10.21   | 2023-04-17       | 2022-08-04  |
| 10.20   | 2023-03-20       | 2022-03-15  |
| 10.19   | 2023-03-20       | 2022-01-24  |
| 10.18   | 2023-03-20       | 2021-10-01  |
| 10.17   | 2023-03-20       | 2021-07-12  |
