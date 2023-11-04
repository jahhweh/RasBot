// RasBot 
// An OpenAI Discord Bot

import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { Client } from 'discord.js';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion
} from 'firebase/firestore';
import Moralis from 'moralis';
import { channel } from 'diagnostics_channel';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

dotenv.config();
const client = new Client({
  intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MEMBERS"
  ],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});

// setup chatbot variables
const maxMemory = 2;
const botMemory = [];
let raceInProgress = false;
const maxRaceMemory = 20;
const raceMemory = [];
const prefix = '!';
const rasbotID = '1144769935323693156';
const digitaldubsID = '738140276924743740';
const jahhwehID = '388069999211970562';
const announcementsChannelID = '823329797778046989';
const scamAlertMessageGIF = "https://tenor.com/view/remove-remove-ya-bye-gif-16012529";
const scamAlertMessages = [
  "Mi naah lie, dat look fishy.",
  "Mi nuh too trust dat, yuh zimi?",
  "Mi have mi doubts 'bout dat one, yuh zeen?",
  "Dat sound kinda shady to mi, bredren.",
  "Mi smell a rat inna dat whole ting.",
  "Mi cyan trust dat, yuh feel me?",
  "Dem move kinda sly, mi nuh like it.",
  "Dat soun' like a one big con, seen?",
  "Mi have mi reservations 'bout dat, mi breda.",
  "Dat look too good fi be true, star.",
  "Mi naah put mi trust inna dat, brejin.",
  "Mi sense a set-up inna dat whole vibe."
];

// setup discord server settings
const botChannel = '1162474159687868526';

// start chatbot
client.once('ready', async () => {
  client.user.setActivity("strictly roots", { type: "PLAYING" })
});

// on message...
client.on('messageCreate', async (message) => {

  // delete potential scam post
  if (!message.author.id == jahhwehID || !message.author.id == rasbotID || !message.author.id == digitaldubsID) {
    let prompt = message.content;
    try {
      const chatMessages = [
        { "role": "system", "content": "You are a chatroom moderator looking for suspicious phishing posts and scam posts. Review the post delimited by ### and reply 'Yes' if the post is likely to be a phishing scam or reply 'No' if the post is most likely not a phishing scam" },
        ...botMemory,
        { "role": "user", "content": `### ${prompt} ###` }
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: chatMessages,
        temperature: 0.5,
        max_tokens: 500,
        presence_penalty: 0.0
      });
      const response = completion.choices[0].message.content;
      if (response === 'Yes') {
        message.delete();
        let scamAlert = Math.floor(Math.random() * scamAlertMessages.length);
        message.channel.send((`${scamAlertMessages[scamAlert]}`));
      }

      if (botMemory.length >= maxMemory * 2) {
        botMemory.splice(0, 2);
      }
      botMemory.push({ "role": "user", "content": prompt });
      botMemory.push({ "role": "assistant", "content": response });
    } catch (e) {
      console.log('error: ', e);
    }
  }

  // if message is not in bot channel, ignore it
  else if (!message.channel.id == botChannel) {
    return;
  }

  // reply to a message if bot is being replied to
  else if (message.reference && message.reference.messageId) {
    message.channel.messages.fetch(message.reference.messageId)
      .then(async msg => {
        if (msg.author.id === client.user.id) {
          let prompt = message.content;
          const modCheck = openai.moderations.create({
            model: 'text-moderation-latest',
            input: prompt
          })
          const banHammer = (await modCheck).results[0].flagged;
          if (banHammer) {
            message.reply("That was flagged by the moderators. Please !chat about something else.");
            return;
          }
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are a web3 blockchain rastafari. Respond as a web3 blockchain rastafari would." },
                ...botMemory,
                { "role": "user", "content": prompt }
              ];
              const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: chatMessages,
                temperature: 0.5,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.2
              });
              const response = completion.choices[0].message.content;
              message.reply(response);
              if (botMemory.length >= maxMemory * 2) {
                botMemory.splice(0, 2);
              }
              botMemory.push({ "role": "user", "content": prompt });
              botMemory.push({ "role": "assistant", "content": response });
            } catch (e) {
              console.log('error: ', e);
              message.reply('error...');
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

      case 'chat':
        try {
          let chatPrompt = message.content.replace("!chat ", " ");
          const modCheck = openai.moderations.create({
            model: 'text-moderation-latest',
            input: chatPrompt
          })
          const banHammer = (await modCheck).results[0].flagged;
          if (banHammer) {
            message.reply("That was flagged by the moderators. Please !chat about something else.");
            return;
          }
          (async () => {
            try {
              const chatMessages = [
                { "role": "system", "content": "You are a web3 blockchain rastafari. Respond as a web3 blockchain rastafari would." },
                ...botMemory,
                { "role": "user", "content": chatPrompt }
              ];
              const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: chatMessages,
                temperature: 0.5,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.2
              });
              const response = completion.choices[0].message.content;
              message.reply(response);
              if (botMemory.length >= maxMemory * 2) {
                botMemory.splice(0, 2);
              }
              botMemory.push({ "role": "user", "content": chatPrompt });
              botMemory.push({ "role": "assistant", "content": response });
            } catch (e) {
              console.log('error: ', e);
              message.reply('error...');
              message.reply(e);
            }
          })();
        } catch (e) {
          console.log('Error... ', e);
          message.reply(`Error... ${e}`);
        }

        break;

      case 'paint':

        try {
          const userRequest = message.content.slice(message.content.indexOf('!paint') + 7);
          const modCheck = openai.moderations.create({
            model: 'text-moderation-latest',
            input: userRequest
          })
          const banHammer = (await modCheck).results[0].flagged;
          if (banHammer) {
            message.reply("That was flagged by the moderators. Please !paint something else.");
            return;
          }

          (async () => {
            message.reply(`Painting ${message.content.slice(message.content.indexOf('!paint') + 7)}...`);
            try {
              const response = await openai.images.generate({
                prompt: `A painting of ${message.content.slice(message.content.indexOf('!paint') + 7)}`,
                n: 1,
                size: "256x256",
              });
              message.channel.send(response.data[0].url);
            } catch (e) {
              console.log('error: ', e);
              message.reply('error...');
              message.reply(e)
            }
          })();

        } catch (e) {
          console.log('Error... ', e);
          message.reply(`Error... ${e}`);
        }

        break;

      case 'addTurtle':

        const newTurtleName = message.content.slice(message.content.indexOf('!addTurtle') + 11).replace(/[*]/g, '');

        if (newTurtleName.length <= 2 || newTurtleName.length >= 12) {
          message.reply("Turtle names must be between 2 and 12 characters. `!addTurtle Name`");
          return;
        }

        const modCheck = openai.moderations.create({
          model: 'text-moderation-latest',
          input: newTurtleName
        })
        const banHammer = (await modCheck).results[0].flagged;
        if (banHammer) {
          message.reply("That name was flagged by the moderators. Please choose a different name.");
          return;
        }

        try {
          const userRef = doc(db, "users", message.author.id);
          const userDoc = await getDoc(userRef);
          const globalRef = doc(db, "users", "global");
          const myTurtleName = await userDoc.data().turtleName;
          if (myTurtleName) {
            message.reply(`You already have a turtle named ${myTurtleName}.`);
            return;
          }
          await updateDoc(globalRef, {
            turtleNames: arrayUnion(newTurtleName),
            [newTurtleName]: {
              owner: message.author.username,
              plays: 0,
              wins: 0
            }
          });
          await updateDoc(userRef, {
            turtleName: newTurtleName
          });
          message.reply(`Your turtle is named ${newTurtleName}.`)
        } catch (e) {
          console.log('error... ', e);
          message.reply(`Error... ${e}`);
        }
        break;

      case 'myTurtle':
        try {
          const globalRef = doc(db, "users", "global");
          const globalDoc = await getDoc(globalRef);

          const userRef = doc(db, "users", message.author.id);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            const timestamp = Math.floor(Date.now()).toString();
            await setDoc(userRef, {
              username: message.author.username,
              signUpTimestamp: timestamp,
            });
            message.reply("You don't have a turtle. You can add one with the command `!addTurtle **name**`");
            return;
          }
          const myTurtleName = await userDoc.data().turtleName;
          if (!myTurtleName) {
            message.reply("You don't have a turtle. You can add one with the command `!addTurtle **name**`");
            return;
          }

          const globalData = globalDoc.data();
          console.log(globalData[myTurtleName])

          const owner = globalData[myTurtleName].owner;
          const plays = globalData[myTurtleName].plays;
          const wins = globalData[myTurtleName].wins;

          message.reply(`🐢 Name: ${myTurtleName}\n ❤️ Owner: ${owner}\n 🏁 Races: ${plays}\n 🥇 Wins: ${wins}`)

        } catch (e) {
          console.log('error... ', e);
          message.reply('Error... ', e);
        }

        break;

      case 'race':
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

        const globalRef = doc(db, "users", "global");
        const globalDoc = await getDoc(globalRef);
        const userRef = doc(db, "users", message.author.id);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const timestamp = Math.floor(Date.now()).toString();
          await setDoc(userRef, {
            username: message.author.username,
            signUpTimestamp: timestamp,
          });
        }

        if (raceInProgress) {
          message.channel.send("Turtles are already racing on the track!");
          return;
        }

        const turtleNamesArray = globalDoc.data().turtleNames;
        const turtleRaceNumber = globalDoc.data().totalTurtleRaces;

        await updateDoc(globalRef, {
          totalTurtleRaces: increment(1)
        });

        const turtle_count = 5;
        const race_length = 100;
        const race_interval = 1000;
        let lastMessage = null;
        let lastUpdate = null;

        const emojis = ['🟥', '🟦', '🟩', '🟨', '🟪', '🟫', '🟧', '⬛', '⬜'];

        // Shuffle array
        function shuffleArray(array) {
          for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
        }

        // Randomly select and shuffle names
        shuffleArray(turtleNamesArray);
        shuffleArray(emojis);
        const randomNames = turtleNamesArray.slice(0, turtle_count);
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
          let winMessage = `🍾 We have a winner! 🎉\n🐢 Turtle Race #${turtleRaceNumber + 1}\n🥇 ${turtlesPositions[0].name}\n🥈 ${turtlesPositions[1].name}\n🥉 ${turtlesPositions[2].name}\n😰 ${turtlesPositions[3].name}\n😴 ${turtlesPositions[4].name}`
          if (turtles[turtle_index] >= race_length) {
            const updates = {};
            updates[`${turtlesPositions[0].name}.wins`] = increment(1);
            updates[`${turtlesPositions[0].name}.plays`] = increment(1);
            for (let i = 1; i < turtlesPositions.length; i++) {
              updates[`${turtlesPositions[i].name}.plays`] = increment(1);
            }
            updateDoc(globalRef, updates);
          }
          return turtles[turtle_index] >= race_length ? winMessage : null;
        }

        function raceUpdate() {
          let turtlesPositions = turtles.map((turtle, index) => ({
            name: randomNames[index],
            emoji: randomEmojis[index],
            pos: turtle,
            racePercentage: (turtle / race_length * 100).toFixed(0)
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
              const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: chatMessages,
                temperature: 0.9,
                max_tokens: 500,
                presence_penalty: 0.5,
                frequency_penalty: 0.2
              });
              const response = completion.choices[0].message.content;

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

        if (!turtleRaceNumber) {
          message.channel.send(`🐢 It's ${jamaicaDate} inna Kingston, Jamaica an dis a Turtle Race #1!`);
        } else {
          message.channel.send(`🐢 It's ${jamaicaDate} inna Kingston, Jamaica an dis a Turtle Race #${turtleRaceNumber + 1}!`);
        }
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
                const completion = await openai.chat.completions.create({
                  model: "gpt-4",
                  messages: chatMessages,
                  temperature: 0.9,
                  max_tokens: 500,
                  presence_penalty: 0.5,
                  frequency_penalty: 0.2
                });
                const response = completion.choices[0].message.content;

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

      case 'help':
        message.reply(
          "RasBot Commands\n\n" +
          "🐢 `!race` Start a turtle race \n" +
          "🆕 `!addTurtle **name**` Add a turtle to the International Turtle Racing League\n" +
          "📊 `!myTurtle` Check your turtle stats\n" +
          "💬 `!chat` Start a chat with RasBot\n" +
          "🎨 `!paint **prompt**` Request an image from DALL·E"
        )
        break;

      default:
        message.reply('That is not a command!');
        break;
    }
  }

});

client.login(process.env.DISCORD_BOT_TOKEN);