var express               = require('express'),
    path                  = require('path'),
    app                   = express();

// https://github.com/olalonde/node-yelp
var yelp = require("yelp").createClient({
    consumer_key: "gwAYuuSRjk7DsmUhiqcq_A",
    consumer_secret: "BahLIkgpGDB3-Au3EFVc8vWX1FI",
    token: "YabNVKBCLM0VMsk1AMAA0uXildOi53Ad",
    token_secret: "OBzsZAWc2NpgfI5-JrRBVLU34xI"
});

app.use( express.static( __dirname ) );

app.get('/yelp', function(res, req){

    yelp.search({term: "", location: "812 Saratoga, 95129", limit: 20}, function(error, data) {

        if( error ) {
            req.send({});
        } else {
            req.send( data );
        }

    });

});

var server = app.listen(8080, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});