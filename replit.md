# Overview

This is a Discord bot application that provides TOTP (Time-based One-Time Password) code generation functionality through an interactive button interface. The bot allows Discord users to generate OTP codes with built-in rate limiting and daily usage restrictions to prevent abuse.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Bot Framework
- **Discord.js**: Uses the discord.js library for bot functionality
- **Slash Commands**: Uses Discord's application commands system
- **Intents**: Configured with Guilds and GuildMessages intents for core functionality

## Authentication & Security
- **TOTP Implementation**: Uses OTPLib library for generating time-based one-time passwords
- **Rate Limiting**: Implements dual-layer protection:
  - Cooldown system: 30-second intervals between requests per user
  - Daily limits: Maximum 2 codes per user per day
- **Environment Variables**: Sensitive configuration stored in .env file

## User Interface
- **Interactive Buttons**: Custom Discord UI View with Arabic-language button ("انقر للحصول على الرمز!")
- **Persistent Views**: Button remains active with timeout=None for continuous availability
- **Visual Feedback**: Uses red button style with lock emoji (🔐) for security emphasis

## Data Management
- **In-Memory Storage**: User data stored in Python dictionary structure
- **User Tracking**: Maintains per-user state including:
  - Last request timestamp
  - Daily usage count
  - Last access date for daily reset functionality
- **Automatic Reset**: Daily counters reset automatically based on date comparison

## Error Handling & Validation
- **Usage Validation**: Checks against both cooldown periods and daily limits
- **User Initialization**: Automatically creates user records on first interaction
- **Date-based Logic**: Handles day transitions for accurate daily limit enforcement

# External Dependencies

## Core Libraries
- **discord.js**: Discord API integration and bot framework
- **otplib**: TOTP/HOTP authentication code generation
- **dotenv**: Environment variable management for secure configuration

## Runtime Dependencies
- **Node.js**: JavaScript runtime environment for server-side execution
- **Date objects**: Date and time handling for rate limiting and daily resets
- **process.env**: Environment variable access for secure configuration

## Discord Platform
- **Discord Developer API**: Bot token authentication and server integration
- **Discord Gateway**: Real-time event handling and user interactions
- **Discord UI Components**: Button interactions and view management

## Configuration Requirements
- **Environment Variables**: Requires Discord bot token and potentially OTP secrets
- **Discord Permissions**: Needs appropriate bot permissions for message sending and UI interactions