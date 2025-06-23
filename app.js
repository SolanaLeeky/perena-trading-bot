import 'dotenv/config';
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { 
    init, 
    swapExactIn, 
    PRODUCTION_POOLS
} from "@perena/numeraire-sdk";
import bs58 from "bs58";
import axios from "axios";

// --- Configuration ---
const CONFIG = {
    RPC_URL: process.env.RPC_URL || "",
    PRIVATE_KEYS_BASE58: process.env.PRIVATE_KEYS_BASE58 || "", // Comma-separated base58 private keys
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || "", // Discord webhook URL for notifications
    DISCORD_ENABLED: process.env.DISCORD_ENABLED === "true" || false, // Enable/disable Discord notifications
    
    // Token configurations
    TOKENS: {
        USDC: {
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
            programId: TOKEN_PROGRAM_ID
        },
        USDT: {
            mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            decimals: 6,
            programId: TOKEN_PROGRAM_ID
        },
        PYUSD: {
            mint: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
            decimals: 6,
            programId: TOKEN_2022_PROGRAM_ID
        },
        "USD*": {
            mint: "BenJy1n3WTx9mTjEvy63e8Q1j4RqUc6E4VBMz3ir4Wo6",
            decimals: 6,
            programId: TOKEN_PROGRAM_ID
        }
    },
    
    // Trading parameters
    TRADING: {
        MAX_ROUNDS: Number.MAX_SAFE_INTEGER,
        MIN_BALANCE_THRESHOLD: 1,
        SWAP_PERCENTAGE: 0.75, // Reduced to 75% to leave adequate buffer for fees, slippage, and real-time balance changes
        SLIPPAGE_TOLERANCE: 0.15,
        CU_LIMIT: 1200000,
        ROUND_DELAY_MS: 18000000, // 5 hours
        OPERATION_DELAY_MS: 3000
    },
    
    // API configuration
    API: {
        PERENA_REWARDS_URL: "https://api.perena.org/api/rewards",
        SESSION_TOKEN: process.env.SESSION_TOKEN || "",
        MIN_REQUEST_INTERVAL_MS: 60000, // Minimum 1 minute between API calls
    }
};

// --- Rate Limiting ---
let lastApiCallTime = 0;

// --- Discord Webhook Functions ---
/**
 * Sends a notification to Discord webhook with console log formatting
 * @param {string} message - Console log message to send
 * @param {number} walletIndex - Wallet index (optional)
 */
async function sendDiscordNotification(message, walletIndex = null) {
    if (!CONFIG.DISCORD_ENABLED || !CONFIG.DISCORD_WEBHOOK_URL) {
        return;
    }

    try {
        const walletPrefix = walletIndex !== null ? `[Wallet ${walletIndex}] ` : '';
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const formattedMessage = `\`\`\`\n${walletPrefix}${message}\n\`\`\``;
        
        await axios.post(CONFIG.DISCORD_WEBHOOK_URL, {
            content: formattedMessage
        });
    } catch (error) {
        console.error(`❌ Failed to send Discord notification:`, error.message);
    }
}

/**
 * Sends trading summary to Discord with console log formatting
 * @param {Object} summary - Trading summary data
 */
async function sendTradingSummary(summary) {
    if (!CONFIG.DISCORD_ENABLED || !CONFIG.DISCORD_WEBHOOK_URL) {
        return;
    }

    try {
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const summaryMessage = `\`\`\`\n[${timestamp}] [Wallet ${summary.walletIndex}] 📈 Smart Balance Management Complete\n[${timestamp}] [Wallet ${summary.walletIndex}] ✅ Successful swaps: ${summary.successfulSwaps}\n[${timestamp}] [Wallet ${summary.walletIndex}] ❌ Failed swaps: ${summary.failedSwaps}\n[${timestamp}] [Wallet ${summary.walletIndex}] 📊 Success Rate: ${summary.successRate}%\n[${timestamp}] [Wallet ${summary.walletIndex}] 🏦 Address: ${summary.walletAddress}\n\`\`\``;
        
        await axios.post(CONFIG.DISCORD_WEBHOOK_URL, {
            content: summaryMessage
        });
    } catch (error) {
        console.error(`❌ Failed to send Discord trading summary:`, error.message);
    }
}

/**
 * Creates a Keypair from a base58 encoded private key
 * @param {string} base58PrivateKey - Base58 encoded private key
 * @returns {Keypair} Solana Keypair
 */
function loadKeypairFromBase58(base58PrivateKey) {
    if (!base58PrivateKey) {
        throw new Error("Private key is required. Set PRIVATE_KEYS_BASE58 environment variable.");
    }
    
    try {
        const privateKeyBytes = bs58.decode(base58PrivateKey);
        return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
        throw new Error(`Invalid base58 private key: ${error.message}`);
    }
}

/**
 * Loads multiple keypairs from comma-separated base58 private keys
 * @param {string} privateKeysString - Comma-separated base58 private keys
 * @returns {Keypair[]} Array of Solana Keypairs
 */
function loadMultipleKeypairs(privateKeysString) {
    if (!privateKeysString) {
        throw new Error("Private keys are required. Set PRIVATE_KEYS_BASE58 environment variable.");
    }
    
    const privateKeys = privateKeysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
    
    if (privateKeys.length === 0) {
        throw new Error("No valid private keys found in PRIVATE_KEYS_BASE58.");
    }
    
    console.log(`🔑 Loading ${privateKeys.length} wallet(s)...`);
    
    return privateKeys.map((privateKey, index) => {
        try {
            const keypair = loadKeypairFromBase58(privateKey);
            console.log(`✅ Wallet ${index + 1}: ${keypair.publicKey.toBase58()}`);
            return keypair;
        } catch (error) {
            throw new Error(`Failed to load wallet ${index + 1}: ${error.message}`);
        }
    });
}

/**
 * Enforces rate limiting by ensuring minimum time between API calls
 * @param {number} minInterval - Minimum interval in milliseconds
 */
async function enforceRateLimit(minInterval = CONFIG.API.MIN_REQUEST_INTERVAL_MS) {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    
    if (timeSinceLastCall < minInterval) {
        const waitTime = minInterval - timeSinceLastCall;
        console.log(`🛡️ Rate limiting: waiting ${Math.round(waitTime)}ms before next API call...`);
        await sleep(waitTime);
    }
    
    lastApiCallTime = Date.now();
}

// --- Utility Functions ---

// Sleep function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Converts a decimal amount to base units (BigInt)
 * @param {number} amount - The decimal amount
 * @param {number} decimals - Number of decimal places
 * @returns {BigInt} The amount in base units
 */
const toBaseUnits = (amount, decimals) => {
    if (typeof amount !== 'number' || amount < 0) {
        throw new Error(`Invalid amount: ${amount}`);
    }
    if (typeof decimals !== 'number' || decimals < 0) {
        throw new Error(`Invalid decimals: ${decimals}`);
    }
    return BigInt(Math.floor(amount * (10 ** decimals)));
};

/**
 * Converts base units to decimal amount
 * @param {BigInt|string|number} amount - The amount in base units
 * @param {number} decimals - Number of decimal places
 * @returns {number} The decimal amount
 */
const fromBaseUnits = (amount, decimals) => {
    if (typeof decimals !== 'number' || decimals < 0) {
        throw new Error(`Invalid decimals: ${decimals}`);
    }
    return Number(amount) / (10 ** decimals);
};

/**
 * Gets token configuration by name or mint address
 * @param {string} identifier - Token name or mint address
 * @returns {Object|null} Token configuration or null if not found
 */
const getTokenConfig = (identifier) => {
    // Check by name first
    if (CONFIG.TOKENS[identifier]) {
        return { name: identifier, ...CONFIG.TOKENS[identifier] };
    }
    
    // Check by mint address
    for (const [name, config] of Object.entries(CONFIG.TOKENS)) {
        if (config.mint === identifier) {
            return { name, ...config };
        }
    }
    
    return null;
};

/**
 * Checks token balance with improved error handling and caching
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} walletAddress - Wallet public key
 * @param {string} tokenIdentifier - Token name or mint address
 * @returns {Promise<Object>} Balance information
 */
async function checkTokenBalance(connection, walletAddress, tokenIdentifier) {
    const tokenConfig = getTokenConfig(tokenIdentifier);
    if (!tokenConfig) {
        throw new Error(`Unknown token: ${tokenIdentifier}`);
    }
    
    const { mint, decimals, programId } = tokenConfig;
    
    try {
        const tokenAccountAddress = await getAssociatedTokenAddress(
            new PublicKey(mint),
            walletAddress,
            false,
            programId
        );
        
        const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
        if (!accountInfo) {
            return {
                balance: BigInt(0),
                readableBalance: 0,
                tokenAccount: tokenAccountAddress
            };
        }
        
        const tokenAccount = await connection.getTokenAccountBalance(tokenAccountAddress);
        const balance = BigInt(tokenAccount.value.amount);
        const readableBalance = fromBaseUnits(balance, decimals);
        
        return { 
            balance, 
            readableBalance, 
            tokenAccount: tokenAccountAddress,
            decimals
        };
    } catch (error) {
        console.warn(`⚠️ Could not fetch balance for ${tokenConfig.name}:`, error.message);
        return { balance: 0n, readableBalance: 0, error: error.message };
    }
}

/**
 * Ensures a token account exists for the given token
 * @param {Connection} connection - Solana connection
 * @param {Keypair} payer - Payer keypair
 * @param {string} tokenIdentifier - Token name or mint address
 * @returns {Promise<PublicKey>} Token account address
 */
async function ensureTokenAccount(connection, payer, tokenIdentifier) {
    const tokenConfig = getTokenConfig(tokenIdentifier);
    if (!tokenConfig) {
        throw new Error(`Unknown token: ${tokenIdentifier}`);
    }
    
    const { name, mint, programId } = tokenConfig;
    
    try {
        const tokenAccountAddress = await getAssociatedTokenAddress(
            new PublicKey(mint),
            payer.publicKey,
            false,
            programId
        );
        
        const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
        if (accountInfo) {
            console.log(`✅ Token account already exists for ${name}`);
            return tokenAccountAddress;
        }
        
        console.log(`🔨 Creating token account for ${name}...`);
        const instruction = createAssociatedTokenAccountInstruction(
            payer.publicKey,
            tokenAccountAddress,
            payer.publicKey,
            new PublicKey(mint),
            programId
        );
        
        const transaction = new Transaction().add(instruction);
        const signature = await connection.sendTransaction(transaction, [payer]);
        await connection.confirmTransaction(signature);
        console.log(`✅ Token account created for ${name}. Signature: ${signature}`);
        
        return tokenAccountAddress;
    } catch (error) {
        console.error(`❌ Failed to ensure token account for ${name}:`, error.message);
        throw error;
    }
}

/**
 * Fetches Perena rewards data with enhanced rate limiting and retry logic
 * @param {string} publicKey - Wallet public key
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object|null>} Rewards data or null if failed
 */
async function fetchPerenaRewards(publicKey, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Enforce rate limiting before making API call
            await enforceRateLimit();
            
            console.log(`🔄 Fetching Perena rewards data (attempt ${attempt}/${retries})...`);
            
            const response = await fetch(CONFIG.API.PERENA_REWARDS_URL, {
                method: "POST",
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "content-type": "application/json",
                    "x-session-token": CONFIG.API.SESSION_TOKEN,
                    "Referer": "https://app.perena.org/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                body: JSON.stringify({ publicKey }),
                timeout: 15000 // Increased to 15 second timeout
            });
            
            // Handle rate limiting specifically
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                const baseDelay = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30 seconds
                const jitteredDelay = baseDelay + (Math.random() * 10000); // Add 0-10s jitter
                
                console.log(`Server responded with 429 Too Many Requests. Retrying after ${Math.round(jitteredDelay)}ms delay...`);
                
                if (attempt < retries) {
                    await sleep(jitteredDelay);
                    continue;
                } else {
                    throw new Error(`Rate limited after ${retries} attempts`);
                }
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Successfully fetched Perena rewards data`);
            return data;
            
        } catch (error) {
            console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
            
            if (attempt === retries) {
                console.error(`❌ Failed to fetch Perena rewards after ${retries} attempts`);
                return null;
            }
            
            // Enhanced retry logic with longer delays for rate limiting
            let delay;
            if (error.message.includes('429') || error.message.includes('Rate limited')) {
                // For rate limiting, use longer delays
                delay = Math.min(30000 + (attempt * 15000), 120000); // 30s, 45s, 60s, max 2 minutes
            } else {
                // For other errors, use exponential backoff
                delay = Math.min(Math.pow(2, attempt) * 2000, 30000); // 4s, 8s, 16s, max 30s
            }
            
            console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
            await sleep(delay);
        }
    }
}

/**
 * Displays rewards data in a formatted way
 * @param {Object} rewardsData - Rewards data from API
 * @param {string} title - Title for the display
 */
function displayRewardsData(rewardsData, title) {
    console.log(`\n=== ${title} ===`);
    
    if (!rewardsData || !rewardsData.preseason1RewardsData) {
        console.log(`❌ No rewards data available`);
        return;
    }
    
    const data = rewardsData.preseason1RewardsData;
    console.log(`🏆 Preseason 1 Total Points: ${data.totalPoints}`);
    console.log(`📊 Total Swap Volume: ${data.totalSwapVolume}`);
    console.log(`🏅 Rank: ${data.rank} (${data.rankPercentile}th percentile)`);
    
    if (data.defiPoints && data.defiPoints.length > 0) {
        console.log(`\n💎 DeFi Points:`);
        data.defiPoints.forEach(defi => {
            console.log(`  - ${defi.name}: ${defi.points} points`);
        });
    }
}

/**
 * Gets all token balances
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} walletAddress - Wallet public key
 * @returns {Promise<Object>} Object containing all token balances
 */
async function getAllTokenBalances(connection, walletAddress) {
    const balances = {};
    
    for (const [tokenName] of Object.entries(CONFIG.TOKENS)) {
        try {
            balances[tokenName] = await checkTokenBalance(connection, walletAddress, tokenName);
        } catch (error) {
            console.error(`❌ Failed to get ${tokenName} balance:`, error.message);
            balances[tokenName] = { balance: 0n, readableBalance: 0, error: error.message };
        }
    }
    
    return balances;
}

/**
 * Displays token balances in a formatted way
 * @param {Object} balances - Token balances object
 * @param {string} title - Title for the display
 */
function displayTokenBalances(balances, title) {
    console.log(`\n=== ${title} ===`);
    
    for (const [tokenName, balance] of Object.entries(balances)) {
        const status = balance.error ? '❌' : '✅';
        const amount = balance.error ? 'Error' : balance.readableBalance.toFixed(6);
        console.log(`${status} ${tokenName}: ${amount}`);
    }
}

/**
 * Main async function to run operations
 */
async function main() {
    try {
        console.log(`🚀 Starting Perena Multi-Wallet Trading Bot`);
        console.log(`📅 Started at: ${new Date().toISOString()}`);
        
        // Initialize connection and load multiple wallets
        const connection = new Connection(CONFIG.RPC_URL, "confirmed");
        const wallets = loadMultipleKeypairs(CONFIG.PRIVATE_KEYS_BASE58);
        
        console.log(`\n🎯 Loaded ${wallets.length} wallet(s) for trading`);
        
        // Send Discord notification for bot startup
        await sendDiscordNotification(
            `🚀 Bot Started - Loaded ${wallets.length} wallet(s) for trading`
        );
        
        // Run trading for all wallets concurrently (SDK re-initialization handles conflicts)
        const tradingPromises = wallets.map((wallet, index) => 
            runWalletTrading(wallet, connection, index + 1)
                .catch(error => {
                    console.error(`❌ Wallet ${index + 1} failed:`, error.message);
                    // Send Discord notification for wallet failure
                    sendDiscordNotification(
                        `❌ Wallet ${index + 1} trading failed: ${error.message}`,
                        index + 1
                    );
                    return null; // Continue with other wallets
                })
        );
        
        console.log(`\n🔄 Starting concurrent trading for all wallets...`);
        await Promise.allSettled(tradingPromises);
        
        console.log(`\n✅ All wallet trading sessions completed`);
        
        // Send Discord notification for completion
        await sendDiscordNotification(
            `✅ All trading sessions completed at ${new Date().toISOString()}`
        );
        
    } catch (error) {
        console.error(`❌ Fatal error in main function:`, error);
        // Send Discord notification for fatal error
        await sendDiscordNotification(
            `💥 **Fatal Error**\n❌ Critical failure in main function\n🔍 Error: ${error.message}\n🛑 Bot execution stopped`,
            'error'
        );
        throw error;
    }
}

/**
 * Main async function to run operations for a single wallet
 * @param {Keypair} payer - Wallet keypair
 * @param {Connection} connection - Solana connection
 * @param {number} walletIndex - Index of the wallet for logging
 */
async function runWalletTrading(payer, connection, walletIndex) {
    const startTime = Date.now();
    let swapStats = { total: 0, successful: 0, failed: 0 };
    
    try {
        console.log(`\n🚀 Starting Trading for Wallet ${walletIndex}`);
        console.log(`👤 Wallet ${walletIndex} Address: ${payer.publicKey.toBase58()}`);
        
        // Send Discord notification for wallet initialization
        await sendDiscordNotification(
            `🚀 Wallet ${walletIndex} started - Address: ${payer.publicKey.toBase58()}`,
            walletIndex
        );
        
        // Initialize the SDK for this wallet
        console.log(`🔧 Initializing Perena SDK for Wallet ${walletIndex}...`);
        init({ 
            payer: payer, 
            connection: connection,
            applyD: false
        });
        
        // Validate tripool availability
        if (!PRODUCTION_POOLS || !PRODUCTION_POOLS.tripool) {
            throw new Error("PRODUCTION_POOLS.tripool is not defined in the SDK. Please check your SDK version.");
        }
        
        const TRIPOOL_ADDRESS = new PublicKey(PRODUCTION_POOLS.tripool);
        console.log(`✅ Using Tripool Address: ${TRIPOOL_ADDRESS.toBase58()}`);
        
        // Fetch initial rewards data with error handling
        try {
            const initialRewardsData = await fetchPerenaRewards(payer.publicKey.toBase58());
            if (initialRewardsData) {
                displayRewardsData(initialRewardsData, "Initial Perena Rewards Data");
            } else {
                console.log(`⚠️ Could not fetch initial rewards data, continuing with trading...`);
            }
        } catch (error) {
            console.warn(`⚠️ Error fetching initial rewards data: ${error.message}`);
            console.log(`🔄 Continuing with trading operations...`);
        }
        
        // Check initial balances
        const initialBalances = await getAllTokenBalances(connection, payer.publicKey);
        displayTokenBalances(initialBalances, "Initial Token Balances");
        
        // Ensure all token accounts exist
        console.log(`\n🔧 Ensuring Token Accounts...`);
        for (const tokenName of Object.keys(CONFIG.TOKENS)) {
            await ensureTokenAccount(connection, payer, tokenName);
        }

        // Sleep function is now globally defined
        
        // Smart balance management with improved logic
        await runSmartBalanceManagement(connection, payer, TRIPOOL_ADDRESS, sleep, walletIndex);
        
    } catch (error) {
        console.error(`❌ Fatal error in main function:`, error);
        throw error;
    }
}

/**
 * Executes a single swap operation with basic error handling
 * @param {Connection} connection - Solana connection
 * @param {Keypair} payer - Payer keypair
 * @param {PublicKey} poolAddress - Pool address
 * @param {Object} sourceToken - Source token configuration
 * @param {Object} targetToken - Target token configuration
 * @param {number} swapAmount - Amount to swap
 * @param {number} walletIndex - Wallet index for Discord notifications
 * @returns {Promise<boolean>} Success status
 */
async function executeSwap(connection, payer, poolAddress, sourceToken, targetToken, swapAmount, walletIndex = null) {
    try {
        console.log(`\n🔄 Attempting to swap ${swapAmount.toFixed(6)} ${sourceToken.name} → ${targetToken.name}...`);
        
        // Fetch fresh balance data before swap to ensure accuracy
        console.log(`📊 Fetching fresh balance data before swap...`);
        const freshBalances = await getAllTokenBalances(connection, payer.publicKey);
        const currentSourceBalance = freshBalances[sourceToken.name];
        
        if (currentSourceBalance.error) {
            throw new Error(`Failed to fetch current ${sourceToken.name} balance: ${currentSourceBalance.error}`);
        }
        
        const actualBalance = currentSourceBalance.readableBalance;
        console.log(`💰 Fresh ${sourceToken.name} balance: ${actualBalance.toFixed(6)}`);
        
        // Validate swap amount against fresh balance with safety buffer
        const maxSafeAmount = actualBalance * 0.95; // 95% of actual balance for extra safety
        const finalSwapAmount = Math.min(swapAmount, maxSafeAmount);
        
        if (finalSwapAmount <= 0) {
            throw new Error(`Insufficient balance: requested ${swapAmount.toFixed(6)}, available ${actualBalance.toFixed(6)}`);
        }
        
        if (finalSwapAmount < swapAmount) {
            console.log(`⚠️ Adjusted swap amount from ${swapAmount.toFixed(6)} to ${finalSwapAmount.toFixed(6)} based on fresh balance`);
        }
        
        const exactAmountIn = toBaseUnits(finalSwapAmount, sourceToken.decimals);
        const minAmountOut = toBaseUnits(
            finalSwapAmount * (1 - CONFIG.TRADING.SLIPPAGE_TOLERANCE), 
            targetToken.decimals
        );
        
        const { call: swapCall } = await swapExactIn({
            pool: poolAddress,
            in: sourceToken.mint,
            out: targetToken.mint,
            exactAmountIn: Number(exactAmountIn),
            minAmountOut: Number(minAmountOut),
            cuLimit: CONFIG.TRADING.CU_LIMIT,
        });
        
        const signature = await swapCall.rpc();
        console.log(`✅ Swap successful! Signature: ${signature}`);
        
        // Send Discord notification for successful swap
        await sendDiscordNotification(
            `✅ Swap successful! ${finalSwapAmount.toFixed(6)} ${sourceToken.name} → ${targetToken.name} | Signature: ${signature}`,
            walletIndex
        );
        
        return true;
        
    } catch (error) {
        const errorMessage = error.message || error.toString();
        console.error(`❌ Swap failed:`, errorMessage);
        
        // Send Discord notification for failed swap
        await sendDiscordNotification(
            `❌ Swap failed: ${sourceToken.name} → ${targetToken.name} - ${errorMessage}`,
            walletIndex
        );
        
        return false;
    }
}

/**
 * Runs the smart balance management system
 * @param {Connection} connection - Solana connection
 * @param {Keypair} payer - Payer keypair
 * @param {PublicKey} poolAddress - Pool address
 * @param {Function} sleep - Sleep function
 * @param {number} walletIndex - Wallet index for Discord notifications
 */
async function runSmartBalanceManagement(connection, payer, poolAddress, sleep, walletIndex) {
    console.log(`\n🤖 Starting Smart Balance Management System`);
    console.log(`📊 Max Rounds: ${CONFIG.TRADING.MAX_ROUNDS}`);
    console.log(`💰 Min Balance Threshold: ${CONFIG.TRADING.MIN_BALANCE_THRESHOLD}`);
    console.log(`📈 Swap Percentage: ${(CONFIG.TRADING.SWAP_PERCENTAGE * 100).toFixed(1)}%`);
    
    let lastSwapPair = null;
    let successfulSwaps = 0;
    let failedSwaps = 0;
    
    for (let round = 1; round <= CONFIG.TRADING.MAX_ROUNDS; round++) {
        console.log(`\n=== Balance Management Round ${round}/${CONFIG.TRADING.MAX_ROUNDS} ===`);
        
        try {
            // Get current balances
            const currentBalances = await getAllTokenBalances(connection, payer.publicKey);
            
            // Display current balances in a compact format
            const balanceStr = Object.entries(currentBalances)
                .map(([name, bal]) => `${name}: ${bal.readableBalance.toFixed(4)}`)
                .join(', ');
            console.log(`💰 Current: ${balanceStr}`);
            
            // Convert to array format for processing
            const balanceArray = Object.entries(currentBalances)
                .filter(([_, balance]) => !balance.error)
                .map(([name, balance]) => ({
                    name,
                    balance: balance.readableBalance,
                    mint: CONFIG.TOKENS[name].mint,
                    decimals: CONFIG.TOKENS[name].decimals
                }));
            
            if (balanceArray.length === 0) {
                console.log(`❌ No valid token balances found`);
                break;
            }
            
            // Find highest balance token
            const highestBalanceToken = balanceArray.reduce((max, token) => 
                token.balance > max.balance ? token : max
            );
            
            if (highestBalanceToken.balance <= CONFIG.TRADING.MIN_BALANCE_THRESHOLD) {
                console.log(`💡 No token exceeds threshold. Highest: ${highestBalanceToken.name} (${highestBalanceToken.balance.toFixed(6)})`);
                break;
            }
            
            console.log(`🎯 Highest balance: ${highestBalanceToken.name} (${highestBalanceToken.balance.toFixed(6)})`);
            
            // Select target tokens (excluding source and preventing reverse swaps)
            let targetTokens = balanceArray.filter(token => token.name !== highestBalanceToken.name);
            
            if (lastSwapPair && lastSwapPair.to === highestBalanceToken.name) {
                targetTokens = targetTokens.filter(token => token.name !== lastSwapPair.from);
                console.log(`🚫 Preventing reverse swap back to ${lastSwapPair.from}`);
            }
            
            if (targetTokens.length === 0) {
                console.log(`⚠️ No valid target tokens available`);
                break;
            }
            
            // Select random target
            const randomTarget = targetTokens[Math.floor(Math.random() * targetTokens.length)];
            const swapAmount = highestBalanceToken.balance * CONFIG.TRADING.SWAP_PERCENTAGE;
            
            // Execute swap
            const swapSuccess = await executeSwap(
                connection, 
                payer, 
                poolAddress, 
                highestBalanceToken, 
                randomTarget, 
                swapAmount,
                walletIndex
            );
            
            if (swapSuccess) {
                successfulSwaps++;
                lastSwapPair = { from: highestBalanceToken.name, to: randomTarget.name };
                console.log(`📊 Stats: ${successfulSwaps} successful, ${failedSwaps} failed swaps`);
                
                // Wait 5 minutes and check rewards after each successful swap (reduced frequency)
                console.log(`⏳ Waiting 5 minutes before checking Perena rewards...`);
                await sleep(300000); // 5 minutes = 300,000 ms
                
                // Fetch and display updated rewards data with error handling
                try {
                    const updatedRewardsData = await fetchPerenaRewards(payer.publicKey.toBase58());
                    if (updatedRewardsData) {
                        displayRewardsData(updatedRewardsData, "Updated Perena Rewards Data");
                        
                        // Send Discord notification for updated rewards with data
                        const data = updatedRewardsData.preseason1RewardsData;
                        let rewardsMessage = `📊 Updated Perena Rewards Data:\n🏆 Total Points: ${data.totalPoints}\n📊 Swap Volume: ${data.totalSwapVolume}\n🏅 Rank: ${data.rank} (${data.rankPercentile}th percentile)`;
                        
                        if (data.defiPoints && data.defiPoints.length > 0) {
                            rewardsMessage += `\n💎 DeFi Points: ${data.defiPoints.map(defi => `${defi.name}: ${defi.points}`).join(', ')}`;
                        }
                        
                        await sendDiscordNotification(
                            rewardsMessage,
                            walletIndex
                        );
                    } else {
                        console.log(`⚠️ Could not fetch updated rewards data, continuing with trading...`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error fetching rewards data: ${error.message}`);
                }
                
                // Wait random 3-5 hours before next swap
                const minHours = 3;
                const maxHours = 5;
                const randomHours = minHours + Math.random() * (maxHours - minHours);
                const randomDelayMs = randomHours * 60 * 60 * 1000;
                console.log(`⏳ Waiting ${randomHours.toFixed(2)} hours before next swap...`);
                
                // Send Discord notification for waiting period
                await sendDiscordNotification(
                    `⏳ Waiting ${randomHours.toFixed(2)} hours before next swap...`,
                    walletIndex
                );
                
                await sleep(randomDelayMs);
                
            } else {
                failedSwaps++;
                
                // Wait before next operation for failed swaps
                console.log(`⏳ Waiting ${CONFIG.TRADING.OPERATION_DELAY_MS}ms before next operation...`);
                await sleep(CONFIG.TRADING.OPERATION_DELAY_MS);
            }
            
        } catch (error) {
            console.error(`❌ Error in round ${round}:`, error.message);
            failedSwaps++;
        }
    }
    
    console.log(`\n📈 Smart Balance Management Complete`);
    console.log(`✅ Successful swaps: ${successfulSwaps}`);
    console.log(`❌ Failed swaps: ${failedSwaps}`);
    
    // Send Discord trading session summary
    await sendTradingSummary({
        walletIndex,
        walletAddress: payer.publicKey.toBase58(),
        totalRounds: CONFIG.TRADING.MAX_ROUNDS,
        successfulSwaps,
        failedSwaps,
        successRate: successfulSwaps + failedSwaps > 0 ? ((successfulSwaps / (successfulSwaps + failedSwaps)) * 100).toFixed(1) : '0'
    });
}
/**
 * Displays final results and cleanup
 * @param {Connection} connection - Solana connection
 * @param {Keypair} payer - Payer keypair
 */
async function displayFinalResults(connection, payer) {
    try {
        // Final balance check
        const finalBalances = await getAllTokenBalances(connection, payer.publicKey);
        displayTokenBalances(finalBalances, "Final Token Balances");
        
        // Fetch and display final rewards data with error handling
        try {
            const finalRewardsData = await fetchPerenaRewards(payer.publicKey.toBase58());
            if (finalRewardsData) {
                displayRewardsData(finalRewardsData, "Final Perena Rewards Data");
            } else {
                console.log(`⚠️ Could not fetch final rewards data`);
            }
        } catch (error) {
            console.warn(`⚠️ Error fetching final rewards data: ${error.message}`);
        }
        
        // Summary
        console.log(`\n🎉 Trading session completed at: ${new Date().toISOString()}`);
        
    } catch (error) {
        console.error(`❌ Error displaying final results:`, error.message);
    }
}

// Enhanced main execution with better error handling
async function runBot() {
    const startTime = Date.now();
    
    try {
        await main();
        
        // Display final results for all wallets
        console.log(`\n📊 Displaying final results for all wallets...`);
        const connection = new Connection(CONFIG.RPC_URL, "confirmed");
        const wallets = loadMultipleKeypairs(CONFIG.PRIVATE_KEYS_BASE58);
        
        for (let i = 0; i < wallets.length; i++) {
            console.log(`\n=== Final Results for Wallet ${i + 1} ===`);
            try {
                await displayFinalResults(connection, wallets[i]);
            } catch (error) {
                console.error(`❌ Error displaying results for Wallet ${i + 1}:`, error.message);
            }
        }
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n✅ Multi-wallet bot execution completed successfully in ${duration.toFixed(2)} seconds`);
        
    } catch (error) {
        console.error(`\n💥 Bot execution failed:`, error);
        console.error(`Stack trace:`, error.stack);
        process.exit(1);
    }
}

// Run the bot with proper error handling
runBot();

