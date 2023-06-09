const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { token, youtubeCookie } = require("./config.json");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();

const player = Player.singleton(client, {
  autoRegisterExtractor: false,
  ytdlOptions: {
    filter: "audioonly",
    highWaterMark: 1 << 30,
    dlChunkSize: 0,
    quality: "highestaudio",
  },
});

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

player.events.on("error", (queue, error) => {
  // Emitted when the player queue encounters error
  console.log(`General player error event: ${error.message}`);
  console.log(error);
});

player.events.on("playerError", (queue, error) => {
  // Emitted when the audio player errors while streaming audio track
  console.log(`Player error event: ${error.message}`);
  console.log(error);
});

client.login(token);
