var quiche = require('quiche'),
    http   = require('http'),
    _      = require('lodash'),
    fs     = require('fs'),
    imgur  = require('imgur-upload'),
    path   = require('path'),
    im     = require('node-imagemagick'),
    simple_recaptcha = require('simple-recaptcha'),
    uuid   = require('node-uuid'),
    Firebase = require('firebase'),
    app = require('../server');

var firebaseDatastore = new Firebase(process.env['FIREBASE_STORE'])

// Main route
app.get('/', function (req, res, next) {
  res.render('report.html', {
    title: 'Report'
  });
});

app.get('/report', function (req, res, next) {
  res.render('report.html', {
    title: 'Report'
  });
});

app.post('/report', function (req, res, next) {

  // Helper function
  var isInt = function (n) {
    return typeof n === 'number' && n % 1 == 0;
  }

  // Validate input
  var men        = parseInt(req.body.men, 10),
      women      = parseInt(req.body.women, 10),
      label_text = req.body.label_text,
      session_text = req.body.session_text,
      hashtag = req.body.hashtag;

  if (!isInt(men) || !isInt(women) || !_.isString(label_text) || !_.isString(session_text) || (hashtag.length > 0 && hashtag.substr(0,1) != '#')) {
    // Send the report page back down
    // Really, this should be handled directly by javascript in the page
    // Put by posting to /report teh user at least doesn't see a URL change
    // if we need to re-render it with errors
    return res.render('report.html', {
      men: req.body.men,
      women: req.body.women,
      label_text: req.body.label_text,
      hashtag: req.body.hashtag,
      error: {
        men: !isInt(men),
        women: !isInt(women),
        hashtag: (hashtag.length > 0 && hashtag.substr(0,1) != '#'),
        label_text: !_.isString(label_text),
        session_text: !_.isString(session_text)
      }
    })
  }

  // Handle Recaptcha
  // See https://github.com/zeMirco/simple-recaptcha for instructions / steps
  // You need to set this value yourself in a file called 'creds.yaml' in the root folder
  // The form of that file is
  /*
    imgurApiKey: "YOUR_IMGUR_KEY"
    recaptchaPublicKey: "YOUR_PUBLIC_KEY"
    recaptchaPrivateKey: "YOUR_PRIVATE_KEY"
  */
  var privateKey = process.env['RECAPTCHA_PRIVATE_KEY'];
  var ip = req.ip;
  var challenge = req.body.recaptcha_challenge_field;
  var response = req.body.recaptcha_response_field;

  simple_recaptcha(privateKey, ip, challenge, response, function(err) {
    if (err) {
      console.log("Recaptcha Fail");
      // Re-render the page
      return res.render('report.html', {
        men: req.body.men,
        women: req.body.women,
        label_text: req.body.label_text,
        session_text: req.body.session_text,
        hashtag: req.body.hashtag,
        error: {recaptcha: true}
      });
    }

    // Since we're all good, generate and show the pie chart

    // Default to zero individuals with a non-binary gender
    var pie = generatePieChart(men, women, 0);

    // set initial pie url for redundancy's sake
    var pie_url = pie.getUrl(true).replace("https","http");

    var proportionWomen = (women / (men + women));

    // Pass in a callback since we need a way to hear back from the implicit network call
    getMagickedImage(pie, label_text, session_text, proportionWomen, function (error, data) {

      // the 'next' method passes this on to the next route, which should be a 404 or 500
      if (error) {
        return next(error);
      }

      pie_id = data.id;
      pie_url = data.link;

      // Create a database entry for this pie_id
      var plotRef = firebaseDatastore.child('plots/'+pie_id);
      // And store the data in it
      plotRef.set({label_text: label_text, session_text: session_text, hashtag: hashtag, men: men, women: women, other: 0, pie_id: pie_id, pie_url: pie_url});
      return res.redirect('/plot/' + pie_id);
    });
  });
});

app.get('/plot/:id', function (req, res, next) {
  // Get the param
  var pie_id = req.params.id;
  // Get the plot with this id
  var plotRef = firebaseDatastore.child('plots/'+pie_id);
  // Load the data from firebase
  plotRef.once('value', function (snapshot) {
    // Firebase has a weird syntax / system. This is how we load the data in
    var refVal = snapshot.val();
    var pie_url = refVal.pie_url;

    // If the pie_url is missing (meaning we need to regenerate it), generate the pie chart and re-upload to imgur
    // This is so that if we want to "correct the record" all we need to do is update the numbers in firebase
    // and delete the pie_url. Then the next person to visit the url will cause the chart to be regenerated
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    if (!pie_url) {
      var pie = generatePieChart(refVal.men, refVal.women, refVal.other);
      var proportionWomen = (women / (men + women));
      getMagickedImage(pie, refVal.label_text, refVal.session_text, proportionWomen, function (error, data) {
        if (error) {
          return next(error);
        }
        // Update the pie_url to the newly created plot
        var pie_url = data.link;
        plotRef.child('pie_url').set(pie_url);

        return res.render('thankyou.html', {
          title: 'Thank You',
          pie: pie_url,
          hashtag: refVal.hashtag,
          event_name: refVal.label_text,
          session_text: refVal.session_text,
          url_to_share: fullUrl,
          report_is_new: 1
        })
      });
    } else {
      return res.render('thankyou.html', {
        title: 'Thank You',
        pie: pie_url,
        hashtag: refVal.hashtag,
        event_name: refVal.label_text,
        session_text: refVal.session_text,
        url_to_share: fullUrl,
        report_is_new:0
      });
    }
  })
});

function generatePieChart (men, women, other) {
  // generate pie chart from google charts API
  var pie = new quiche('pie');
  pie.setTransparentBackground(); // Make background transparent
  pie.setLegendBottom();
  pie.setLegendSize(30);
  pie.setLegendColor("444444");
  pie.setWidth(500);
  pie.setHeight(400);
  pie.addData(women, women + ' women', 'f44820');
  pie.addData(men, men + ' men', '7fc8b4');
  if (other > 0) {
    pie.addData(other, other + ' other', '444444');
  }
  return pie;
};

function getMagickedImage (pie, label_text, session_text, proportionWomen, callback) {
  // Callback parameters are (error, data)
  callback = callback || function () {}; // Null callback
  //generate UUID for filenames
  var file_id = uuid.v4();
  //download the pie chart to a local file
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var background_asset = 'genderavenger_sample_template.png'; // default to hall of fame
  if (proportionWomen < 0.4) { // 40%
    var background_asset = proportionWomen < 0.3 ? 'genderavenger_sample_bad.png' : 'sunflower.png';
  }
  var file = fs.createWriteStream(chart_filename);
  var request = http.get(pie.getUrl(true).replace("https","http"), function(response) {
    try{
      response.pipe(file);
    }catch(e){
      return callback(e, null);
    }

    // ONCE THE IMAGE IS DOWNLOADED
    response.on('end', function () {
      // convert -gravity north -stroke '#4444' \
      // -font Helvetica-bold -pointsize 54 -strokewidth 2 \
      // -annotate +0+55 'Faerie Dragon' -page +0+0 \
      // assets/genderavenger_sample_template.png -page +100+150 \
      // assets/chartgen/da6cf241-feeb-4730-90b8-f36755a2028a_chart.png -layers flatten card.png
      im.convert(['-gravity', 'north',
                  '-stroke', '#444444',
                  '-font', 'Helvetica-bold',
                  '-pointsize', '54',
                  '-strokewidth', '2',
                  '-annotate', '+0+35', label_text,
                  '-pointsize', '32',
                  '-annotate', '+0+100', session_text,
                  '-page', '+0+0',
                  'assets/'+background_asset,
                  '-page', '+100+150', chart_filename,
                  '-layers', 'flatten', card_filename],
        function (err, stdout) {
          if (err) {
            return callback(err, null);
          } else {
            //upload that local file to imgur
            // You need to set this value yourself in a file called 'creds.yaml' in the root folder
            imgur.setClientID(process.env['IMGUR_API_KEY']);
            imgur.upload(path.join(__dirname, '../' + card_filename),function(error, response){
              return callback(null, response.data);
            });
          }
        });
    });
  });
}
