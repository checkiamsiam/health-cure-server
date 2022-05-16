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
    const servicesCollection = client.db('Heatlh-Cure-DB').collection('Services');
    const bookedCollection = client.db('Heatlh-Cure-DB').collection('Booked');


    //get services
    app.get('/services', async (req, res) => {
      const query = await req.query;
      const cursor = await servicesCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    })
    // booked appointment
    app.get('/booked', async (req, res) => {
      const query = await req.query;
      const cursor = await bookedCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/booked', async (req, res) => {
      const postItem = await req.body;
      // const query = { treatmentName: postItem.treatmentName, date: postItem.date, time: postItem.time }
      const query = { treatmentName: postItem.treatmentName, date: postItem.date, email: postItem.email }
      // const alreadyBooked = await bookedCollection.findOne(query);
      const alreadyBooked = await bookedCollection.findOne(query);
      if (alreadyBooked) {
        return res.send({ success: false, message: 'Already booked' })
      }
      // if (alreadyBooked2) {
      //   return res.send({ success: false, message: 'You cant book two slot' })
      // }
      const result = await bookedCollection.insertOne(postItem);

      res.send({ success: true, message: 'Booking successfully' })

    })


    app.get('/available', async (req, res) => {

      const date = req.query.date 

      const allServices = await servicesCollection.find({}).toArray();

      const bookedOnThisDate = await bookedCollection.find({ date: date }).toArray();

      allServices.forEach(service => {

        const thisServiceBooked = bookedOnThisDate.filter(b => b.treatmentName === service.name)

        const bookedSlot = thisServiceBooked.map(s => s.time)
        

        service.slots = service.slots.filter(s => !bookedSlot.includes(s))

      })

      res.send(allServices)
    })


  } finally {

  }
}

run().catch(console.dir)

//root api
app.get('/', (req, res) => {
  res.send({ serverWorking: true, WelcomeMassage: "Yes it's the server of health cure doctor's portal web" })
})


//run the server
app.listen(port)