import jp from "jsonpath";
import express from "express";
const server = express();

server.all('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write('<link href="https://fonts.googleapis.com/css?family=Roboto Condensed" rel="stylesheet"> <style> body {font-family: "Roboto Condensed";font-size: 22px;} <p>Hosting Active</p>');
  res.end();
});

async function LoLCurrentGame() {
  //const test_id = "r8yqPkqpy-kJG35jl-QKZ83pWbUMJS5IP2qSyKR6tmrgt3PiZ_rHhYq0";
  const lol_data = await fetch(`https://la2.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${process.env['ZIHNE_LOLID_LAS']}?api_key=${process.env['RIOT_KEY']}`)
  //const lol_data = await fetch(`https://la1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${test_id}?api_key=${process.env['RIOT_KEY']}`)
  const { participants } = await lol_data.json();
  const champion_data = await fetch(`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/es_mx/v1/champion-summary.json`);
  const data  = await champion_data.json();
  const current_tags = await fetch(`${process.env["AHMED_WORKER"]}/tags/491738569`);
  let tags = await current_tags.text();
  tags = tags.split(",");
  const coincidencia = tags.some(elem => jp.query(data, `$..[?(@.name)].alias`).includes(elem)); // true or false
  const coincidencia_name = tags.filter(elem => jp.query(data, `$..[?(@.name)].alias`).includes(elem)); // Champ name coincidencia en tags y database
  if (participants == undefined) {
    if (coincidencia) {
      console.log("Hay coincidencia y no está en partida, se quita el tag coincidente. Hay Fetch");
      console.log(coincidencia_name);
      tags = tags.filter(elem => elem !== String(coincidencia_name));
      tags = String(tags);
      console.log(tags + "\n");
      await fetch(`${process.env["AHMED_WORKER"]}/set_tags/491738569/tags:${tags}`);
    } else {
      console.log("No hay coincidencia y no está en partida. No se actualiza los tags de twitch. No hay fetch");
      tags = tags.filter(elem => elem !== String(coincidencia_name));
      tags = String(tags);
      console.log(tags + "\n");
    }
  } else {
    for (let i = 0; i < participants.length; i++) {
      if (participants[i].summonerId == process.env['ZIHNE_LOLID_LAS']) {
        const championId = participants[i].championId;
        console.log(championId);
        const champion_name = String(jp.query(data, `$..[?(@.id==${championId})].alias`));
        console.log(champion_name);
        if (coincidencia) {
          console.log("hay campeon en los tags");
          tags.splice(tags.indexOf(String(coincidencia_name)), 1, champion_name.split());
          if (champion_name == String(coincidencia_name)) {
            console.log("Es el mismo campeón. No hay fetch");
            tags = tags.filter(elem => elem !== String(coincidencia_name));
            tags = String(tags);
            console.log(tags + "\n");
          } else {
            console.log("No es el mismo campeón. Hay fetch");
            tags = tags.filter(elem => elem !== String(coincidencia_name));
            tags = String(tags);
            console.log(tags + "\n");
            await fetch(`${process.env["AHMED_WORKER"]}/set_tags/491738569/tags:${tags}`);
          }
        } else {
          console.log("no hay campeon en los tags. Hay fetch.");
          if (tags.length < 10) {
            console.log("Menos de 10 tags.");
            tags.unshift(champion_name);
          } else {
            console.log("10 tags");
            if (tags[tags.length - 1] !== "Español") {
              tags.pop();
            } else {
              tags.splice(tags.length - 2, 1);
            }
            tags.unshift(champion_name);
          }
        tags = tags.filter(elem => elem !== String(coincidencia_name));
        tags = String(tags);
        console.log(tags + "\n");
        await fetch(`${process.env["AHMED_WORKER"]}/set_tags/491738569/tags:${tags}`);
        }
      }
    }
  }
  setTimeout(() => {
    console.log("Detecting current game");
    LoLCurrentGame();
  }, 180000);
}

LoLCurrentGame();

const keepAlive = () => {
  server.listen(3000, () => { console.log("Server is online!") });
}
keepAlive();