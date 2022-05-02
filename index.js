const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());

// JWT verification section 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET
        , (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
            req.decoded = decoded;
            next();
        })
}

// --------------------------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0bkok.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// --------------------------------------------

async function run() {
    try {
        await client.connect();
        // database and collections
        const itemCollection = client.db("inventory").collection("item");

        // all items load 
        app.get('/item', async (req, res) => {
            const page = parseInt(req.query.page);
            const query = {};
            const cursor = itemCollection.find(query);
            const items = await cursor.skip(page * 10).limit(10).toArray();
            res.send(items);
        })

        // specific item load 
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.findOne(query);
            res.send(result);
        })

        // my items load for specific email and verified access token
        app.get('/myItems', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const query = { email: email };
                const cursor = itemCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        })

        app.get('/myItemsCount', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const query = { email: email };
                const cursor = itemCollection.find(query);
                const result = await cursor.estimatedDocumentCount();
                res.send(result);
            }
        })

        // delete item for specific id
        app.delete('/item/:_id', async (req, res) => {
            const id = req.params._id;
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.deleteOne(query);
            res.send(result);
        })

        // add item to inventory
        app.post('/addInventoryItem', async (req, res) => {
            const newItem = req.body;
            const result = await itemCollection.insertOne(newItem);
            res.send(result);
        })

        // update specific item using it's id
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
            res.send(result);
        })

        // access token giving section when an user logs in
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '2d'
            });
            res.send({ accessToken });
        })

        // item count
        app.get('/itemCount', async (req, res) => {
            const count = await itemCollection.estimatedDocumentCount();
            res.send({ count });
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