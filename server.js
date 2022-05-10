const aplEnv = require('apl')
const schemeEnv = require("biwascheme")
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const { codeMenu, codeEmbed } = require('./components')
const { post, fetch } = require("./post")
const credentials = require("./credentials.json")
const package = require("./package.json")

const pistonRuntimes = []
const otherRuntimes = {
  scheme: {language: "scheme", version: package.dependencies.biwascheme.substring(1), run: {output: ""}},
  apl: {language: "apl", version: package.dependencies.apl.substring(1), run: {output: ""}}
}

fetch("https://emkc.org/api/v2/piston/runtimes")
  .then(response => response.json())
  .then(runtime => pistonRuntimes.push(...runtime))
  .catch(console.error)

function firePiston(alias, code) {
  for (const runtime of pistonRuntimes) {
    const aliases = [runtime.language, ...runtime.aliases]
    if (!aliases.includes(alias)) continue

    runtime.run = {callback: () => post("https://emkc.org/api/v2/piston/execute", {language: runtime.language, version: runtime.version, files: [{content: code}]})}
    return runtime
  }
  // throw new Error(`${alias} unsupported!`)
  return null
}

function getErrorMessage(error) {
  return error ? `**${error.name}:** ${error.message}` : "Error parsing code block!"
}

function getPrettyLanguage(language, version) {
  return version ? `${language} (v${version})` : language
}

function getParsedMessage(parsed) {
  const { language, version, run } = parsed
  const output = run.output || run.stdout || run.stderr
  return `**Parsed ${getPrettyLanguage(language, version)}:**\n\`${output}\``
}

const coderegex = /^```(.+?)\n(.+)```$/si

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', (msg) => {
  const match = msg.content.match(coderegex)
  if(!match) return

  const [_, alias, code] = match

  try {
    switch (alias.toLowerCase()) {
        case "lisp":
        case "scheme":
          otherRuntimes.scheme.run.callback = () => schemeEnv.run(code).toString()
          msg.author.request = otherRuntimes.scheme
          break
        case "apl":
          otherRuntimes.apl.run.callback = () => aplEnv(code).toString()
          msg.author.request = otherRuntimes.apl
          break
        default:
          msg.author.request = firePiston(alias, code)
          break
    }

    if (msg.author.request)
      return msg.reply({embeds: [codeEmbed], components: [codeMenu]})
  } catch (error) {
    msg.reply(getErrorMessage(error))
      .catch(console.error)
  }
})


client.on('interactionCreate', async interaction => {
  if (interaction.isButton())
    return handleButtons(interaction)

  if (interaction.isCommand())
    return handleCommands(interaction)
})

async function handleButtons(interaction) {
  if (interaction.customId === "no")
    return await interaction.message.delete()

  if (interaction.customId !== "yes")
    return

  const { user } = interaction
  if (!user.request) return await interaction.message.delete()

  if (otherRuntimes[user.request.language])
    user.request.run.output = user.request.run.callback()
  else
    user.request = await user.request.run.callback()

  user.response = getParsedMessage(user.request)
  user.request = null

  await interaction.update({content: user.response, embeds: [], components: []})
}

async function handleCommands(interaction) {
  if (interaction.commandName === 'help')
    interaction.guild.commands.fetch()
      .then(commands => 
        interaction.reply("**Commands:** \n" + commands.map(command => `/${command.name} [${command.options.map((option) => option.name)}] - ${command.description}`).join("\n")))
      .catch(console.error)

  if (interaction.commandName === 'repo')
    await interaction.reply("https://github.com/bayrock/coderbus")

  if (interaction.commandName === 'languages')
    await interaction.reply(`**We support the following languages:**\n\`\`\`${[...pistonRuntimes, otherRuntimes.scheme, otherRuntimes.apl].map(runtime => getPrettyLanguage(runtime.language, runtime.version)).join(", ")}\`\`\``)

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
}

require("./commands")() // Register application commands
// require("./express")() // Initialize Express server (for glitch.me)

client.login(credentials.token) // Initialize Discord bot
