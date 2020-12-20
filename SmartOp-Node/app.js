const express       = require('express');
const mongoose      = require('mongoose');
const mongodbClient = require("mongodb").MongoClient;

//To get CSV Data
const fs        = require("fs");
const fastcsv   = require("fast-csv");

//Lancer express App
const app = express();

const DATABSE_NAME        = "SmartOp";
const DATABSE_COLLECTION  = "Medical-Dataset";
const DATABSE_USERNAME    = "mouad";
const DATABASAE_URL       = 'mongodb+srv://'+DATABSE_USERNAME+':mouad123@cluster0.upjva.azure.mongodb.net/'+DATABSE_NAME+'?retryWrites=true&w=majority';
const CSV_PATH            = "interventions.csv";

mongoose.connect(DATABASAE_URL,
    { useNewUrlParser: true,
        useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

//Confiduration des CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.use('/api/data', (req, res, next) => {

    const skip = parseInt(req.query.skip)
    const limit = parseInt(req.query.limit)

 
    mongodbClient.connect(DATABASAE_URL, function(err, db) {
        if (err) throw err;
        var dbo = db.db(DATABSE_NAME);
        //Get All data then get the clean data selon les critères
        dbo.collection(DATABSE_COLLECTION).find().toArray(function(err, result) {
          if (err) throw err;
          res.status(200).json( GetCleanData(result).slice(skip,skip+limit) );
          db.close();
        });
      });
  });

app.use('/api/chirurgien', (req, res, next) => {
    //Get Data of a surgeon
    const chirurgien = req.query.chirurgien;
    mongodbClient.connect(DATABASAE_URL, function(err, db) {
        if (err) throw err;
        var dbo = db.db(DATABSE_NAME);
        //Get All data then get the clean data selon les critères
        var query = { "surgeon":  {$regex: chirurgien , $options: 'i'}  };
        dbo.collection(DATABSE_COLLECTION).find(query).toArray(function(err, result) {
          if (err) throw err;
          res.status(200).json( GetCleanData(result) );
          db.close();
        });
      });
  });

  app.get('/api/UpdateMongoDB', (req, res, next) => {

    // To Remove All rows Collection
    mongodbClient.connect(
        DATABASAE_URL,
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client) => {
            if (err) throw err;
            client
                .db(DATABSE_NAME)
                .collection(DATABSE_COLLECTION)
                .deleteMany({});
        }
    );

    // CSV TO JSON Then insert
    let stream = fs.createReadStream(CSV_PATH);
    let csvData = [];
    let csvStream = fastcsv
        .parse()
        .on("data", function(data) {

            //Spliter row puis l'ajouter au tableau du csv pour l'ajouter au BDD
            let row = data[0].split(';') ;
            let record = {
                surgeon     : row[0],
                specialty   : row[1],
                anesthsiste : row[2],
                nurse1      : row[3],
                nurse2      : row[4],
                roomNumber  : row[5],
                intervention: row[6]
            };
            csvData.push(record);
        })
        .on("end", function() {
            // remove the first line: header
            csvData.shift();
            //   console.log(csvData);
            // InsertCleanData(csvData);
            //--| save to the MongoDB database collection
            //--|--insert CSV
            mongodbClient.connect(
                DATABASAE_URL,
                { useNewUrlParser: true, useUnifiedTopology: true },
                (err, client) => {
                if (err) throw err;
                //Re-Insert Collection
                client
                    .db(DATABSE_NAME)
                    .collection(DATABSE_COLLECTION)
                    .insertMany(csvData, (err, res) => {
                    if (err) throw err;
        
                    console.log(`Inserted: ${res.insertedCount} rows`);
                    client.close();
                    });
                }
            );
        });
        stream.pipe(csvStream);

    res.status(201).json({
      message: 'Collection Updated!'
    });
  });

function GetCleanData(data){
    let csvCleanData = [];      //contains tableau selon critere du test
    let customArray=[];         //contains chaque surgent et ses tableaux
    let records = [...data];    //To remove elements après les traités

    //Traite le 1er element et delete all its replucates. Then delete it from records array
    while (records.length>0) {

        let record = {
            surgeon         : records[0].surgeon,
            specialty       : records[0].specialty,
            anesthsistes    : [records[0].anesthsiste],
            nurses          : [records[0].nurse1,records[0].nurse2],
            roomNumbers     : [records[0].roomNumber],
            interventions   : [records[0].intervention]
        };
        // Boucle pour Eleminer les doublons
        for (let j = 1; j < records.length; j++) {
            if( (records[j].surgeon === records[0].surgeon) && (records[j].specialty === records[0].specialty) ){
                
                //Remplir les tableau du record
                record.anesthsistes.push(records[j].anesthsiste);
                record.nurses.push(records[j].nurse1);
                record.nurses.push(records[j].nurse2);
                record.roomNumbers.push(records[j].roomNumber);
                record.interventions.push(records[j].intervention);

                //Puis eleminer cet element du tableau
                records.splice(j, 1);
                j--; //éviter saut d'un element aprés la suppression
            }
        }
        
        //Remplir le tableau qui contient les déffirents tableaux de cahque critere
        customArray.push(record);
        //eleminer le 1er element pour passer au suivant
        records.splice(0, 1);            
    }

    //Remplir Tableau du data final
    customArray.forEach(element => {
        let record = {
            surgeon         : element.surgeon,
            specialty       : element.specialty,
            anesthesiste    : FavouriteValue(element.anesthsistes),
            nurse           : FavouriteValue(element.nurses),
            roomNumber      : FavouriteValue(element.roomNumbers),
            intervention    : FavouriteValue(element.interventions),
            interventions   : (element.interventions.length),
        }
        csvCleanData.push(record);
    });
    console.log(csvCleanData.length);
    return csvCleanData;
}

function FavouriteValue(array){
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = FirstRecordNoNull(array); //To get first element with content
    var maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        //To test only values with content
        if( !(array[i] === "" || array[i] === undefined)){
            var el = array[i];
            if(modeMap[el] == null)
                modeMap[el] = 1;
            else
                modeMap[el]++;  
            if(modeMap[el] > maxCount)
            {
                maxEl = el;
                maxCount = modeMap[el];
            }
        }
    }
    return maxEl;
}

function FirstRecordNoNull(array){
    for(var i = 0; i < array.length; i++)
        if( array[i] != "" && array[i] != undefined )
            return array[i];
    return "Pas d'anesthésiste";
}

module.exports = app;