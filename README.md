# Perena Trading Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-purple.svg)](https://solana.com/)
[![Perena](https://img.shields.io/badge/Perena-Protocol-blue.svg)](https://perena.org/)

A sophisticated automated trading bot for the Perena protocol on Solana, designed to optimize token balances and maximize rewards through intelligent swap strategies.

## 🚀 Features

- **Smart Balance Management**: Automatically balances token holdings across USDC, USDT, PYUSD, and USD\*
- **Rewards Optimization**: Maximizes Perena protocol rewards through strategic trading
- **Rate Limiting**: Built-in protection against API rate limits
- **Error Handling**: Robust error handling with automatic retries
- **Real-time Monitoring**: Comprehensive logging and status updates
- **Configurable Parameters**: Easily adjustable trading parameters

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana wallet with sufficient SOL for transaction fees
- Token balances in supported tokens (USDC, USDT, PYUSD, USD\*)

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/perena-trading-bot.git
cd perena-trading-bot
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Set up configuration files:
   - Place your Solana keypair in `./config/keypair.json`
   - Get your SESSION_TOKEN from Perena dashboard
   - Configure your RPC URL (Helius, QuickNode, etc.)

## ⚙️ Configuration

### Supported Tokens

| Token | Mint Address                                   | Decimals | Program               |
| ----- | ---------------------------------------------- | -------- | --------------------- |
| USDC  | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | 6        | TOKEN_PROGRAM_ID      |
| USDT  | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` | 6        | TOKEN_PROGRAM_ID      |
| PYUSD | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` | 6        | TOKEN_2022_PROGRAM_ID |
| USD\* | `BenJy1n3WTx9mTjEvy63e8Q1j4RqUc6E4VBMz3ir4Wo6` | 6        | TOKEN_PROGRAM_ID      |

### Trading Parameters

- **MAX_ROUNDS**: 3000 (Maximum trading rounds)
- **MIN_BALANCE_THRESHOLD**: 1 (Minimum balance to consider for swaps)
- **SWAP_PERCENTAGE**: 99% (Percentage of balance to swap)
- **SLIPPAGE_TOLERANCE**: 15% (Maximum acceptable slippage)
- **ROUND_DELAY**: 5 hours (Delay between trading rounds)
- **OPERATION_DELAY**: 3 seconds (Delay between operations)

### Environment Variables

You can override default settings using environment variables:

```bash
export RPC_URL="your-solana-rpc-url"
export KEYPAIR_PATH="./path/to/your/keypair.json"
```

## 🚀 Usage

### Basic Usage

```bash
node app.js
```

### What the Bot Does

1. **Initialization**:

   - Loads wallet keypair
   - Connects to Solana RPC
   - Fetches current Perena rewards data
   - Displays initial token balances

2. **Smart Balance Management**:

   - Identifies the token with the highest balance
   - Swaps 99% of the highest balance to other tokens
   - Rotates through different target tokens
   - Maintains minimum balance thresholds

3. **Monitoring**:
   - Tracks swap success/failure rates
   - Monitors rewards accumulation
   - Logs all operations with timestamps

## 📊 Output Example

```
🚀 Starting Perena Trading Bot
📅 Started at: 2025-05-30T12:20:53.768Z

👤 Payer Address: AaDNmGDx78G481mooqvcBPRy6QKTkXWEhDrGhivnmuhu

🔧 Initializing Perena SDK...
✅ Using Tripool Address: 2w4A1eGyjRutakyFdmVyBiLPf98qKxNTC2LpuwhaCruZ

=== Initial Perena Rewards Data ===
🏆 Preseason 1 Total Points: 519694.7011493817
📊 Total Swap Volume: 211474.76983299988
🏅 Rank: 322 (99th percentile)

=== Initial Token Balances ===
✅ USDC: 7.313824
✅ USDT: 1209.016839
✅ PYUSD: 72.991971
✅ USD*: 6.457145

🤖 Starting Smart Balance Management System
```

## 🔧 Project Structure

```
perena/
├── app.js                    # Main bot application
├── package.json              # Dependencies and scripts
├── package-lock.json         # Dependency lock file
├── .env                      # Environment variables (not in repo)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
├── README.md                 # Project documentation
├── CONTRIBUTING.md           # Contribution guidelines
├── SECURITY.md               # Security policy and guidelines
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD pipeline
├── config/
│   ├── keypair.json          # Solana wallet keypair (not in repo)
│   └── README.md             # Configuration instructions
└── .history/                 # Version history files (auto-generated)
```

## 🛡️ Security Considerations

- **Private Keys**: Never commit your keypair files to version control
- **API Keys**: Keep RPC URLs and session tokens secure
- **Rate Limiting**: The bot includes built-in rate limiting to prevent API abuse
- **Error Handling**: Comprehensive error handling prevents crashes and data loss

## 🔍 Monitoring and Logs

The bot provides detailed logging including:

- Trading round progress
- Swap attempt results
- Balance changes
- Error messages and recovery attempts
- Rewards accumulation
- Performance statistics

## 🤖 Automation Guide

### 1. Automated Deployment with GitHub Actions

The project includes a CI/CD pipeline (`.github/workflows/ci.yml`) that automatically:

- Tests code on push/PR
- Validates dependencies
- Runs security checks

### 2. Server Deployment Options

#### Option A: VPS/Cloud Server (Recommended)

1. **Deploy to a VPS** (DigitalOcean, Linode, AWS EC2):

   ```bash
   # Clone and setup on server
   git clone https://github.com/SolanaLeeky/perena-trading-bot.git
   cd perena-trading-bot
   npm install

   # Setup environment
   cp .env.example .env
   # Edit .env with your values

   # Upload your keypair securely
   scp keypair.json user@server:/path/to/perena/config/
   ```

2. **Use PM2 for Process Management**:

   ```bash
   # Install PM2 globally
   npm install -g pm2

   # Start the bot with PM2
   pm2 start app.js --name "perena-bot"

   # Save PM2 configuration
   pm2 save
   pm2 startup

   # Monitor the bot
   pm2 status
   pm2 logs perena-bot
   ```

#### Option B: Docker Deployment

1. **Create Dockerfile**:

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   CMD ["node", "app.js"]
   ```

2. **Run with Docker**:

   ```bash
   # Build image
   docker build -t perena-bot .

   # Run container
   docker run -d --name perena-bot \
     -v $(pwd)/config:/app/config \
     -v $(pwd)/.env:/app/.env \
     perena-bot
   ```

### 3. Automated Scheduling

#### Option A: Cron Jobs (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Run bot every 6 hours
0 */6 * * * cd /path/to/perena-trading-bot && node app.js >> logs/bot.log 2>&1

# Or use PM2 with cron restart
0 0 * * * pm2 restart perena-bot
```

#### Option B: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at specific time)
4. Set action: Start a program
5. Program: `node.exe`
6. Arguments: `app.js`
7. Start in: `C:\path\to\perena-trading-bot`

### 4. Monitoring and Alerts

#### Health Check Script

Create `health-check.js`:

```javascript
const fs = require("fs");
const { exec } = require("child_process");

// Check if bot is running
exec("pm2 list | grep perena-bot", (error, stdout) => {
  if (!stdout.includes("online")) {
    // Send alert (email, Discord, Telegram)
    console.log("🚨 Bot is down! Restarting...");
    exec("pm2 restart perena-bot");
  }
});
```

#### Discord Webhook Notifications

Add to your bot code:

```javascript
const sendDiscordAlert = async (message) => {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (webhook) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
  }
};

// Use in error handling
catch (error) {
  await sendDiscordAlert(`🚨 Trading bot error: ${error.message}`);
}
```

### 5. Security Best Practices for Automation

- **Environment Variables**: Never hardcode sensitive data
- **File Permissions**: Restrict access to keypair files (`chmod 600`)
- **Firewall**: Only allow necessary ports
- **Updates**: Regularly update dependencies
- **Backups**: Backup keypair and configuration files
- **Monitoring**: Set up alerts for failures

### 6. Performance Optimization

- **Resource Monitoring**: Use `htop`, `pm2 monit`
- **Log Rotation**: Prevent log files from growing too large
- **Memory Management**: Monitor for memory leaks
- **Network**: Use reliable RPC endpoints

### 7. Troubleshooting Automation

**Common Issues:**

- Bot stops unexpectedly → Check PM2 logs
- Network errors → Verify RPC endpoint
- Permission errors → Check file permissions
- Out of SOL → Monitor wallet balance

**Debug Commands:**

```bash
# Check PM2 status
pm2 status
pm2 logs perena-bot --lines 50

# Check system resources
htop
df -h

# Test bot manually
node app.js
```

## ⚠️ Disclaimer

- This bot is for educational and research purposes
- Trading cryptocurrencies involves risk
- Always test with small amounts first
- Monitor the bot's performance regularly
- The authors are not responsible for any financial losses

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

Quick start:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🌟 Star History

If this project helped you, please consider giving it a ⭐!

## 🔗 Links

- [Perena App (Use Referral Code: ICLNPE)](https://app.perena.org/?ref=ICLNPE)
- [Perena Protocol](https://perena.org)
- [Documentation](https://docs.perena.org)
- [Discord Community](https://discord.gg/perena)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. Check the logs for error messages
2. Verify your configuration
3. Ensure sufficient SOL balance for fees
4. Check Solana network status
5. Review token balances

---

**Happy Trading! 🚀**
