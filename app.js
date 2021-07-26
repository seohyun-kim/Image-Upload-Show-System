var express = require('express');
var mysql = require('mysql');
var fs= require('fs');
var app = express();

var path = require('path');
var ejs = require('ejs');

var async = require('async');
var request = require("request");

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname)));

//mysql 선언
var conn = mysql.createConnection({
    host : '',
    user : '',
    password : '',
    database : ''
});
conn.connect();

app.listen(8080, () => {
    console.log('server is listening');
});

app.get('/', (req, res) => {
    res.redirect('/select');
});

app.get('/select', (req, res) => {
    var sql = "select count(*) from image";
    conn.query(sql, (err, row, field) => {
        if(err) {
            console.log(err);
        } else {
            console.log(row[0]['count(*)']);
            res.render(path.join(__dirname, './views/selectImage.ejs'),
                                {imageIdx: row[0]['count(*)']} );
        }
    });
});

var startImageIdx = null;
var lastImageIdx = null;
app.post('/select', (req, res) => {
    console.log(req.body);
    var val = req.body;
    startImageIdx = req.body.startImage;
    lastImageIdx = req.body.lastImage;
    console.log(typeof(startImageIdx));

    res.redirect('/show');
});

app.get('/show', (req, res) => {
    console.log(startImageIdx);
    console.log(lastImageIdx);
    var sql = "select * from image where image_id >= ? and image_id <= ?"; //  where image_id >= ? and image_id <= ?
    conn.query(sql, [startImageIdx, lastImageIdx], (err, row) => { // , [startImageIdx, lastImageIdx]
        if (err) {
            console.log(err);
        } else {
            console.log(row);

            // base64로 변환하여 ejs로 넘겨줌
            for (i = 0; i <= row.length - 1; i++) {
                row[i].image = Buffer.from(row[i].image).toString('base64');
            }

            res.render(path.join(__dirname, './views/showImage.ejs'),
                                {data: row} );
        }
    });
});


app.get('/upload', async (req, res) => {
    const imgDir = "./imgDB/";

    function fetchFileName(imgDir) {
        return new Promise(function(resolve, reject) {
            fs.readdir(imgDir, (err, files) =>{
                if (err) {
                    console.log(err);
                } else {
                    resolve(files)
                }
            });
        });
    }

    function putImageToDB(imgDir, fileName, i) {
        return new Promise(function(resolve, reject) {
            fs.readFile(imgDir+fileName, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    var sql = "INSERT INTO image (image, image_name) VALUES (? ,?)";
                    conn.query(sql, [data, fileName], (err, rows) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Success "+fileName);
                            resolve(++i);
                        }
                    });
                }
            });
        });
    }

    async function uploadImage(imgDir) {
        var resultFiles = await fetchFileName(imgDir);
        for (i = 0; i < resultFiles.length;) {
            i = await putImageToDB(imgDir, resultFiles[i], i);
        }

    }

    uploadImage(imgDir);

});
