const {Client, Intents, MessageEmbed} = require('discord.js');
const {token} = require('./config.json');
const CoinpaprikaAPI = require('@coinpaprika/api-nodejs-client');

const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_PRESENCES"]});
const crypto = new CoinpaprikaAPI();

var cryptos = [
    "btc-bitcoin", "eth-ethereum", "bnb-binance-coin", "sol-solana", "ada-cardano", "bch-bitcoin-cash", "ltc-litecoin", "dot-polkadot", "avax-avalanche", "ftt-ftx-token", "hex-hex", "trx-tron", "xrp-xrp"
]

const cryptoCount = cryptos.length;

class CoinInfo {
    constructor(name, symbol, price_usd, change_1h, change_24h, change_7d, change_30d, change_1y){
        this.name = name; this.symbol = symbol; this.price_usd = price_usd, this.change_1h = change_1h; this.change_24h = change_24h; this.change_7d = change_7d, this.change_30d = change_30d; this.change_1y = change_1y;
    }
}

var coins = {};
cryptos.forEach(element => {
    coins[element] = new CoinInfo("NAME", "SYMBOL", 0.00, 0.00, 0.00, 0.00, 0.00, 0.00);
});

function getCrypto(code){
    crypto.getAllTickers({coinId: code, quotes: ['USD']}).then(function(result) {
        try {
        coins[code].name = result["name"];
        coins[code].symbol = result["symbol"];
        coins[code].price_usd =  (Math.round(result["quotes"]["USD"]["price"] * 100) / 100).toFixed(2);
        coins[code].change_1h = Math.round(result["quotes"]["USD"]["percent_change_1h"] * 100) / 100;
        coins[code].change_24h = Math.round(result["quotes"]["USD"]["percent_change_24h"] * 100) / 100;
        coins[code].change_7d = Math.round(result["quotes"]["USD"]["percent_change_7d"] * 100) / 100;
        coins[code].change_30d = Math.round(result["quotes"]["USD"]["percent_change_30d"] * 100) / 100;
        coins[code].change_1y = Math.round(result["quotes"]["USD"]["percent_change_1y"] * 100) / 100;
        } catch {}
     });
};

function updateCrypto(){
    cryptos.forEach(element => {
        getCrypto(element);
    })
}


client.once('ready', () => {
    console.log(`Logged into Discord as ${client.user.tag}!`);
    updateCrypto();
    changeStatus();
    setInterval(updateCrypto, 3600000);
    setInterval(changeStatus, 4000);
});

client.on('messageCreate', message => {
    if(!(message.content.startsWith("!crypto") || message.content.startsWith("!c") || message.content.startsWith("/crypto") || message.content.startsWith("/c")))
         return;
    try{
        message.delete();
    } catch {}

    var fields = [];
    cryptos.forEach(element => {
        var info = coins[element];
        fields.push({name : `${info.symbol} ${info.name}`, value : `
        💲    \xa0\xa0\xa0 Current price: **${info.price_usd} $**
        ${parseFloat(info.change_1h) >= 0 ? "🟢" : "🔴"} \xa0\xa0\xa0 Hour change:  ${info.change_1h} %
        ${parseFloat(info.change_24h) >= 0 ? "🟢" : "🔴"} \xa0\xa0\xa0 Day change:  ${info.change_24h} % 
        ${parseFloat(info.change_7d) >= 0 ? "🟢" : "🔴"} \xa0\xa0\xa0  Week change:  ${info.change_7d} %
        ${parseFloat(info.change_30d) >= 0 ? "🟢" : "🔴"} \xa0\xa0\xa0  Month change:  ${info.change_30d} %
        ${parseFloat(info.change_1y) >= 0 ? "🟢" : "🔴"} \xa0\xa0\xa0  Year change:  ${info.change_1y} %`});
    });

    const embed = new MessageEmbed()
        .setColor("#" + ((1<<24)*Math.random() | 0).toString(16))
        .setTitle("The latest cryptocurrency rates!")
        .setThumbnail('https://cdn.discordapp.com/attachments/701029821701947392/920371197525524520/thumbnail.png')
        .addFields(fields)
        .setTimestamp()

    message.channel.send({ embeds: [embed]} );
});


var statusCounter = 0;
function changeStatus(){
    if(statusCounter == cryptoCount){
        statusCounter = 0;
    }
    var info = coins[cryptos[statusCounter]];
    var activity = `${info.symbol} ${info.price_usd} $ ${info.change_24h} %`
    client.user.setPresence({ activities: [{ name: activity, type : "WATCHING" }], status: info.change_24h >= 0 ? "online" : "dnd" });
    statusCounter++;
}

client.login(token);
