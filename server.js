const luaEnv = require('lua-in-js').createEnv()
const credentials = require("./credentials.json")
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const luaregex = /^```Lua\n(.+)```$/si
const prints = `
local prints = {}
function print(msg)
  assert(#prints < 500, string.format("Reached print limit: %d!", #prints))
  table.insert(prints, msg)
end
`
client.on('messageCreate', (msg) => {
  const match = msg.content.match(luaregex)
  if(!match) return
  try {
    const parsed = luaEnv.parse(`${prints} ${match[1]} return table.concat(prints, "\\n")`).exec() || undefined
    if (parsed != undefined)
      msg.reply(parsed)
  } catch (error) {
    msg.reply(error ? `**${error.name}:** ${error.message}` : "Error parsing Lua block!")
    .catch(console.error)
  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return

  if (interaction.commandName === 'help')
    interaction.guild.commands.fetch()
      .then(commands => 
        interaction.reply("**Commands:** \n" + commands.map(command => `/${command.name} [${command.options.map((option) => option.name)}] - ${command.description}`).join("\n")))
      .catch(console.error)

  if (interaction.commandName === 'avatar') {
    const mentioned = interaction.options.getMentionable("user")
    const id = interaction.options.getString("id")
    if (mentioned)
      await interaction.reply(mentioned.user.avatarURL({size: 2048}))
    else if (id)
      client.users.fetch(id).then(user => interaction.reply(user.avatarURL({size: 2048})))
    else
      await interaction.reply(interaction.member.user.avatarURL({size: 2048}))
  }
})

client.login(credentials.token)

require("./commands")() // Register application commands
// require("./express")() // Start Express server (for glitch.me)
