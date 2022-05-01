const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0bkok.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// --------------------------------------------

async function run() {
    try {
        await client.connect();
        const itemCollection = client.db("inventory").collection("item");

        app.get('/item', async (req, res) => {
            const query = {};
            const cursor = itemCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })

        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.findOne(query);
            res.send(result)
        })

        app.get('/myItems', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = itemCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })



        app.delete('/item/:_id', async (req, res) => {
            const id = req.params._id;
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/addInventoryItem', async (req, res) => {
            const newItem = req.body;
            const result = await itemCollection.insertOne(newItem);
            res.send(result)
        })

        app.put('/inventory/:_id', async (req, res) => {
            const id = req.params._id;
            const updatedItem = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedItem.quantity
                }
            };
            const result = await itemCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('running ')
})
app.listen(port, () => {
    console.log('crud is running')
})