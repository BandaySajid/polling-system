import express from "express";
import { db } from "./db/db_connection.js";
import * as gateway from "./gateway.js";
import wss from "./wss.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WS_CLIENTS = {};

wss.on("connection", (socket, req) => {
  try {
    console.log("got a socket connection");
    const s = req.url?.split("/");
    console.log("wssss", s, req.url);
    const poll_id = s[s.length - 1];
    WS_CLIENTS[poll_id].push(socket);
  } catch (err) {
    console.log("ws connection error", err);
  }
});

const VOTES_TOPIC = "votes";

await gateway.createTopic(VOTES_TOPIC, 2);

async function processVote(data) {
  try {
    data = JSON.parse(data);
    console.log("before", data);
    data.votes_count[data.vote.option] += 1;
    console.log("votes count", data.votes_count);
    let arr_str = "";

    data.votes_count.map((v, i) => {
      arr_str += `${v}`;
      if (i < data.votes_count.length - 1) {
        arr_str += ",";
      }
    });

    const ARRAY = `{${arr_str}}`;
    const [poll] = await db`
			UPDATE polls 
			SET votes_count = ${ARRAY}
			WHERE id = ${data.vote.poll_id} RETURNING options`;
    console.log("got votes count", poll);
    await db`INSERT into votes ${db(data.vote)}`;
    let options = [];

    poll.options.forEach((p, i) => {
      options.push({ text: p, count: data.votes_count[i] });
    });

    return { poll_id: data.vote.poll_id, options };
  } catch (err) {
    console.log("Error processin vote:", err);
  }
}

async function consumeVotes(topic) {
  try {
    await gateway.consumer.subscribe({
      topic,
      fromBeginning: true,
    });

    await gateway.consumer.run({
      eachMessage: async (result) => {
        const data = await processVote(result.message.value);
        console.log("data is:", data);
        for (const c of WS_CLIENTS[data.poll_id]) {
          c.send(JSON.stringify(data));
        }
      },
    });
  } catch (ex) {
    console.error(`Error consuming ${ex}`);
  }
}

await consumeVotes("votes");

const router = express.Router();

router.post("/polls", async (req, res, next) => {
  try {
    const { question, options } = req.body;
    const poll = {
      question,
      options,
      votes_count: new Array(options.length).fill(0),
    };
    console.log("inserting poll", poll);
    await db`INSERT INTO polls ${db(poll)}`;

    return res
      .status(201)
      .json({ status: "success", description: "poll created successfully!" });
  } catch (err) {
    next(err);
  }
});

router.post("/polls/:id/vote", async (req, res, next) => {
  try {
    const [poll] =
      await db`SELECT votes_count from polls where id=${req.params.id}`; //This query should be executed by consumer, but since I have to demostrate paritions I am doing this query here. Below I am counting the total poll votes so that I can mock (partitioning logic).

    if (!poll) {
      return res
        .status(404)
        .json({ status: "error", description: "Poll does not exist!" });
    }

    const total_votes_count = poll.votes_count.reduce((a, b) => a + b);

    const vote = {
      poll_id: req.params.id,
      option: req.body.option,
    };

    const result = await gateway.producer.send({
      topic: VOTES_TOPIC,
      messages: [
        {
          value: JSON.stringify({
            votes_count: poll.votes_count,
            vote,
          }),
          partition: total_votes_count < 100 ? 0 : 1, // mock count for paritioning.
        },
      ],
    });

    if (result[0]?.errorCode > 0) {
      return res
        .status(400)
        .json({ status: "error", description: "Error submitting vote!" });
    }

    return res
      .status(200)
      .json({ status: "success", description: "vote sent for processing" });
  } catch (err) {
    next(err);
  }
});

router.get("/polls", async (req, res, next) => {
  try {
    const polls = await db`SELECT * FROM polls`;
    return res.status(200).json({ status: "success", polls });
  } catch (err) {
    next(err);
  }
});

router.get("/polls/:id/result", async (req, res, next) => {
  try {
    const [poll] = await db`SELECT * FROM polls where id = ${req.params.id}`;

    if (!poll) {
      return res
        .status(404)
        .json({ status: "error", description: "Poll does not exist!!!" });
    }

    if (!WS_CLIENTS[req.params.id]) {
      WS_CLIENTS[req.params.id] = [];
    }

    return res.sendFile(path.join(__dirname, "./static", "poll.html"));
  } catch (err) {
    next(err);
  }
});

router.get("/polls/:id", async (req, res, next) => {
  try {
    const [poll] = await db`SELECT * FROM polls where id = ${req.params.id}`;

    if (!poll) {
      return res
        .status(404)
        .json({ status: "error", description: "Poll does not exist!!!" });
    }

    const final = { votes_count: poll.votes_count, options: [] };
    poll.options.map((p, i) => {
      final.options.push({ text: p, count: poll.votes_count[i] });
    });

    return res.status(200).json({ status: "success", poll: final });
  } catch (err) {
    next(err);
  }
});

router.get("/", (_, res) => {
  return res.sendFile(path.join(__dirname, "./static", "index.html"));
});

export default router;
