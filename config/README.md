# Configuration Directory

This directory contains sensitive configuration files that are **NOT** tracked by Git.

## Required Files

### `keypair.json`

Your Solana wallet keypair in JSON format. This file should contain an array of 64 numbers representing your private key.

**Example structure:**

```json
[
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
  42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63, 64
]
```

**⚠️ SECURITY WARNING:**

- **NEVER** commit this file to version control
- **NEVER** share this file with anyone
- **ALWAYS** keep backups in a secure location
- This file contains your private key and gives full access to your wallet

## How to Generate a Keypair

### Option 1: Using Solana CLI

```bash
# Install Solana CLI if not already installed
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Generate a new keypair
solana-keygen new --outfile ./config/keypair.json
```

### Option 2: Using Phantom/Solflare Wallet

1. Export your private key from your wallet
2. Convert it to the JSON array format
3. Save as `keypair.json` in this directory

### Option 3: Using Node.js Script

```javascript
import { Keypair } from "@solana/web3.js";
import fs from "fs";

// Generate new keypair
const keypair = Keypair.generate();

// Save to file
fs.writeFileSync(
  "./config/keypair.json",
  JSON.stringify(Array.from(keypair.secretKey))
);

console.log("Keypair generated and saved to ./config/keypair.json");
console.log("Public key:", keypair.publicKey.toString());
```

## File Permissions

On Unix-like systems, ensure proper file permissions:

```bash
chmod 600 ./config/keypair.json
```

## Backup Strategy

1. **Multiple Locations**: Store copies in different secure locations
2. **Encrypted Storage**: Use encrypted drives or password managers
3. **Physical Backup**: Consider writing down the seed phrase
4. **Test Recovery**: Regularly test that you can restore from backups

## Troubleshooting

### "Keypair file not found" Error

- Ensure the file exists at `./config/keypair.json`
- Check file permissions
- Verify the file contains valid JSON array

### "Invalid keypair format" Error

- Ensure the file contains exactly 64 numbers
- Check that it's a valid JSON array
- Verify no extra characters or formatting

### "Insufficient funds" Error

- Ensure your wallet has SOL for transaction fees
- Check that you have the tokens you want to trade
- Verify you're connected to the correct network (mainnet)

---

**Remember**: Your private key is like your bank account password. Keep it safe! 🔐
