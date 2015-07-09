var quiche = require('quiche'),
    http   = require('http'),
    https   = require('https'),
    _      = require('lodash'),
    fs     = require('fs'),
    imgur  = require('imgur-upload'),
    path   = require('path'),
    im     = require('node-imagemagick'),
    uuid   = require('node-uuid'),
    Firebase = require('firebase'),
    csv = require('express-csv'),
    app = require('../server').app,
    querystring = require('querystring'),
    nodemailer = require('nodemailer'),
    firebaseDatastore = require('../server').firebaseDatastore;


// Set up nodemailer's transporter
var email_transporter = nodemailer.createTransport({
    service: 'Mandrill',
    auth: {
        user: process.env['MANDRILL_USERNAME'],
        pass: process.env['MANDRILL_APIKEY']
    }
});

// Main route (aliases /report)
app.get('/', function (req, res, next) {
  res.render('report.html', {
    title: 'Report',
    didRecaptcha: req.session.didRecaptcha
  });
});

app.get('/report', function (req, res, next) {
  res.render('report.html', {
    title: 'Report',
    didRecaptcha: req.session.didRecaptcha
  });
});

app.post('/report', function (req, res, next) {

  // Helper function
  var isInt = function (n) {
    return typeof n === 'number' && n % 1 == 0;
  }

  // Validate input
  var men = parseInt(req.body.men, 10),
      women = parseInt(req.body.women, 10),
      session_text = req.body.session_text,
      hashtag = req.body.hashtag;

  var hashPattern = new RegExp(/^\#\S{1,20}$/);
  var sessionPattern = new RegExp(/^.{0,40}$/);


  // TODO - make validation DRY
  if ((!isInt(men) || men < 0) || (!isInt(women) || women < 0) || !_.isString(session_text) || !hashtag.match(hashPattern) || !session_text.match(sessionPattern)) {
    // Send the report page back down
    // Really, this should be handled directly by javascript in the page
    // Put by posting to /report, the user at least doesn't see a URL change
    // if we need to, re-render it with errors
    return res.render('report.html', {
      men: req.body.men,
      women: req.body.women,
      hashtag: req.body.hashtag,
      session_text: req.body.session_text,
      error: {
        men: !isInt(men) || men < 0,
        women: !isInt(women) || women < 0 ,
        hashtag: !hashtag.match(hashPattern),
        session_text: !_.isString(session_text) || !session_text.match(sessionPattern)
      }
    })
  }

  // Handle Recaptcha
  // See https://github.com/zeMirco/simple-recaptcha for instructions / steps
  // You need to set this value yourself in a file called 'creds.yaml' in the root folder
  // Mark this user as being not a robot
  res.cookie('ishuman', 'true');

  // Since we're all good, generate and show the pie chart
  req.session.didRecaptcha = true;

  // Default to zero individuals with a non-binary gender
  var pie = generatePieChart(men, women, 0);

  // set initial pie url for redundancy's sake
  var pie_url = pie.getUrl(true).replace("https","http");

  var proportionWomen = (women / (men + women));

  // Pass in a callback since we need a way to hear back from the implicit network call
  getMagickedImage(pie, hashtag, session_text, proportionWomen, function (error, data) {
    // the 'next' method passes this on to the next route, which should be a 404 or 500
    if (error) {
      return next(error);
    }
    if(!(id in data)) {
      return next(data);
    }


    pie_id = data.id;
    pie_url = data.link;

    // Create a database entry for this pie_id
    var plotRef = firebaseDatastore.child('plots/'+pie_id);
    // And store the data in it
    var timestamp = new Date();
    plotRef.set({
      timestamp: timestamp.toString(),
      "unicode-timestamp": timestamp.getTime(),
      session_text: session_text,
      hashtag: hashtag,
      men: men,
      women: women,
      other: 0,
      pie_id: pie_id,
      pie_url: pie_url
    });

    plotRef.setPriority(timestamp.getTime());

    req.session.lastCreated = pie_url;
    return res.redirect('/plot/' + pie_id);
  });
});

app.get('/plot/:id', function (req, res, next) {
  // Get the pie chart
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.child('plots/'+pie_id);
  plotRef.once('value', function (snapshot) {
    // Firebase has a weird syntax / system. This is how we load the data in
    var refVal = snapshot.val();
    if (!refVal) {
      return res.redirect('/');
    }
    var pie_url = refVal.pie_url;
    var report_is_new = req.session.lastCreated == pie_url;
    req.session.lastCreated = ''; // Clear this out so repeat visits don't show that text

    // If the pie_url is missing (meaning we need to regenerate it), generate the pie chart and re-upload to imgur
    // This is so that if we want to "correct the record" all we need to do is update the numbers in firebase
    // and delete the pie_url. Then the next person to visit the url will cause the chart to be regenerated
    var host = req.get('host');
    var fullUrl = req.protocol + '://' + host + req.originalUrl;
    var hashtag = refVal.hashtag;

    if (!pie_url) {
      var pie = generatePieChart(refVal.men, refVal.women, refVal.other);
      var proportionWomen = (refVal.women / (refVal.men + refVal.women));
      getMagickedImage(pie, hashtag, refVal.session_text, proportionWomen, function (error, data) {
        if (error) {
          return next(error);
        }
        // Update the pie_url to the newly created plot
        var pie_url = data.link;
        plotRef.child('pie_url').set(pie_url);

        return res.render('thankyou.html', {
          title: 'Thank You',
          pie: pie_url,
          pie_id: pie_id,
          host: host,
          hashtag: hashtag,
          session_text: refVal.session_text,
          proportion_women: refVal.women,
          proportion_men: refVal.men,
          total_count: refVal.women + refVal.men,
          url_to_share: fullUrl,
          report_is_new: report_is_new,
          hashtag_without_hash: hashtag.substr(0,1) == '#' ? hashtag.substring(1) : hashtag,
          has_hash: hashtag.substr(0,1) == '#'
        })
      });
    } else {
      return res.render('thankyou.html', {
        title: 'Thank You',
        pie: pie_url,
        pie_id: pie_id,
        host: host,
        hashtag: hashtag,
        session_text: refVal.session_text,
        proportion_women: refVal.women,
        proportion_men: refVal.men,
        total_count: refVal.women + refVal.men,
        url_to_share: fullUrl,
        report_is_new: report_is_new,
        hashtag_without_hash: hashtag.substr(0,1) == '#' ? hashtag.substring(1) : hashtag,
        has_hash: hashtag.substr(0,1) == '#'
      });
    }
  })
});

app.get('/embed/:id', function (req, res, next) {
  // Route that returns just the image, so that it can be embedded
  // FIXME(nate): If the pie_url is missing, this will fail

  // Get the pie chart from firebase
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.child('plots/'+pie_id);
  plotRef.once('value', function (snapshot) {
    var refVal = snapshot.val();
    if (!refVal) {
      return res.redirect('/');
    }
    var pie_url = refVal.pie_url;
    var fullUrl = req.protocol + '://' + req.get('host') + "/plot/" + pie_id;
    var hashtag = refVal.hashtag;
    var session_text = refVal.session_text;
    return res.render('embed.html', {
      session_text: session_text,
      pie: pie_url,
      full_url: fullUrl,
      hashtag: hashtag
    });
  });
});

app.post('/anonymous/:id', function (req, res, next) {
  // Route that will generate an email request to submit things anonymously

  // TODO: this is kind of hackish, using a cookie for non-robotness should either be discontinued or be used everywhere as part of a standard flow
  // The original author has already been verified as "not a robot" -- check the cookie to be sure this is being accessed by a human
  if (req.cookies.ishuman != "true") {
    res.status(403);
    res.send('You have not been verified as human.');
    return next();
  }

  // Get the pie chart from firebase
  // TODO: consider refactoring to have a strong model for pie charts (this isn't DRY as it stands; we lookup from firebase in many places)
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.child('plots/'+pie_id);

  plotRef.once('value', function (snapshot) {
    var refVal = snapshot.val();
    if (!refVal) {
      return next();
    }

    var pie_url = refVal.pie_url;
    var fullUrl = req.protocol + '://' + req.get('host') + "/plot/" + pie_id;
    var hashtag = refVal.hashtag;
    var session_text = refVal.session_text;

    // Send the email
    // TODO: convert this to a templated email
    var mailOptions = {
        from: process.env['ADMIN_EMAIL'],
        to: process.env['ADMIN_EMAIL'],
        subject: 'Anonymous Submission Request (' + pie_id + ')',
        html: 'A new anonymous GA Tally request<br>-------------<br>Tally URL: ' + fullUrl + '<br>Hashtag: ' + hashtag + '<br>Session Text: ' + session_text,
    };
    email_transporter.sendMail(mailOptions, function(error, info) {
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });

    res.send('Request submitted.');
    return next();
  });
});

function verifyRecaptcha(privateKey, recaptchaResponse, callback) {
  https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + privateKey + "&response=" + recaptchaResponse, function(res) {
  var data = "";
  res.on('data', function (chunk) {
    data += chunk.toString();
  });
  res.on('end', function() {
    try {
      var parsedData = JSON.parse(data);
      if (!parsedData.success) return callback(false);
      callback(true);
    } catch (e) {
      callback(false);
    }
    });
  });

  // An object of options to indicate where to post to
  var options = {
      host: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
      }
  };
}

function generatePieChart (men, women, other) {
  // generate pie chart from google charts API
  var pie = new quiche('pie');
  pie.setTransparentBackground(); // Make background transparent
  pie.setLegendBottom();
  pie.setLegendSize(42);
  pie.setLegendColor("333333");
  pie.setWidth(540);
  pie.setHeight(540);
  var wLabel = women != 1 ? 'women' : 'woman';
  var mLabel = men != 1 ? 'men' : 'man';
  pie.addData(women, women + ' ' + wLabel, 'f44820');
  pie.addData(men, men + ' ' +mLabel, '7fc8b4');
  if (other > 0) {
    pie.addData(other, other + ' other', '444444');
  }
  return pie;
};

function getMagickedImage (pie, hashtag, session_text, proportionWomen, callback) {
  // Callback parameters are (error, data)
  callback = callback || function () {}; // Null callback
  //generate UUID for filenames
  var file_id = uuid.v4();
  //download the pie chart to a local file
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var background_asset = 'app-bg.png'; // default to hall of fame
  var foreground_asset = 'app-star-transparentlayer.png';
  if (proportionWomen < 0.4) { // 40%
    foreground_asset = proportionWomen < 0.3 ? 'app-cloud-transparentlayer.png' : 'foreground-neutral.png';
  }
  var file = fs.createWriteStream(chart_filename);
  var request = http.get(pie.getUrl(true).replace("https","http"), function(response) {
    try {
      response.pipe(file);
    } catch(err) {
      return callback(err, null);
    }

    if (session_text.charAt(0) === '@') {
      session_text = '\\' + session_text;
    }

    // ONCE THE IMAGE IS DOWNLOADED
    response.on('end', function () {
      im.convert(['-gravity', 'north',
                  '-stroke', '#333333',
                  '-font', 'AvantGarde-Book',
                  '-pointsize', '72',
                  '-strokewidth', '1',
                  '-annotate', '+0+10', hashtag,
                  '-pointsize', '42',
                  '-annotate', '+0+90', session_text,
                  '-page', '+0+0', 'assets/' + background_asset, // Background
                  '-page', '+0+0', 'assets/' + 'app-GAtitle-transparentlayer.png', // Branding at bottom
                  '-page', '+230+290', chart_filename, // Chart
                  '-page', '+0+0', 'assets/' + foreground_asset, // Foreground
                  '-layers', 'flatten', card_filename],
        function (err, stdout) {
            if (err) {
            return callback(err, null);
          } else {
            // upload that local file to imgur
            // You need to set this value yourself in a file called 'creds.yaml' in the root folder
            imgur.setClientID(process.env['IMGUR_API_KEY']);
            imgur.upload(path.join(__dirname, '../' + card_filename), function(error, response) {
              if(error)
                return callback(error,null);
              else
                return callback(error, response.data);
            });
          }
        });
    });
  });
}
