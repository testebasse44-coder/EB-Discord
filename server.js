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
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const estados = new Map();


// ==============================
// BOT DISCORD
// ==============================

client.once("ready", () => {
    console.log(`🤖 Bot online como ${client.user.tag}`);
});


// ==============================
// SITE
// ==============================

app.get("/", (req, res) => {
    res.send("Servidor EB Discord funcionando!");
});


// ==============================
// OAUTH ROBLOX
// ==============================

app.get("/oauth/start", (req, res) => {

    const discordId = req.query.discord;

    if (!discordId) {
        return res.status(400).send(
            "Discord não informado."
        );
    }

    if (!process.env.ROBLOX_CLIENT_ID) {
        return res.status(500).send(
            "ROBLOX_CLIENT_ID não configurado."
        );
    }

    if (!process.env.ROBLOX_REDIRECT_URI) {
        return res.status(500).send(
            "ROBLOX_REDIRECT_URI não configurado."
        );
    }

    const state = crypto
        .randomBytes(32)
        .toString("hex");

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

    console.log(
        `🔗 OAuth iniciado para Discord ID: ${discordId}`
    );

    res.redirect(url);
});


// ==============================
// CALLBACK ROBLOX
// ==============================

app.get("/callback", async (req, res) => {

    const code = req.query.code;
    const state = req.query.state;

    if (req.query.error) {

        return res.status(400).send(`
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>Erro Roblox</title>

</head>

<body>

    <h1>Autorização cancelada</h1>

    <p>${req.query.error}</p>

</body>

</html>
        `);
    }

    if (!code || !state) {

        return res.status(400).send(
            "Código ou state não recebido."
        );
    }

    const dados = estados.get(state);

    if (!dados) {

        return res.status(400).send(
            "Vinculação inválida ou expirada."
        );
    }

    estados.delete(state);

    console.log(
        `✅ Roblox autorizado para Discord ID: ${dados.discordId}`
    );

    res.send(`
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <title>Vinculação concluída</title>

    <style>

        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding-top: 80px;
        }

        h1 {
            color: #2ecc71;
        }

    </style>

</head>

<body>

    <h1>✅ Roblox autorizado!</h1>

    <p>
        Sua autorização foi recebida.
    </p>

    <p>
        A vinculação foi registrada.
    </p>

</body>

</html>
    `);
});


// ==============================
// COMANDO /VINCULAR
// ==============================

client.on(
    "interactionCreate",
    async (interaction) => {

        if (!interaction.isChatInputCommand()) {
            return;
        }

        if (interaction.commandName !== "vincular") {
            return;
        }

        try {

            const url =
                "https://eb-discord.onrender.com/oauth/start" +
                `?discord=${interaction.user.id}`;

            const embed = new EmbedBuilder()
                .setTitle("🔗 Vincular Roblox")
                .setDescription(
                    "Clique no botão abaixo para vincular sua conta Roblox ao Discord."
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

        } catch (erro) {

            console.error(
                "❌ Erro no comando /vincular:"
            );

            console.error(erro);

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({
                    content:
                        "❌ Ocorreu um erro ao gerar o link de vinculação.",
                    ephemeral: true
                });
            }
        }
    }
);


// ==============================
// SERVIDOR WEB
// ==============================

app.listen(PORT, () => {

    console.log(
        `🌐 Servidor web na porta ${PORT}`
    );

});


// ==============================
// LOGIN DO DISCORD
// ==============================

if (!process.env.DISCORD_TOKEN) {

    console.error(
        "❌ DISCORD_TOKEN não está configurado!"
    );

} else {

    client
        .login(process.env.DISCORD_TOKEN)

        .then(() => {

            console.log(
                "✅ Login do Discord realizado!"
            );

        })

        .catch((erro) => {

            console.error(
                "❌ Erro ao conectar o bot ao Discord:"
            );

            console.error(erro);

        });
                }
