const aplEnv = require('apl')
const schemeEnv = require("biwascheme")
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const { post, fetch } = require("./post")
const credentials = require("./credentials.json")

const piston = []

fetch("https://emkc.org/api/v2/piston/runtimes")
  .then(response => response.json())
  .then(runtime => piston.push(...runtime))
  .catch(console.error)

function firePiston(alias, code) {
  for (const lang of piston) {
    const aliases = [lang.language, ...lang.aliases]
    if (!aliases.includes(alias)) continue

    return post("https://emkc.org/api/v2/piston/execute", {language: lang.language, version: lang.version, files: [{content: code}]})
  }
  return Promise.reject(new Error(`${alias} unsupported!`))
}

function getErrorMessage(error) {
  return error ? `**${error.name}:** ${error.message}` : "Error parsing code block!"
}

const coderegex = /^```(.+?)\n(.+)```$/si

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', (msg) => {
  const match = msg.content.match(coderegex)
  if(!match) return

  const lang = match[1]
  const code = match[2]

  try {
    switch (lang.toLowerCase()) {
        case "lisp":
        case "scheme":
          msg.reply(`**Parsed ${lang}:**\n${schemeEnv.run(code).toString()}`)
          break
        case "apl":
          msg.reply(aplEnv(code).toString())
          break
        default:
          firePiston(lang, code)
            .then(parsed => msg.reply(`**Parsed ${parsed.language} (v${parsed.version}):**\n\`${parsed.run.output || parsed.run.stdout}\``))
            .catch((error) => msg.reply(getErrorMessage(error)))
          break
    }
  } catch (error) {
    msg.reply(getErrorMessage(error))
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
