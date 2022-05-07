const luaEnv = require('lua-in-js').createEnv()
const credentials = require("./credentials.json")
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const luaregex = /^```Lua\n(.+)```$/s
client.on('messageCreate', (msg) => {
    const match = msg.content.match(luaregex)
    if(match)
        msg.reply(luaEnv.parse(match[1]).exec())
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return

    if (interaction.commandName === 'help')
        await interaction.reply('This bot is a work in progress..')
})

client.login(credentials.token)

require("./commands")() // Register application commands
