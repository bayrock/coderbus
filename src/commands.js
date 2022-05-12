
module.exports = () => {
    const { REST } = require('@discordjs/rest')
    const { Routes } = require('discord-api-types/v10')
    const { SlashCommandBuilder } = require('@discordjs/builders')
    const credentials = require("./credentials.json")

    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('View the command list'),
        new SlashCommandBuilder().setName('repo').setDescription('View the GitHub repo'),
        new SlashCommandBuilder().setName('languages').setDescription('View the supported languages'),
        new SlashCommandBuilder().setName('avatar').setDescription('Avatar command')
                .addMentionableOption(option => option.setName('user').setDescription('Mention a user to grab an avatar').setRequired(false))
                .addStringOption(option => option.setName('id').setDescription('Use an ID to grab an avatar').setRequired(false)),
        new SlashCommandBuilder().setName('fetch').setDescription('Fetch command')
                .addStringOption(option => option.setName('url').setDescription('Enter an API endpoint to fetch').setRequired(true))
                .addBooleanOption(option => option.setName('invisible').setDescription('Toggle the visibility of the response').setRequired(false))
    ].map(command => command.toJSON())

    const rest = new REST({ version: '10' }).setToken(credentials.token)

    rest.put(Routes.applicationGuildCommands(credentials.clientid, credentials.guildid), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error)
}
