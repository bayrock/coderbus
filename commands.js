
module.exports = () => {
    const { REST } = require('@discordjs/rest')
    const { Routes } = require('discord-api-types/v10')
    const { SlashCommandBuilder } = require('@discordjs/builders')
    const credentials = require("./credentials.json")

    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('Help command'),
    ].map(command => command.toJSON())
    
    const rest = new REST({ version: '10' }).setToken(credentials.token)
    
    rest.put(Routes.applicationGuildCommands(credentials.clientid, credentials.guildid), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error)
        
    // require("./express")() // Initialize the express server for glitch.me
}
