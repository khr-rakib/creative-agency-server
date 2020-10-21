require("dotenv").config();
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 8000
const MongoClient = require('mongodb').MongoClient;
const fileupload = require('express-fileupload')
const fs = require('fs-extra')

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(express.static('public/uploads'))
app.use(fileupload())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.peszb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const userCollection = client.db(process.env.DB_NAME).collection("users");
    const serviceCollection = client.db(process.env.DB_NAME).collection("services");
    console.log('database connected');

    app.get('/getService', (req, res) => {
        serviceCollection.find().toArray((err, documents) => {
            res.send(documents)
        })
    })

    app.post('/addService', (req, res) => {
        const file = req.files.icon
        const { title, description } = req.body
        const filePath = `${__dirname}/public/uploads/${file.name}`

        file.mv(filePath, err => {
            if (err) console.log(err);


            const newImg = fs.readFileSync(filePath)
            const encImg = newImg.toString('base64')
            var image = {
                contentType: req.files.icon.mimetype,
                size: Number(req.files.icon.size),
                img: Buffer(encImg, 'base64')
            }

            serviceCollection.insertOne({ title, icon: image, description })
                .then(result => {
                    fs.remove(filePath, err => {
                        if (err) console.log(err);
                        res.send(result)
                    })
                })
        })
    })



    app.post('/checkAdmin', (req, res) => {
        const user = req.body
        userCollection.findOne({ email: user.email })
            .then(result => {
                if (result === null) {
                    userCollection.insertOne({ email: user.email, displayName: user.displayName, isAdmin: false })
                        .then((resul) => res.send(resul));
                }
                if (result.isAdmin) {
                    res.send(result)
                } else {
                    res.send(result)
                }
            })
    })


    app.post('/adminLogin', (req, res) => {
        const user = req.body
        userCollection.insertOne(user)
            .then((result) => res.send(result.insertedCount > 0));
    })
});




app.get('/', (req, res) => {
    res.send('hi')
})

app.listen(PORT, () => {
    console.log('server is running');
})