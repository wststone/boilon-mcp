---
alwaysApply: false
description: Defines the backend infrastructure for this project, including object storage, database systems, server architecture, and hosting environment.
---

# Backend Infrastructure

## File Storage

The project uses an S3-compatible object storage service for handling uploaded files and persistent binary assets.

## Database

PostgreSQL serves as the primary relational database for core application data.

Redis is used as a secondary data store to support caching, ephemeral state, and performance-sensitive operations.

## Auth

This application uses library `better-auth` for authentication and authorization

## Audio

This application uses ffmpeg for audio operations

## Hosting

The application is self-hosted on a VPS environment.

Self-hosting is required because the project depends on UDP, which is not supported by most serverless cloud platforms.