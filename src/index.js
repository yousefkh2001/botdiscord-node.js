const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { authenticator } = require('otplib');
require('dotenv').config();

// Bot configuration
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Storage for user data
const userData = new Map();

// Rate limiting constants
const MAX_CODES_PER_DAY = 2;
const COOLDOWN_SECONDS = 30;

// Helper function to get or create user data
function getUserData(userId) {
    const today = new Date().toDateString();
    
    if (!userData.has(userId)) {
        userData.set(userId, {
            lastRequest: 0,
            dailyCount: 0,
            lastDate: today
        });
    }
    
    const userInfo = userData.get(userId);
    
    // Reset daily count if it's a new day
    if (userInfo.lastDate !== today) {
        userInfo.dailyCount = 0;
        userInfo.lastDate = today;
    }
    
    return userInfo;
}

// Button interaction handler
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'get_otp_code') {
            const userId = interaction.user.id;
            const currentTime = Date.now() / 1000;
            const userInfo = getUserData(userId);
            
            // Check daily limit
            if (userInfo.dailyCount >= MAX_CODES_PER_DAY) {
                await interaction.reply({
                    content: '⚠️ **Daily limit exceeded!**\n' +
                             `You can only request ${MAX_CODES_PER_DAY} codes per day.\n` +
                             'Try again tomorrow.',
                    ephemeral: true
                });
                return;
            }
            
            // Check cooldown
            const timeSinceLast = currentTime - userInfo.lastRequest;
            if (timeSinceLast < COOLDOWN_SECONDS) {
                const remainingTime = Math.ceil(COOLDOWN_SECONDS - timeSinceLast);
                await interaction.reply({
                    content: '⏱️ **Please wait!**\n' +
                             `You must wait ${remainingTime} seconds before requesting a new code.`,
                    ephemeral: true
                });
                return;
            }
            
            // Generate OTP
            const otpSecret = process.env.OTP_SECRET;
            if (!otpSecret) {
                await interaction.reply({
                    content: '❌ Configuration error: OTP secret not found',
                    ephemeral: true
                });
                return;
            }
            
            const otpCode = authenticator.generate(otpSecret);
            
            // Update user data
            userInfo.lastRequest = currentTime;
            userInfo.dailyCount += 1;
            
            // Calculate remaining time for the code
            const remainingTime = 30 - (Math.floor(currentTime) % 30);
            
            // Create embed for the response
            const embed = new EmbedBuilder()
                .setTitle('🔐 Two-Factor Authentication Code')
                .setDescription(`**Your Code:** \`${otpCode}\``)
                .setColor(0x00ff00)
                .addFields(
                    { name: '⏰ Expires in', value: `${remainingTime} seconds`, inline: true },
                    { name: '📊 Daily Usage', value: `${userInfo.dailyCount}/${MAX_CODES_PER_DAY}`, inline: true },
                    { name: 'ℹ️ Note', value: 'This code is valid for 30 seconds only', inline: false }
                )
                .setFooter({ text: 'Two-Factor Authentication Code - Private & Secure' });
            
            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    } else if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup') {
            // Create the main embed
            const embed = new EmbedBuilder()
                .setTitle('🔐 Auto-Login Guide')
                .setDescription('Auto-Login Guide')
                .setColor(0x2b2d31)
                .addFields(
                    { name: 'Step 1:', value: 'Download AdsPower Browser from [here](https://www.adspower.com/)', inline: false },
                    { name: 'Step 2:', value: 'Login to AdsPower using the provided credentials', inline: false },
                    { name: 'Step 3:', value: 'Click the button below to get your **Authenticator Verification Code** and enter it:', inline: false }
                );
            
            // Create button
            const button = new ButtonBuilder()
                .setCustomId('get_otp_code')
                .setLabel('Click to Get Code!')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔐');
            
            const row = new ActionRowBuilder()
                .addComponents(button);
            
            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        } else if (interaction.commandName === 'status') {
            const userId = interaction.user.id;
            const userInfo = getUserData(userId);
            
            // Calculate cooldown remaining
            const currentTime = Date.now() / 1000;
            const timeSinceLast = currentTime - userInfo.lastRequest;
            const cooldownRemaining = Math.max(0, Math.ceil(COOLDOWN_SECONDS - timeSinceLast));
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Usage Status')
                .setColor(0x0099ff)
                .addFields(
                    { name: 'Daily Usage', value: `${userInfo.dailyCount}/${MAX_CODES_PER_DAY}`, inline: true },
                    { name: 'Cooldown Remaining', value: cooldownRemaining > 0 ? `${cooldownRemaining} seconds` : 'Ready to use', inline: true }
                );
            
            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }
    }
});

// Bot ready event
client.on('ready', async () => {
    console.log(`${client.user.tag} has logged into Discord!`);
    console.log(`Bot ID: ${client.user.id}`);
    
    // Register slash commands
    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Setup Two-Factor Authentication system'),
        new SlashCommandBuilder()
            .setName('status')
            .setDescription('Show current usage status')
    ];
    
    try {
        console.log('Started refreshing application (/) commands.');
        await client.application.commands.set(commands);
        console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// Error handling
client.on('error', console.error);

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ Error: Bot token not found in environment variables');
    process.exit(1);
}

client.login(token);