const { VM } = require('vm2')
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const { codeMenu, codeEmbed, richEmbed } = require('./embeds')
const { post, fetch } = require('./post')
const credentials = require('./credentials.json')
const package = require('../package.json')

const pistonRuntimes = []
const otherRuntimes = {
  scheme: {language: 'scheme', version: package.dependencies.biwascheme.substring(1), run: {output: ''}},
  apl: {language: 'apl', version: package.dependencies.apl.substring(1), run: {output: ''}}
}

fetch('https://emkc.org/api/v2/piston/runtimes')
  .then(response => response.json())
  .then(runtime => pistonRuntimes.push(...runtime))
  .catch(console.error)

function firePiston(alias, code) {
  for (const runtime of pistonRuntimes) {
    const aliases = [runtime.language, ...runtime.aliases]
    if (!aliases.includes(alias)) continue

    runtime.run = {callback: () => post('https://emkc.org/api/v2/piston/execute', {language: runtime.language, version: runtime.version, files: [{content: code}]})}
    return runtime
  }
  // throw new Error(`${alias} unsupported!`)
  return null
}

function getErrorMessage(error) {
  return error ? `**${error.name}:** ${error.message}` : 'Error parsing code block!'
}

function getPrettyLanguage(language, version) {
  return version ? `${language} (v${version})` : language
}

const coderegex = /^```(.+?)\n(.+)```$/si

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

const vm = new VM({
  timeout: 2000,
  allowAsync: false,
  sandbox: {aplEnv: require('apl'), schemeEnv: require('biwascheme')}
})

client.on('messageCreate', (msg) => {
  const match = msg.content.match(coderegex)
  if(!match) return

  const [_, alias, code] = match

  switch (alias.toLowerCase()) {
      case 'lisp':
      case 'scheme':
        otherRuntimes.scheme.run.callback = () => vm.run('schemeEnv.run(code).toString()')
        msg.author.request = { ...otherRuntimes.scheme, code: code }
        break
      case 'apl':
        otherRuntimes.apl.run.callback = () => vm.run('aplEnv(code).toString()')
        msg.author.request = { ...otherRuntimes.apl, code: code }
        break
      default:
        msg.author.request = firePiston(alias, code)
        break
  }

  if (msg.author.request)
    return msg.reply({embeds: [codeEmbed], components: [codeMenu]})
})


client.on('interactionCreate', async interaction => {
  if (interaction.isButton())
    return await handleButtons(interaction)

  if (interaction.isCommand())
    return await handleCommands(interaction)
})

async function handleButtons(interaction) {
  if (interaction.customId === 'no')
    return await interaction.message.delete()

  if (interaction.customId === 'yes')
    handleCodeBlocks(interaction)
}

async function handleCodeBlocks(interaction) {
  const user = interaction.message.mentions.repliedUser
  if (!user?.request) return await interaction.message.delete()

  try {
    if (otherRuntimes[user.request.language]) {
      vm.sandbox.code = user.request.code
      user.request.run.output = user.request.run.callback()
    } else {
      user.request = await user.request.run.callback()
    }
  } catch (error) {
    return await interaction.update({content: getErrorMessage(error), embeds: [], components: []})
      .catch(console.error)
  }

  const { language, version, run } = user.request
  user.response = richEmbed(`Parsed ${getPrettyLanguage(language, version)}`, run.output || run.stdout || run.stderr)
  user.request = null

  await interaction.update({embeds: [user.response], components: []})
}

async function handleCommands(interaction) {
  if (interaction.commandName === 'help') {
    const commands = await interaction.guild.commands.fetch()
    const commandList = richEmbed('Commands:', commands.map(command => `/${command.name} [${command.options.map((option) => option.name)}] - ${command.description}`).join('\n'))
    await interaction.reply({embeds: [commandList], ephemeral: true})
  }

  if (interaction.commandName === 'repo')
    await interaction.reply('https://github.com/bayrock/coderbus')

  if (interaction.commandName === 'languages') {
    const languageList = richEmbed('Supported languages:', [...pistonRuntimes, otherRuntimes.scheme, otherRuntimes.apl].map(runtime => getPrettyLanguage(runtime.language, runtime.version)).join(', '))
    await interaction.reply({embeds: [languageList], ephemeral: true})
  }

  if (interaction.commandName === 'avatar') {
    const mentioned = interaction.options.getMentionable('user')
    const id = interaction.options.getString('id')
    if (mentioned)
      await interaction.reply(mentioned.user.avatarURL({size: 2048}))
    else if (id)
      client.users.fetch(id).then(user => interaction.reply(user.avatarURL({size: 2048})))
    else
      await interaction.reply(interaction.member.user.avatarURL({size: 2048}))
  }

  if (interaction.commandName === 'fetch') {
    const url = interaction.options.getString('url')
    if (!url) return interaction.reply('URL not found!')

    const invisible = interaction.options.getBoolean('invisible')
    await interaction.deferReply({ephemeral: invisible ?? true})
    const response = await fetch(url)
    const data = await response.json()
    await interaction.editReply(`\`\`\`json\n${JSON.stringify(data[0] ? data[0] : data, null, 2)}\n\`\`\``)
  }
}

require('./commands')() // Register application commands
// require('./express')() // Initialize Express server (for glitch.me)

client.login(credentials.token) // Initialize Discord bot
