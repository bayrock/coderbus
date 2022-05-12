const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

const colors = {
  brand: '#8e7e9b',
  accent: '#d56942'
}

const codeMenu = new MessageActionRow()
  .addComponents(
    new MessageButton()
      .setCustomId('yes')
      .setLabel('Yes')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId('no')
      .setLabel('No')
      .setStyle('SECONDARY'),
  )

const codeEmbed = new MessageEmbed()
  .setColor(colors.brand)
  .setTitle('Code detected')
  .setDescription('Would you like to run it?')

const richEmbed = (title, languages) => new MessageEmbed()
  .setColor(colors.brand)
  .setTitle(title)
  .setDescription(languages)

module.exports = { codeMenu, codeEmbed, richEmbed }
