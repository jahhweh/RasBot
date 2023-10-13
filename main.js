// RasBot 
// An OpenAI Discord Bot
//
// !rasbot to chat
// !paint to request a painting
// !race to start a turtle race

require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");
const Discord = require('discord.js');

// connect to discord
const client = new Discord.Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MEMBERS"
  ],
});

// connect to OpenAI 
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// setup chatbot variables
const maxMemory = 2;
const botMemory = [];
let raceNumber = 0;
let raceInProgress = false;
const maxRaceMemory = 20;
const raceMemory = [];
const prefix = '!';

// setup Kingston, Jamaica date and time
const jamaicaTimezone = 'America/Jamaica';
const timezoneOptions = {
  timeZone: jamaicaTimezone,
  hour12: true,
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};
let jamaicaDate = new Date().toLocaleString(undefined, timezoneOptions);

// start chatbot
client.once('ready', async () => {
  client.user.setActivity("strictly roots", { type: "PLAYING" })
  console.log('Bot is online');
});

// on message...
client.on('messageCreate', message => {

  // reply to a message if bot is being replied to
  if (message.reference && message.reference.messageId) {

    message.channel.messages.fetch(message.reference.messageId)
      .then(msg => {
        if (msg.author.id === client.user.id) {

          // Reply to the message
          // set chatbot prompt as discord message
          let prompt = message.content;

          // generate response
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are a web3 blockchain rastafari." },
                ...botMemory,
                { "role": "user", "content": prompt }
              ];

              const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: chatMessages,
                temperature: 1.1,
                max_tokens: 200,
                presence_penalty: 0.5,
                frequency_penalty: 0.2
              });

              const response = completion.data.choices[0].message.content;

              message.reply(response);
              if (botMemory.length >= maxMemory * 2) {
                botMemory.splice(0, 2);
              }
              botMemory.push({ "role": "user", "content": prompt });
              botMemory.push({ "role": "assistant", "content": response });

              console.log('PROMPT: ', prompt);
              console.log('RESPONSE: ', response);
              console.log('BOT MEMORY: ', botMemory);
            } catch (e) {
              console.log('error: ', e);
              message.reply('bad vibes!');
              message.reply(e);
            }
          })();
        }
      })
      .catch(console.error);
  }

  // commands
  if (message.content.startsWith(prefix)) {
    const [command, ...args] = message.content
      .trim()
      .substring(prefix.length)
      .split(/\s+/);

    switch (command) {
      case 'rasbot':
        // set chatbot prompt as discord message
        let prompt = message.content;

        // generate response
        (async () => {
          try {
            const chatMessages = [
              { "role": "system", "content": "You are a web3 blockchain rastafari." },
              ...botMemory,
              { "role": "user", "content": prompt }
            ];

            const completion = await openai.createChatCompletion({
              model: "gpt-4",
              messages: chatMessages,
              temperature: 1.1,
              max_tokens: 500,
              presence_penalty: 0.5,
              frequency_penalty: 0.2
            });

            const response = completion.data.choices[0].message.content;

            message.reply(response);
            if (botMemory.length >= maxMemory * 2) {
              botMemory.splice(0, 2);
            }
            botMemory.push({ "role": "user", "content": prompt });
            botMemory.push({ "role": "assistant", "content": response });

            console.log('PROMPT: ', prompt);
            console.log('RESPONSE: ', response);
            console.log('BOT MEMORY: ', botMemory);
          } catch (e) {
            console.log('error: ', e);
            message.reply('bad vibes!');
            message.reply(e);
          }
        })();
        break;

      case 'paint':
        (async () => {
          message.reply(`Painting ${message.content.slice(message.content.indexOf('!paint') + 7)}...`);
          try {
            const response = await openai.createImage({
              prompt: `A painting of ${message.content.slice(message.content.indexOf('!paint') + 7)} in the style of a Caribbean artist`,
              n: 1,
              size: "256x256",
            });
            message.channel.send(response.data.data[0].url);
          } catch (e) {
            console.log('error: ', e);
            message.reply('bad vibes!');
            message.reply(e);
          }
        })();
        break;


      // turtle race
      case 'race':

        if (raceInProgress) {
          message.channel.send("Turtles are already racing on the track!");
          return;
        }

        const turtle_count = 5;
        const race_length = 100;
        const race_interval = 1000;
        raceNumber++;
        let lastMessage = null;
        let lastUpdate = null;

        const names = ['Rocky', 'Shellman', 'Speedy', 'Bolt', 'Flash', 'Turbo', 'Rocket', 'Zoom', 'Blaze', 'Jet', 'Comet', 'Lightning', 'Rapido', 'Viento', 'Fugaz', 'Cósmico', 'Relâmpago', 'Raio', 'Contella', 'Torbellino', 'Águila', 'Faísca', 'Umi', 'Tora', 'Kaze', 'Hikari', 'Xingyun', 'Lóng', 'Zephyr', 'Qilin', 'Drakon', 'Vitez', 'Singa', 'Selamat', 'Lao', 'Raja', 'Bob', 'Rita', 'Ziggy', 'Rohan', 'Cedella', 'Ky-Mani', 'Ruffy', 'Tuffy', 'Lickle Gong', 'Sela', 'Toaster', 'Sleng Teng', 'Bandelero', 'Duppy', 'Diwali', 'Rudy', 'Rizzla', 'Chaliwa'];
        const emojis = ['🟥', '🟦', '🟩', '🟨', '🟪', '🟫', '🟧', '⬛', '⬜'];

        // Shuffle array
        function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
        }

        // Randomly select and shuffle names
        shuffleArray(names);
        shuffleArray(emojis)
        const randomNames = names.slice(0, turtle_count);
        const randomEmojis = emojis.slice(0, turtle_count);

        let turtles = Array(turtle_count).fill(0);
        let raceTime = 0;

        function randomMove() {
          const turtle_index = Math.floor(Math.random() * turtle_count); // select a random turtle
          const turtleStep = Math.ceil(Math.random() * 10); // set a random step count
          const move = Math.random() > 0.5 ? turtleStep : -(Math.floor(turtleStep / 3)); // move forward or backward
          turtles[turtle_index] = Math.max(0, turtles[turtle_index] + move);

          raceTime++;

          let turtlesPositions = turtles.map((turtle, index) => ({
            name: randomNames[index],
            emoji: randomEmojis[index],
            pos: turtle,
            racePercentage: (turtle / race_length * 100).toFixed(0) // calculate race completion percentage
          }));

          let positionsName = turtlesPositions.map(turtle => turtle.name.padEnd(12, '-'));
          let positionsPercentage = turtlesPositions.map(turtle => `${turtle.racePercentage}%`);

          let positionsPercentageAsInt0 = parseInt(positionsPercentage[0]) / 5;
          let displayPositionString0 = '--------------------'.substring(0, 20 - positionsPercentageAsInt0) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt0 + 1);

          let positionsPercentageAsInt1 = parseInt(positionsPercentage[1]) / 5;
          let displayPositionString1 = '--------------------'.substring(0, 20 - positionsPercentageAsInt1) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt1 + 1);

          let positionsPercentageAsInt2 = parseInt(positionsPercentage[2]) / 5;
          let displayPositionString2 = '--------------------'.substring(0, 20 - positionsPercentageAsInt2) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt2 + 1);

          let positionsPercentageAsInt3 = parseInt(positionsPercentage[3]) / 5;
          let displayPositionString3 = '--------------------'.substring(0, 20 - positionsPercentageAsInt3) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt3 + 1);

          let positionsPercentageAsInt4 = parseInt(positionsPercentage[4]) / 5;
          let displayPositionString4 = '--------------------'.substring(0, 20 - positionsPercentageAsInt4) + '🐢' + '--------------------'.substring(20 - positionsPercentageAsInt4 + 1);

          if (raceTime % 2 === 0) {

            let raceMessage = `\n
${positionsName[0]} ${turtlesPositions[0].emoji} 🏁 ${displayPositionString0}
${positionsName[1]} ${turtlesPositions[1].emoji} 🏁 ${displayPositionString1}
${positionsName[2]} ${turtlesPositions[2].emoji} 🏁 ${displayPositionString2}
${positionsName[3]} ${turtlesPositions[3].emoji} 🏁 ${displayPositionString3}
${positionsName[4]} ${turtlesPositions[4].emoji} 🏁 ${displayPositionString4}
          `;
            if (lastMessage) {
              lastMessage.edit(raceMessage);
            } else {
              message.channel.send(raceMessage)
                .then(msg => lastMessage = msg);
            }

          }
          if (raceTime === 1 || raceTime % 20 === 0) {
            raceUpdate();
          }

          turtlesPositions.sort((a, b) => b.pos - a.pos);
          let winMessage = `🍾 We have a winner! 🎉\n🐢 Turtle Race #${raceNumber}\n🥇 ${turtlesPositions[0].name}\n🥈 ${turtlesPositions[1].name}\n🥉 ${turtlesPositions[2].name}\n😰 ${turtlesPositions[3].name}\n😴 ${turtlesPositions[4].name}`
          return turtles[turtle_index] >= race_length ? winMessage : null; // if a turtle reaches or surpasses the race_length, it wins
        }

        function raceUpdate() {
          let turtlesPositions = turtles.map((turtle, index) => ({
            name: randomNames[index],
            emoji: randomEmojis[index],
            pos: turtle,
            racePercentage: (turtle / race_length * 100).toFixed(0) // calculate race completion percentage
          }));
          let turtlesPositionsJSON = JSON.stringify(turtlesPositions.map(turtle => {
            return {
              name: turtle.name,
              percentComplete: turtle.racePercentage
            };
          }));
          let instructions = `The message delimited by ### is an update for a turtle race. The first turtle to percentComplete 100% wins. Very briefly describe the turtle race update with a random fact about the race track or a racer. ###\n${turtlesPositionsJSON}\n###`;
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are a Jamaican Rastafari pretending to be a National Turtle Racing League sports commentator." },
                ...raceMemory,
                { "role": "user", "content": instructions }
              ];
              const completion = await openai.createChatCompletion({
                model: "gpt-4",
                messages: chatMessages,
                temperature: 1.1,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.2
              });
              const response = completion.data.choices[0].message.content;

              if (lastUpdate) {
                lastUpdate.edit(`🎙️ ${response}`);
              } else {
                message.channel.send(`🎙️ ${response}`)
                  .then(msg => lastUpdate = msg);
              }

              if (raceMemory.length >= maxRaceMemory * 2) {
                raceMemory.splice(0, 2);
              }
              raceMemory.push({ "role": "user", "content": instructions });
              raceMemory.push({ "role": "assistant", "content": response });
            } catch (e) {
              console.log('error: ', e);
              message.channel.send('🎙️ Oops, hang on one second... I thin.. can g.t...a.ah.***cchhhhhhhhhh***!');
            }
          })();
        }

        message.channel.send(`🐢 ${jamaicaDate} inna Kingston, Jamaica and dis a Turtle Race #${raceNumber}!`);
        raceInProgress = true;

        const raceInterval = setInterval(() => {
          const winner = randomMove();
          if (winner !== null) {
            message.channel.send(`\n${winner}`);
            let raceResultsJSON = JSON.stringify(winner)
            let finalMessage = `The message delimited by ### are the results of a turtle race. Very briefly describe the results. ###\n${raceResultsJSON}\n###`;

            (async () => {
              try {
                const chatMessages = [
                  { "role": "system", "content": "You are a Jamaican Rastafari pretending to be a National Turtle Racing League sports commentator." },
                  ...raceMemory,
                  { "role": "user", "content": finalMessage }
                ];
                const completion = await openai.createChatCompletion({
                  model: "gpt-4",
                  messages: chatMessages,
                  temperature: 1.1,
                  max_tokens: 500,
                  presence_penalty: 0.5,
                  frequency_penalty: 0.2
                });
                const response = completion.data.choices[0].message.content;

                if (lastUpdate) {
                  lastUpdate.edit(`🎙️ ${response}`);
                } else {
                  message.channel.send(`🎙️ ${response}`)
                    .then(msg => lastUpdate = msg);
                }

              } catch (e) {
                console.log('error: ', e);
                message.channel.send('🎙️ Oops, hang on one second... I thin.. can g.t...a.ah.***cchhhhhhhhhh***!');
              }
            })();
            clearInterval(raceInterval);
            raceInProgress = false;
          }
        }, race_interval);

        break;

      default:
        message.reply('That is not a command!');
        break;
    }
  }

});

client.login(process.env.DISCORD_BOT_TOKEN);