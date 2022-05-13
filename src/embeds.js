const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')

const colors = {
  brand: '#574e57',
  accent: '#d56942'
}

const choiceMenu = new MessageActionRow()
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

const baseEmbed = (title, description) => new MessageEmbed()
  .setTitle(title)
  .setDescription(description)

const richEmbed = (title, description) => baseEmbed(title, description).setColor(colors.brand)
const alertEmbed = (title, description) => baseEmbed(title, description).setColor(colors.accent)

module.exports = { choiceMenu, richEmbed, alertEmbed }
