# Perena Trading Bot 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Solana](https://img.shields.io/badge/Solana-Mainnet-purple.svg)](https://solana.com/)
[![Perena](https://img.shields.io/badge/Perena-Protocol-blue.svg)](https://perena.org/)
[![Discord](https://img.shields.io/badge/Discord-Integration-7289da.svg)](https://discord.com/)

A sophisticated automated trading bot for the Perena protocol on Solana, designed to optimize token balances and maximize rewards through intelligent swap strategies with comprehensive Discord webhook integration.

## ✨ Key Features

### 🎯 Core Trading Features

- **Multi-Wallet Support**: Manage multiple wallets simultaneously with parallel execution
- **Smart Balance Management**: Automatically balances token holdings across USDC, USDT, PYUSD, and USD\*
- **Rewards Optimization**: Maximizes Perena protocol rewards through strategic trading
- **Intelligent Swap Logic**: Dynamic token selection and balance optimization
- **Rate Limiting**: Built-in protection against API rate limits
- **Error Handling**: Robust error handling with automatic retries

### 📱 Discord Integration

- **Real-time Notifications**: Complete bot activity monitoring via Discord webhooks
- **Console-style Formatting**: Discord messages mirror terminal output with timestamps
- **Comprehensive Alerts**: Startup, trading events, swap results, errors, and completion notifications
- **Rewards Tracking**: Detailed rewards data updates with points, volume, and rankings
- **Multi-wallet Identification**: Clear wallet indexing for multi-wallet operations

### 🔧 Advanced Features

- **Configurable Parameters**: Easily adjustable trading parameters
- **Real-time Monitoring**: Comprehensive logging and status updates
- **Performance Analytics**: Success rates, swap statistics, and trading summaries
- **Random Delays**: Anti-detection patterns with configurable wait times

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana wallet with sufficient SOL for transaction fees
- Token balances in supported tokens (USDC, USDT, PYUSD, USD\*)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SolanaLeeky/perena-trading-bot.git
cd perena-trading-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Required: Solana Configuration
RPC_URL=your-solana-rpc-url
KEYPAIR_PATH=./config/keypair.json
SESSION_TOKEN=your-perena-session-token

# Multi-wallet Configuration (add as many as needed)
WALLET_1=your-first-wallet-private-key
WALLET_2=your-second-wallet-private-key
WALLET_3=your-third-wallet-private-key

# Optional: Discord Integration
DISCORD_WEBHOOK_URL=your-discord-webhook-url

# Optional: Trading Parameters
MAX_ROUNDS=3000
MIN_BALANCE_THRESHOLD=1
SWAP_PERCENTAGE=99
SLIPPAGE_TOLERANCE=15
ROUND_DELAY_HOURS=5
```

### 4. Discord Webhook Setup (Optional)

To enable Discord notifications:

1. **Create a Discord Webhook**:

   - Go to your Discord server settings
   - Navigate to Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL

2. **Add to Environment**:

   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
   ```

3. **Notification Types**:
   - Bot startup and shutdown
   - Wallet loading status
   - Trading start/completion
   - Swap results (success/failure)
   - Rewards data updates
   - Error alerts

### 5. Wallet Configuration

**Option A: Single Wallet (Legacy)**

- Place your Solana keypair in `./config/keypair.json`

**Option B: Multi-Wallet (Recommended)**

- Add wallet private keys to environment variables (`WALLET_1`, `WALLET_2`, etc.)
- The bot will automatically detect and manage all configured wallets

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

### Quick Start

```bash
# Start the bot
npm start

# Or run directly
node app.js

# Development mode with debugging
npm run dev
```

### How the Bot Works

#### 1. **Initialization Phase**

- Loads and validates all configured wallets
- Connects to Solana RPC endpoint
- Initializes Perena SDK
- Fetches current rewards data for each wallet
- Displays initial token balances
- Sends Discord startup notification (if configured)

#### 2. **Multi-Wallet Trading Execution**

- **Parallel Processing**: All wallets trade simultaneously
- **Independent Management**: Each wallet operates with its own strategy
- **Load Balancing**: Distributes trading load across wallets
- **Error Isolation**: Wallet failures don't affect others

#### 3. **Smart Balance Management (Per Wallet)**

- Identifies the token with the highest balance
- Swaps 99% of the highest balance to other supported tokens
- Rotates through different target tokens strategically
- Maintains minimum balance thresholds
- Implements random delays to avoid detection

#### 4. **Real-time Monitoring & Notifications**

- **Console Logging**: Detailed terminal output with timestamps
- **Discord Integration**: Real-time webhook notifications
- **Performance Tracking**: Success/failure rates and statistics
- **Rewards Monitoring**: Continuous rewards data updates
- **Error Handling**: Comprehensive error reporting and recovery

#### 5. **Trading Cycle Management**

- Completes specified number of rounds (default: 3000)
- Implements configurable delays between rounds
- Provides trading summaries for each wallet
- Sends completion notifications via Discord

## 📊 Output Examples

### Console Output

```
🚀 Starting Perena Trading Bot
📅 Started at: 2025-01-15T14:30:25.123Z

🔧 Loading wallets from environment variables...
✅ Loaded 3 wallets successfully

🔧 Initializing Perena SDK...
✅ Using Tripool Address: 2w4A1eG...........uZ

=== Wallet 1 - Initial Perena Rewards Data ===
🏆 Preseason 1 Total Points: 519694.70
📊 Total Swap Volume: 211474.77
🏅 Rank: 322 (99th percentile)
💎 DeFi Points: Jupiter: 1250, Orca: 890

=== Wallet 1 - Initial Token Balances ===
👤 Address: AaDN.........nmuhu
✅ USDC: 7.313824
✅ USDT: 1209.016839
✅ PYUSD: 72.991971
✅ USD*: 6.457145

🤖 Starting Smart Balance Management for 3 wallets...
📊 Updated Perena Rewards Data:
🏆 Total Points: 520150.45
📊 Swap Volume: 212890.33
🏅 Rank: 318 (99th percentile)
💎 DeFi Points: Jupiter: 1275, Orca: 915

⏳ Waiting 2.5 hours before next swap...

💰 Wallet 1 - Swapping 1195.65 USDT → USDC
✅ Swap successful! Hash: 3xK9mP2vQ8...
📈 New USDC balance: 1202.98

=== Trading Summary - Wallet 1 ===
📊 Total Swaps: 45 | ✅ Success: 43 | ❌ Failed: 2
📈 Success Rate: 95.56%
👤 Wallet:  AaDN.........nmuhu
```

### Discord Notifications

```
[2025-01-15 14:30:25] 🚀 Perena Trading Bot started with 3 wallets

[2025-01-15 14:32:10] 📊 Updated Perena Rewards Data:
🏆 Total Points: 520150.45
📊 Swap Volume: 212890.33
🏅 Rank: 318 (99th percentile)
💎 DeFi Points: Jupiter: 1275, Orca: 915

[2025-01-15 14:32:15] ⏳ Waiting 2.5 hours before next swap... [Wallet 1]

[2025-01-15 17:02:30] 🔄 Starting trading for wallet 1

[2025-01-15 17:03:45] ✅ Swap successful: 1195.65 USDT → 1202.98 USDC [Wallet 1]
Hash: 3xK9mP2vQ8nR7sL4tF6uH9jM1kN3pQ5rS8vW2xY4zA7b

[2025-01-15 20:15:20] 🏁 Trading completed for all wallets
📊 Total Swaps: 135 | ✅ Success: 128 | ❌ Failed: 7
📈 Overall Success Rate: 94.81%
```

## 🔧 Project Structure

```
perena-trading-bot/
├── 📄 app.js                 # Main bot application with multi-wallet support
├── 📦 package.json           # Dependencies and npm scripts
├── 🔒 package-lock.json      # Dependency lock file
├── ⚙️ .env                   # Environment variables (not in repo)
├── 📋 .env.example           # Environment variables template
├── 🚫 .gitignore             # Git ignore rules
├── 📜 LICENSE                # MIT License
├── 📖 README.md              # Project documentation (this file)
├── 🤝 CONTRIBUTING.md        # Contribution guidelines
├── 🛡️ SECURITY.md            # Security policy and guidelines
└── 📁 .github/
    └── workflows/
        └── ci.yml            # GitHub Actions CI/CD pipeline
```

### Key Files Description

- **`app.js`**: Core application with multi-wallet trading logic, Discord integration, and smart balance management
- **`.env.example`**: Template for environment configuration including wallet keys and Discord webhook
- **`package.json`**: Project metadata, dependencies (@perena/numeraire-sdk, @solana/web3.js, axios), and scripts
- **`CONTRIBUTING.md`**: Guidelines for contributing to the project
- **`SECURITY.md`**: Security best practices and vulnerability reporting
- **`.github/workflows/ci.yml`**: Automated testing and deployment pipeline

## 🛡️ Security Considerations

- **Private Keys**: Never commit your keypair files to version control
- **API Keys**: Keep RPC URLs and session tokens secure
- **Rate Limiting**: The bot includes built-in rate limiting to prevent API abuse
- **Error Handling**: Comprehensive error handling prevents crashes and data loss

## 🔍 Monitoring and Logs

### Console Monitoring

The bot provides comprehensive terminal logging:

- **Startup Sequence**: Wallet loading, SDK initialization, initial balances
- **Trading Progress**: Round-by-round execution with timestamps
- **Swap Details**: Token amounts, transaction hashes, success/failure status
- **Balance Updates**: Real-time token balance changes
- **Error Handling**: Detailed error messages with recovery attempts
- **Performance Metrics**: Success rates, trading summaries, rewards tracking

### Discord Integration

Real-time webhook notifications include:

- **Bot Lifecycle**: Startup, shutdown, and status updates
- **Trading Events**: Swap executions, completions, and failures
- **Rewards Updates**: Complete rewards data with points, volume, and rankings
- **Error Alerts**: Critical failures and recovery notifications
- **Multi-wallet Status**: Individual wallet performance and identification

### Log Management

```bash
# View real-time logs
npm start

# Save logs to file
node app.js > trading.log 2>&1

# Monitor with timestamps
node app.js | while read line; do echo "$(date): $line"; done
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **Insufficient Balance Errors**

```
Error: InsufficientBalance
```

**Solutions:**

- Ensure wallets have sufficient SOL for transaction fees (minimum 0.01 SOL)
- Verify token balances meet minimum thresholds
- Check if tokens are available in the wallet

#### 2. **RPC Connection Issues**

```
Error: Failed to connect to RPC endpoint
```

**Solutions:**

- Verify RPC_URL in .env file
- Try alternative RPC providers (Helius, QuickNode, Alchemy)
- Check network connectivity

#### 3. **Discord Webhook Failures**

```
Discord notification failed
```

**Solutions:**

- Verify DISCORD_WEBHOOK_URL is correct
- Check webhook permissions in Discord server
- Ensure webhook hasn't been deleted

#### 4. **Wallet Loading Errors**

```
Error: Invalid private key format
```

**Solutions:**

- Verify wallet private keys are in correct format (base58)
- Check environment variable names (WALLET_1, WALLET_2, etc.)
- Ensure no extra spaces or characters in .env file

#### 5. **Session Token Issues**

```
Error: Unauthorized - Invalid session token
```

**Solutions:**

- Update SESSION_TOKEN from Perena dashboard
- Clear browser cache and re-login to Perena
- Check token expiration

### Debug Mode

Run the bot in debug mode for detailed information:

```bash
# Enable debug logging
DEBUG=* npm start

# Or run with Node.js inspector
npm run dev
```

### Performance Optimization

#### Memory Usage

```bash
# Monitor memory usage
node --max-old-space-size=4096 app.js
```

#### Network Optimization

- Use premium RPC endpoints for better reliability
- Implement connection pooling for multiple wallets
- Monitor rate limits and adjust delays accordingly

### Emergency Procedures

#### Stop Trading Immediately

```bash
# Kill the process
Ctrl + C

# Or find and kill by process ID
ps aux | grep node
kill -9 <process_id>
```

#### Backup Wallet Data

```bash
# Backup environment file
cp .env .env.backup

# Export wallet addresses for verification
node -e "console.log(process.env.WALLET_1)" # Check wallet keys
```

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

## ❓ Frequently Asked Questions (FAQ)

### General Questions

**Q: How many wallets can I run simultaneously?**
A: There's no hard limit, but we recommend starting with 3-5 wallets to monitor performance. Add more gradually based on your system resources and RPC limits.

**Q: Do I need to keep my computer running 24/7?**
A: For continuous trading, yes. Consider using a VPS or cloud server for uninterrupted operation. See the [Automation Guide](#-automation-guide) for deployment options.

**Q: How much SOL do I need for transaction fees?**
A: Minimum 0.01 SOL per wallet, but we recommend 0.05-0.1 SOL per wallet for extended trading sessions.

**Q: Can I run this on Windows/Mac/Linux?**
A: Yes! The bot is cross-platform and works on all major operating systems with Node.js 16+.

### Trading Questions

**Q: What tokens are supported?**
A: Currently supports USDC, USDT, PYUSD, and USD\* on Solana mainnet through the Perena protocol.

**Q: How does the bot decide which tokens to swap?**
A: The bot identifies the token with the highest balance and swaps 99% of it to other supported tokens, rotating targets strategically.

**Q: Can I customize trading parameters?**
A: Yes! Modify parameters in your `.env` file including swap percentage, slippage tolerance, delays, and round limits.

**Q: What's the typical success rate?**
A: Success rates typically range from 90-98% depending on network conditions, RPC quality, and market volatility.

### Technical Questions

**Q: Why do I get "InsufficientBalance" errors?**
A: This usually means insufficient SOL for fees or token balances below minimum thresholds. Check the [Troubleshooting](#-troubleshooting) section.

**Q: Can I use free RPC endpoints?**
A: While possible, premium RPC endpoints (Helius, QuickNode) provide better reliability and higher rate limits for multi-wallet operations.

**Q: How do I update the bot?**
A: Pull the latest changes with `git pull origin main` and run `npm install` to update dependencies.

**Q: Is my private key data secure?**
A: Private keys are stored locally in your `.env` file and never transmitted. Follow security best practices in the [Security](#️-security-considerations) section.

### Discord Integration

**Q: Are Discord notifications required?**
A: No, Discord integration is optional. The bot works perfectly without it, but notifications provide valuable real-time monitoring.

**Q: Can I customize Discord message format?**
A: The current format mirrors console output. For custom formatting, you can modify the `sendDiscordNotification` function in `app.js`.

**Q: What if my Discord webhook stops working?**
A: The bot will continue trading normally. Check webhook URL validity and Discord server permissions.

## ⚠️ Disclaimer

- **Educational Purpose**: This bot is primarily for educational and research purposes
- **Financial Risk**: Trading cryptocurrencies involves significant financial risk
- **Testing First**: Always test with small amounts before deploying larger capital
- **Monitoring Required**: Regularly monitor bot performance and market conditions
- **No Guarantees**: Past performance doesn't guarantee future results
- **Liability**: The authors are not responsible for any financial losses
- **Compliance**: Ensure compliance with local regulations regarding automated trading
- **Network Risks**: Solana network congestion or outages may affect trading performance

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

## 🔗 Useful Links

### Perena Protocol

- [🎯 Perena App (Use Referral Code: ICLNPE)](https://app.perena.org/?ref=ICLNPE)
- [📖 Perena Protocol Website](https://perena.org)
- [📚 Official Documentation](https://docs.perena.org)
- [💬 Discord Community](https://discord.gg/perena)
- [🐦 Twitter Updates](https://twitter.com/perena_org)

### Solana Ecosystem

- [🌐 Solana Explorer](https://explorer.solana.com/)
- [📊 Solana Status](https://status.solana.com/)
- [🔧 Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

### RPC Providers

- [⚡ Helius](https://helius.xyz/) - Premium RPC with high rate limits
- [🚀 QuickNode](https://quicknode.com/) - Reliable Solana RPC service
- [🔮 Alchemy](https://alchemy.com/) - Enterprise-grade blockchain infrastructure

### Development Tools

- [📦 NPM Package Registry](https://www.npmjs.com/)
- [🐙 GitHub Repository](https://github.com/SolanaLeeky/perena-trading-bot)
- [🔄 GitHub Issues](https://github.com/SolanaLeeky/perena-trading-bot/issues)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### License Summary

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ No liability assumed

## 🆘 Support & Help

### Getting Help

If you encounter issues, follow this troubleshooting order:

1. **📋 Check the [FAQ](#-frequently-asked-questions-faq)** - Most common issues are covered
2. **🔍 Review [Troubleshooting](#-troubleshooting)** - Detailed solutions for specific errors
3. **📊 Examine logs** - Check console output and Discord notifications for error details
4. **⚙️ Verify configuration** - Ensure `.env` file is properly configured
5. **💰 Check balances** - Ensure sufficient SOL for fees and tokens for trading
6. **🌐 Network status** - Verify Solana network and RPC endpoint status
7. **🐛 Report bugs** - Create an issue on GitHub with detailed information

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/SolanaLeeky/perena-trading-bot/issues)
- **Discord**: Join the Perena community for general discussion
- **Documentation**: Comprehensive guides in this README

### Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🎉 Summary

The **Perena Trading Bot** is a comprehensive solution for automated trading on the Perena protocol with:

### ✨ **Key Highlights**

- 🔄 **Multi-wallet parallel trading** for maximum efficiency
- 📱 **Discord webhook integration** for real-time monitoring
- 🎯 **Smart balance management** with strategic token rotation
- 🛡️ **Robust error handling** and automatic recovery
- 📊 **Performance analytics** and detailed reporting
- ⚙️ **Highly configurable** parameters and settings

### 🚀 **Ready to Start?**

1. Clone the repository
2. Configure your `.env` file
3. Set up Discord webhooks (optional)
4. Run `npm start`
5. Monitor via console and Discord

**Happy Trading! 🚀💰**
