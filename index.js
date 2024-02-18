const {
  Client,
  EmbedBuilder,
  REST,
  Routes,
  GatewayIntentBits,
  ActivityType,
} = require("discord.js");
const { token, client_id } = require("./config.json");
const CoinpaprikaAPI = require("@coinpaprika/api-nodejs-client");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildIntegrations,
  ],
});
const crypto = new CoinpaprikaAPI();

let cryptos = [
  "btc-bitcoin",
  "eth-ethereum",
  "bnb-binance-coin",
  "xrp-xrp",
  "doge-dogecoin",
  "ada-cardano",
  "hex-hex",
  "matic-polygon",
  "dot-polkadot",
  "sol-solana",
  "trx-tron",
  "ltc-litecoin",
  "avax-avalanche",
  "atom-cosmos",
];

const cryptoCount = cryptos.length;

class CoinInfo {
  constructor(
    name,
    symbol,
    price_usd,
    change_1h,
    change_24h,
    change_7d,
    change_30d,
    change_1y
  ) {
    this.name = name;
    this.symbol = symbol;
    (this.price_usd = price_usd), (this.change_1h = change_1h);
    this.change_24h = change_24h;
    (this.change_7d = change_7d), (this.change_30d = change_30d);
    this.change_1y = change_1y;
  }
}

let coins = {};
cryptos.forEach((element) => {
  coins[element] = new CoinInfo("NAME", "SYMBOL", 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
});

function getCrypto(code) {
  crypto
    .getAllTickers({ coinId: code, quotes: ["USD"] })
    .then(function (result) {
      try {
        coins[code].name = result["name"];
        coins[code].symbol = result["symbol"];
        coins[code].price_usd = (
          Math.round(result["quotes"]["USD"]["price"] * 100) / 100
        ).toFixed(2);
        coins[code].change_1h =
          Math.round(result["quotes"]["USD"]["percent_change_1h"] * 100) / 100;
        coins[code].change_24h =
          Math.round(result["quotes"]["USD"]["percent_change_24h"] * 100) / 100;
        coins[code].change_7d =
          Math.round(result["quotes"]["USD"]["percent_change_7d"] * 100) / 100;
        coins[code].change_30d =
          Math.round(result["quotes"]["USD"]["percent_change_30d"] * 100) / 100;
        coins[code].change_1y =
          Math.round(result["quotes"]["USD"]["percent_change_1y"] * 100) / 100;
      } catch {}
    });
}

function updateCrypto() {
  cryptos.forEach((element) => {
    getCrypto(element);
  });
}

// register slash commands
const commands = [
  {
    name: "crypto",
    description: "The latest cryptocurrencies rates!",
  },
];
const rest = new REST({ version: "10" }).setToken(token);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(client_id), { body: commands });
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`Logged into Discord as ${client.user.tag}!`);
  updateCrypto();
  changeStatus();
  setInterval(updateCrypto, 3600000);
  setInterval(changeStatus, 4000);
});

function createCryptoEmbed() {
  let fields = [];
  cryptos.forEach((element) => {
    let info = coins[element];
    fields.push({
      name: `${info.symbol} ${info.name}`,
      value: `
        💲    \xa0\xa0\xa0 Current price: **${info.price_usd} $**
        ${
          parseFloat(info.change_1h) >= 0 ? "🟢" : "🔴"
        } \xa0\xa0\xa0 Hour change:  ${addPlusSign(info.change_1h)} %
        ${
          parseFloat(info.change_24h) >= 0 ? "🟢" : "🔴"
        } \xa0\xa0\xa0 Day change:  ${addPlusSign(info.change_24h)} % 
        ${
          parseFloat(info.change_7d) >= 0 ? "🟢" : "🔴"
        } \xa0\xa0\xa0  Week change:  ${addPlusSign(info.change_7d)} %
        ${
          parseFloat(info.change_30d) >= 0 ? "🟢" : "🔴"
        } \xa0\xa0\xa0  Month change:  ${addPlusSign(info.change_30d)} %
        ${
          parseFloat(info.change_1y) >= 0 ? "🟢" : "🔴"
        } \xa0\xa0\xa0  Year change:  ${addPlusSign(info.change_1y)} %`,
    });
  });

  return new EmbedBuilder()
    .setColor("#" + (((1 << 24) * Math.random()) | 0).toString(16))
    .setTitle("The latest cryptocurrency rates!")
    .setThumbnail(
      "https://cdn.discordapp.com/attachments/701029821701947392/920371197525524520/thumbnail.png"
    )
    .addFields(fields)
    .setTimestamp();
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "crypto") {
    await interaction.reply({ embeds: [createCryptoEmbed()] });
  }
});

let statusCounter = 0;
function changeStatus() {
  statusCounter = statusCounter % cryptoCount;
  let info = coins[cryptos[statusCounter]];
  let activity = `${info.symbol} \u2002 ${
    info.price_usd
  } $ \u2002 ${addPlusSign(info.change_24h)} %`;
  client.user.setPresence({
    activities: [{ name: activity, type: ActivityType.Custom }],
    status: info.change_24h >= 0 ? "online" : "dnd",
  });
  statusCounter++;
}

function addPlusSign(number) {
  return number > 0 ? "+" + number.toString() : number.toString();
}

client.login(token);
