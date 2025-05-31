import 'dotenv/config';
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { 
    init, 
    swapExactIn, 
    PRODUCTION_POOLS,
    loadKeypairFromFile
} from "@perena/numeraire-sdk";

// --- Configuration ---
const CONFIG = {
    RPC_URL: process.env.RPC_URL || "",
    PAYER_KEYPAIR_PATH: process.env.KEYPAIR_PATH || "",
    
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
        MAX_ROUNDS: 3000,
        MIN_BALANCE_THRESHOLD: 1,
        SWAP_PERCENTAGE: 0.99,
        SLIPPAGE_TOLERANCE: 0.15,
        CU_LIMIT: 1200000,
        ROUND_DELAY_MS: 18000000, // 5 hours
        OPERATION_DELAY_MS: 3000
    },
    
    // API configuration
    API: {
        PERENA_REWARDS_URL: "https://api.perena.org/api/rewards",
        SESSION_TOKEN: process.env.SESSION_TOKEN || "",
    }
};

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
 * Fetches Perena rewards data with retry logic and better error handling
 * @param {string} publicKey - Wallet public key
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object|null>} Rewards data or null if failed
 */
async function fetchPerenaRewards(publicKey, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
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
                timeout: 10000 // 10 second timeout
            });
            
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
            
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
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
        console.log(`🚀 Starting Perena Trading Bot`);
        console.log(`📅 Started at: ${new Date().toISOString()}`);
        
        // Initialize connection and payer
        const connection = new Connection(CONFIG.RPC_URL, "confirmed");
        const payer = loadKeypairFromFile(CONFIG.PAYER_KEYPAIR_PATH);
        
        console.log(`\n👤 Payer Address: ${payer.publicKey.toBase58()}`);
        
        // Initialize the SDK
        console.log(`\n🔧 Initializing Perena SDK...`);
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
        
        // Fetch initial rewards data
        const initialRewardsData = await fetchPerenaRewards(payer.publicKey.toBase58());
        displayRewardsData(initialRewardsData, "Initial Perena Rewards Data");
        
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
        await runSmartBalanceManagement(connection, payer, TRIPOOL_ADDRESS, sleep);
        
    } catch (error) {
        console.error(`❌ Fatal error in main function:`, error);
        throw error;
    }
}

/**
 * Executes a single swap operation with comprehensive error handling
 * @param {Connection} connection - Solana connection
 * @param {Keypair} payer - Payer keypair
 * @param {PublicKey} poolAddress - Pool address
 * @param {Object} sourceToken - Source token configuration
 * @param {Object} targetToken - Target token configuration
 * @param {number} swapAmount - Amount to swap
 * @returns {Promise<boolean>} Success status
 */
async function executeSwap(connection, payer, poolAddress, sourceToken, targetToken, swapAmount) {
    try {
        console.log(`\n🔄 Attempting to swap ${swapAmount.toFixed(6)} ${sourceToken.name} → ${targetToken.name}...`);
        
        const exactAmountIn = toBaseUnits(swapAmount, sourceToken.decimals);
        const minAmountOut = toBaseUnits(
            swapAmount * (1 - CONFIG.TRADING.SLIPPAGE_TOLERANCE), 
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
        
        return true;
        
    } catch (error) {
        console.error(`❌ Swap failed:`, error.message || error);
        return false;
    }
}

/**
 * Runs the smart balance management system
 * @param {Connection} connection - Solana connection
 * @param {Keypair} payer - Payer keypair
 * @param {PublicKey} poolAddress - Pool address
 * @param {Function} sleep - Sleep function
 */
async function runSmartBalanceManagement(connection, payer, poolAddress, sleep) {
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
                swapAmount
            );
            
            if (swapSuccess) {
                successfulSwaps++;
                lastSwapPair = { from: highestBalanceToken.name, to: randomTarget.name };
                console.log(`📊 Stats: ${successfulSwaps} successful, ${failedSwaps} failed swaps`);
                
                // Wait 2 minutes and check rewards after each successful swap
                console.log(`⏳ Waiting 2 minutes before checking Perena rewards...`);
                await sleep(120000); // 2 minutes = 120,000 ms
                
                // Fetch and display updated rewards data
                const updatedRewardsData = await fetchPerenaRewards(payer.publicKey.toBase58());
                displayRewardsData(updatedRewardsData, "Updated Perena Rewards Data");
                
                // Wait 5 hours before next swap
                console.log(`⏳ Waiting ${CONFIG.TRADING.ROUND_DELAY_MS / 1000 / 60 / 60} hours before next swap...`);
                await sleep(CONFIG.TRADING.ROUND_DELAY_MS);
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
        
        // Fetch and display final rewards data
        const finalRewardsData = await fetchPerenaRewards(payer.publicKey.toBase58());
        displayRewardsData(finalRewardsData, "Final Perena Rewards Data");
        
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
        
        // Display final results
        const connection = new Connection(CONFIG.RPC_URL, "confirmed");
        const payer = loadKeypairFromFile(CONFIG.PAYER_KEYPAIR_PATH);
        await displayFinalResults(connection, payer);
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n✅ Bot execution completed successfully in ${duration.toFixed(2)} seconds`);
        
    } catch (error) {
        console.error(`\n💥 Bot execution failed:`, error);
        console.error(`Stack trace:`, error.stack);
        process.exit(1);
    }
}

// Run the bot with proper error handling
runBot();

