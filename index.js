//import what needed
const express = require('express');
const app = express();
var cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');


//middle-ware
app.use(cors())
app.use(express.json())
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@health-cure-db-1.ddxmc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);


//database connected APIs
async function run() {
  try {
    await client.connect();
    const servicesCollection = client.db('Heatlh-Cure-DB').collection('Services');
    const bookedCollection = client.db('Heatlh-Cure-DB').collection('Booked');
    const userCollection = client.db('Heatlh-Cure-DB').collection('users');

    // const verifyAdmin = (req, res, next) => {

    //   const requester = req.decoded.email;
    //   const currentUser = userCollection.findOne({ email: requester })
    //   if ((currentUser.role === 'admin')) {

    //     next()
    //   } else {
    //     return res.status(403).send({ message: 'Forbidden access' })
    //   }

    // }


    //get services
    app.get('/services' , async (req, res) => {
      const query = await req.query;
      const cursor = await servicesCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    })

    //use project to find one filed of collection
    app.get('/services/name', async (req, res) => {
      const cursor = await servicesCollection.find({}).project({ name: 1 })
      const result = await cursor.toArray();
      res.send(result);
    })



    app.get('/services', async (req, res) => {
      const query = await req.query;
      const cursor = await servicesCollection.find(query)
      const result = await cursor.toArray();
      res.send(result);
    })
   
    // booked appointment
    app.get('/booked', verifyJWT, async (req, res) => {
      const query = await req.query;

      if (query.email === req.decoded.email) {

        const cursor = await bookedCollection.find(query)
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: 'Forbidden access' })
      }
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


    app.get('/users', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users)
    })


    app.put('/users/:email', verifyJWT, async (req, res) => {
      const email = await req.params.email
      const filter = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })


    app.post('/users', async (req, res) => {
      const postItem = await req.body;
      const query = { email: postItem.email };
      const alreadyUser = await userCollection.findOne(query);
      var token = jwt.sign(query, process.env.TOKEN_SECRET, { expiresIn: '1h' });
      if (alreadyUser) {
        return res.send({ message: 'already added', accessToken: token })
      }
      const result = await userCollection.insertOne({ email: postItem.email, role: 'member' });
      res.send({ accessToken: token })
    })

    // app.put('/users/:email' , async (req , res ) => {
    //   const postItem = await req.body;
    //   const query = {email: postItem.email };
    //   const alreadyUser = await userCollection.findOne(query);
    //   if(alreadyUser){
    //     return res.send({message: 'already added'})
    //   }
    //   const result = await userCollection.insertOne(postItem);
    //   res.send({message : 'user data added to database'})


    // })





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