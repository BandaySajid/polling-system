import { Kafka } from "kafkajs";
import config from "./config.js";

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers, //have 2 brokers running
});

const admin = kafka.admin();
console.log("Connecting.....");
await admin.connect();
console.log("Connected!");

export const producer = kafka.producer();
await producer.connect();
console.log("Producer Connected!");

export const consumer = kafka.consumer({ groupId: config.kafka.groupId });
console.log("Consumer Connecting.....");
await consumer.connect();
console.log("Consumer Connected!");

export async function createTopic(topic, numPartitions) {
  try {
    await admin.createTopics({
      topics: [
        {
          topic,
          numPartitions: numPartitions,
        },
      ],
    });

    console.log(`Topic ${topic}Created Successfully!`);
  } catch (ex) {
    console.error(`Error while creating topic ${ex}`);
  }
}
