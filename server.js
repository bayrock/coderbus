const luaEnv = require('lua-in-js').createEnv()
const jsSandbox = require('sandbox')
var schemeEnv = require("biwascheme")
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const credentials = require("./credentials.json")

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const coderegex = /^```(Lua|JS|Scheme|Lisp)\n(.+)```$/si
const prints = `
local prints = {}
function print(msg)
  assert(#prints < 500, string.format("Reached print limit: %d!", #prints))
  table.insert(prints, msg)
end
`

const jsEnv = new jsSandbox()
jsEnv.on('message', console.log)

client.on('messageCreate', (msg) => {
  const match = msg.content.match(coderegex)
  if(!match) return

  const lang = match[1]
  const code = match[2]

  try {
    switch (lang.toLowerCase()) {
      case "lua":
        const parsed = luaEnv.parse(`${prints} ${code} return table.concat(prints, "\\n")`).exec() || undefined
        if (parsed != undefined)
          msg.reply(parsed)
        break
      case "js":
        jsEnv.run(code, (parsed) => {
          msg.reply(parsed.console.join("\n")).catch(console.error) 
        })
        break
        case "lisp":
        case "scheme":
          msg.reply(schemeEnv.run(code).toString())
          break
      default:
        return "Language not supported!"
    }
  } catch (error) {
    msg.reply(error ? `**${error.name}:** ${error.message}` : "Error parsing code block!")
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

  if (interaction.commandName === 'fetch') {
    const url = interaction.options.getString("url")
    if (!url) return interaction.reply("URL not found!")

    const response = await fetch(url)
    const data = await response.json()
    await interaction.reply(`\`\`\`json\n${JSON.stringify(data[0] ? data[0] : data, null, 2)}\n\`\`\``)
  }
})

client.login(credentials.token)

require("./commands")() // Register application commands
// require("./express")() // Start Express server (for glitch.me)
