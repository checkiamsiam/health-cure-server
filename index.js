//import what needed
const express = require('express');
const app = express();
var cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');


//middle-ware
app.use(cors())
app.use(express.json())


const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@health-cure-db-1.ddxmc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);


//database connected APIs
async function run() {
  try {
    await client.connect();
    const database = client.db('').collection('');



  } finally {

  }
}

run().catch(console.dir)

//root api
app.get('/', (req, res) => {
  res.send({serverWorking: true , WelcomeMassage: "Yes it's the server of health cure doctor's portal web"})
})


//run the server
app.listen(port)