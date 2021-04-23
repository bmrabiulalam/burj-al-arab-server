const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin');
const serviceAccount = require("./ema-john-simple-rn-firebase-adminsdk-duwxv-a05406b573.json");
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.boucr.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const app = express()
app.use(cors());
app.use(bodyParser.json())

const port = 4000

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const collection = client.db("burjAlArab").collection("bookings");
  // perform actions on the collection object
  console.log('DB Connected Successfully')

  app.post('/addBooking', (req, res) => {
      const newBooking = req.body;
      collection.insertOne(newBooking)
      .then(result => res.send(result.insertedCount > 0));
  })

  app.get('/bookings', (req, res) => {
      const bearer = req.headers.authorization;
      console.log(req.headers.authorization)
      if(bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          // idToken comes from the client app
          admin.auth().verifyIdToken(idToken)
          .then((decodedToken) => {
            // const uid = decodedToken.uid;
            const tokenEmail = decodedToken.email;

            if(tokenEmail === req.query.email){
                collection.find({email: req.query.email})
                .toArray((err, documents) => {
                    console.log(documents)
                    res.status(200).send(documents)
                })
            }
            else{
                res.status(401).send('Unauthorized Access!')
            }
          })
          .catch((error) => {
            res.status(401).send('Unauthorized Access!')
          });
      }
      else{
          res.status(401).send('Unauthorized Access!')
      }
  })
  
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)