var express = require('express'),
    path    = require('path'),
    request = require('request'),
    _       = require('underscore'),
    $q      = require('q'),
    fs      = require('fs'),
    app     = express();

var YELP_CONSUMER_KEY = 'gwAYuuSRjk7DsmUhiqcq_A',
    YELP_CONSUMER_SECRET = 'BahLIkgpGDB3-Au3EFVc8vWX1FI',
    YELP_TOKEN = 'YabNVKBCLM0VMsk1AMAA0uXildOi53Ad',
    YELP_TOKEN_SECRET = 'OBzsZAWc2NpgfI5-JrRBVLU34xI',

    FS_CLIENT_ID = 'ZLJR2IBOBBRLYV241TT3LVMGSBAWLI1MD3WM31UU4KNZK3TV',
    FS_CLIENT_SECRET = 'WA0AKNMEKXLCWO3JDV2JP14OGJB2KTDDKKACFQSF3W3Z2XJ1',

    LOCATION = '812 Saratoga, 95129';



// https://github.com/olalonde/node-yelp
var yelp = require("yelp").createClient({
    consumer_key: YELP_CONSUMER_KEY,
    consumer_secret: YELP_CONSUMER_SECRET,
    token: YELP_TOKEN,
    token_secret: YELP_TOKEN_SECRET
});

app.use( express.static( __dirname ) );

app.get('/results', function(req, res){

    var response = {};
    response.results = [];

    getYelpResults()
        .then( getFoursquareResults )
        .then( function(){

            /*fs.writeFile('./results.json', JSON.stringify( response ), function(err){
                console.log(err);
            });*/

            res.send( response );
        })
        .catch( function(e){
            res.send({
                error: true
            });
        });

    function getYelpResults() {

        var d = $q.defer();

        yelp.search({term: "", location: LOCATION, limit: 20}, function(error, data) {

            if( error ) {

                d.reject( error );

            } else {

                response.region = data.region;

                _.mapObject( data.businesses, function(item){

                    var categories = [];

                    _.each( item.categories, function(cat){
                        categories.push( cat[0] );
                    });

                    response.results.push({
                        id : item.id,
                        title: item.name,
                        img: item.image_url,
                        description: item.snippet_text,
                        location: {
                            latitude: item.location.coordinate.latitude,
                            longitude: item.location.coordinate.longitude,
                            display_address: item.location.display_address
                        },
                        phone: item.phone,
                        display_phone: item.display_phone.replace('+1-',''),
                        categories: categories
                    });

                });

                d.resolve();

            }

        });

        return d.promise;

    }

    function getFoursquareResults() {

        var d = $q.defer(),

            api = 'https://api.foursquare.com/v2/venues/explore',

            options = {
                near: LOCATION,
                v: '20151104',
                client_id: FS_CLIENT_ID,
                client_secret : FS_CLIENT_SECRET
            },

            url = api + '?';

        _.mapObject( options, function(val, key){

            url += '&' + key + '=' + encodeURIComponent( val );

        });

        request.get( url, cb );

        return d.promise;

        function cb( error, requestResponse, body ) {

            var results = JSON.parse( body );

            if( error ) {

                d.reject();

            } else {

                _.mapObject( results.response.groups[0].items, function(item){

                    // do not add duplicates from Yelp response
                    if( _.findWhere(response.results, { title: item.venue.name } ) ) {
                        return;
                    }


                    var categories = [];

                    _.each( item.venue.categories, function(cat){
                        categories.push( cat.name );
                    });

                    response.results.push({
                        id : item.venue.id,
                        title: item.venue.name,
                        img: '',
                        description: '',
                        location: {
                            latitude: item.venue.location.lat,
                            longitude: item.venue.location.lng,
                            display_address: item.venue.location.formattedAddress
                        },
                        phone: item.venue.contact.phone,
                        display_phone: item.venue.contact.formattedPhone,
                        categories: categories
                    });

                });

                d.resolve();

            }

        }

    }


});

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Neighborhood Map app running');

});