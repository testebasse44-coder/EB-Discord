require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const estados = new Map();

client.once("ready", () => {
    console.log(`Bot online como ${client.user.tag}`);
});

app.get("/", (req, res) => {
    res.send("Servidor EB Discord funcionando!");
});

app.get("/oauth/start", (req, res) => {
    const discordId = req.query.discord;

    if (!discordId) {
        return res.status(400).send("Discord não informado.");
    }

    const state = crypto.randomBytes(32).toString("hex");

    estados.set(state, {
        discordId: discordId,
        criado: Date.now()
    });

    const params = new URLSearchParams({
        client_id: process.env.ROBLOX_CLIENT_ID,
        redirect_uri: process.env.ROBLOX_REDIRECT_URI,
        response_type: "code",
        state: state,
        scope: "openid profile"
    });

    const url =
        "https://apis.roblox.com/oauth/v1/authorize?" +
        params.toString();

    res.redirect(url);
});

app.get("/callback", async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
        return res.status(400).send("Código ou state não recebido.");
    }

    const dados = estados.get(state);

    if (!dados) {
        return res.status(400).send("Vinculação inválida ou expirada.");
    }

    estados.delete(state);

    console.log("Código OAuth recebido para:", dados.discordId);

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Vinculação Roblox</title>
        </head>
        <body>
            <h1>Roblox autorizado!</h1>
            <p>A autorização foi recebida.</p>
            <p>Estamos finalizando a vinculação...</p>
        </body>
        </html>
    `);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (interaction.commandName === "vincular") {

        const url =
            `https://eb-discord.onrender.com/oauth/start?discord=${interaction.user.id}`;

        const embed = new EmbedBuilder()
            .setTitle("Vincular Roblox")
            .setDescription(
                "Clique no botão abaixo para vincular sua conta Roblox."
            );

        const botao = new ButtonBuilder()
            .setLabel("Vincular Roblox")
            .setStyle(ButtonStyle.Link)
            .setURL(url);

        const linha = new ActionRowBuilder()
            .addComponents(botao);

        await interaction.reply({
            embeds: [embed],
            components: [linha]
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor web na porta ${PORT}`);
});

console.log("DISCORD_TOKEN configurado:", !!process.env.DISCORD_TOKEN);

client.login(process.env.DISCORD_TOKEN);
