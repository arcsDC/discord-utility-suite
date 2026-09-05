import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { readFileSync } from 'fs';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
if (!token || !clientId) throw new Error('Missing DISCORD_TOKEN or CLIENT_ID');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const rest = new REST({ version: '10' }).setToken(token);

const commands = [
  new SlashCommandBuilder().setName('ban').setDescription('Ban a user').addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a user').addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true)),
  new SlashCommandBuilder().setName('ticket').setDescription('Create a support ticket'),
  new SlashCommandBuilder().setName('poll').setDescription('Start a poll').addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true)).addStringOption(o => o.setName('options').setDescription('Comma-separated options').setRequired(true)),
  new SlashCommandBuilder().setName('remind').setDescription('Set a reminder').addStringOption(o => o.setName('message').setDescription('Reminder text').setRequired(true)).addIntegerOption(o => o.setName('minutes').setDescription('Minutes from now').setRequired(true))
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  await rest.put(Routes.applicationCommands(clientId), { body: commands.map(c => c.toJSON()) });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, options, guild, channel } = interaction;

  if (commandName === 'ban') {
    const user = options.getUser('user');
    const reason = options.getString('reason') || 'No reason';
    if (!interaction.member?.permissions.has('BanMembers')) return interaction.reply({ content: 'Missing permission.', ephemeral: true });
    await user.ban({ reason });
    return interaction.reply(`Banned ${user.tag}`);
  }

  if (commandName === 'kick') {
    const user = options.getUser('user');
    if (!interaction.member?.permissions.has('KickMembers')) return interaction.reply({ content: 'Missing permission.', ephemeral: true });
    await user.kick();
    return interaction.reply(`Kicked ${user.tag}`);
  }

  if (commandName === 'ticket') {
    const ticketChannel = await guild.channels.create({ name: `ticket-${interaction.user.username}`, type: ChannelType.GuildText });
    await ticketChannel.permissionOverwrites.create(interaction.user.id, { ViewChannel: true, SendMessages: true });
    await ticketChannel.permissionOverwrites.create(guild.roles.everyone.id, { ViewChannel: false });
    return interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
  }

  if (commandName === 'poll') {
    const question = options.getString('question');
    const opts = options.getString('options')!.split(',').map(s => s.trim());
    const embed = new EmbedBuilder().setTitle(question).setColor(0x00ae86);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...opts.map((opt, i) => new ButtonBuilder().setCustomId(`poll_${i}`).setLabel(opt).setStyle(ButtonStyle.Secondary))
    );
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (commandName === 'remind') {
    const msg = options.getString('message');
    const mins = options.getInteger('
