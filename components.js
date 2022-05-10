const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

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
  .setColor('#0099ff')
  .setTitle('Code detected!')
  .setDescription('Would you like to run it?')

module.exports = { codeMenu, codeEmbed }
