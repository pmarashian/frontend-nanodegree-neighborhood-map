var express = require('express'),
    path    = require('path'),
    request = require('request'),
    _       = require('underscore'),
    $q      = require('q'),
    app     = express();

// https://github.com/olalonde/node-yelp
var yelp = require("yelp").createClient({
    consumer_key: "gwAYuuSRjk7DsmUhiqcq_A",
    consumer_secret: "BahLIkgpGDB3-Au3EFVc8vWX1FI",
    token: "YabNVKBCLM0VMsk1AMAA0uXildOi53Ad",
    token_secret: "OBzsZAWc2NpgfI5-JrRBVLU34xI"
});

app.use( express.static( __dirname ) );

app.get('/yelp', function(req, res){

    yelp.search({term: "", location: "812 Saratoga, 95129", limit: 20}, function(error, data) {

        var response = {};

        if( error ) {

            res.send({error:true});

        } else {

            response.region = data.region;
            response.results = [];

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

            var api = 'https://api.foursquare.com/v2/venues/explore',

                options = {
                    near: '812 saratoga 95129',
                    v: '20151104',
                    client_id :'ZLJR2IBOBBRLYV241TT3LVMGSBAWLI1MD3WM31UU4KNZK3TV',
                    client_secret : 'WA0AKNMEKXLCWO3JDV2JP14OGJB2KTDDKKACFQSF3W3Z2XJ1'
                };

            var url = api + '?';

            _.mapObject( options, function(val, key){

                url += '&' + key + '=' + encodeURIComponent( val );

            });

            request.get( url, cb );

            function cb( error, requestResponse, body ) {

                var results = JSON.parse( body );

                if( error ) {

                    res.send({error:true});

                } else {

                    _.mapObject( results.response.groups[0].items, function(item){

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

                    res.send( response );

                }

            }

        }

    });

});

app.get('/f', function(req, res){

    var api = 'https://api.foursquare.com/v2/venues/explore',

        options = {
            near: '812 saratoga 95129',
            v: '20151104',
            client_id :'ZLJR2IBOBBRLYV241TT3LVMGSBAWLI1MD3WM31UU4KNZK3TV',
            client_secret : 'WA0AKNMEKXLCWO3JDV2JP14OGJB2KTDDKKACFQSF3W3Z2XJ1'
        };

    var url = api + '?';

    _.mapObject( options, function(val, key){

        url += '&' + key + '=' + encodeURIComponent( val );

    });

    request.get( url, cb );

    function cb( error, response, body ) {

        var response = {};
        response.results = [];

        var results = JSON.parse( body );

        if( error ) {

            res.send({error:true});

        } else {

            _.mapObject( results.response.groups[0].items, function(item){

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
                    display_phone: item.venue.contact.formattedPhone
                });

            });

            res.send( response );

        }

    }

});

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);

});