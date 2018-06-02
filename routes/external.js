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
    firebaseDatastore = require('../server').firebaseDatastore,
    AWS = require('aws-sdk'),
    multer  = require('multer'),
    request = require('request');

var upload = multer({ dest: 'uploads/' })

// Set up nodemailer's transporter
var email_transporter = nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASSWORD']
    }
});

// Starting page when opening the app
app.get('/', function (req, res, next) {

  // Has the user been here before?
  var is_returning_visitor = false;
  if(!req.cookies.has_visited
   || isNaN(parseInt(req.cookies.has_visited))) {
    res.cookie('has_visited', 1);
  }
  else {
    var visit_count = parseInt(req.cookies.has_visited);
    res.cookie('has_visited', visit_count + 1);

    // Have they been here more than 4 times?
    is_returning_visitor = visit_count >= 4;
  }

  if(is_returning_visitor) {
    return res.redirect('toolselect');
  } else {
    return res.redirect('intro');
  }
});

app.get('/intro', function (req, res, next) {
  res.render('intro.html', {
    title: 'Introduction',
  });
});

app.get('/toolselect', function (req, res, next) {
  res.render('toolselect.html', {
    title: 'What do you want to do?',
  });
});

app.get('/form', function (req, res, next) {
  res.render('form.html', {
    title: 'Form',
    men: req.session.men,
    women: req.session.women,
    womenofcolor: req.session.womenofcolor,
    hashtag: req.session.hashtag,
    session_text: req.session.session_text
  });
});

app.get('/choice', function (req, res, next) {
  res.render('choice.html', {
    title: 'Photo or Chart?'
  });
});

app.get('/photo', function (req, res, next) {
  res.render('photo.html', {
    title: 'Use a Photo',
  });
});

app.get('/whotalks', function (req, res, next) {
  res.render('whotalks.html', {
    title: 'Who Talks?',
  });
});

// Helper function
var isInt = function (n) {
  return typeof n === 'number' && n % 1 == 0;
}

app.post('/whotalks', function (req, res, next) {
  // Validate input
  var dude_time = parseInt(req.body.dude_time, 10),
      not_dude_time = parseInt(req.body.not_dude_time, 10);

  // This data is valid, so store it to the session and move along
  req.session.dude_time = dude_time;
  req.session.not_dude_time = not_dude_time;

  if(dude_time + not_dude_time == 0) {
    return res.redirect('whotalks');
  } else {
    return res.redirect('whotalksheadcount');
  }
});

app.get('/whotalksheadcount', function (req, res, next) {
  res.render('whotalks-headcount.html', {
    title: 'Who Talks?',
  });
});

app.get('/share/:id', function (req, res, next) {

  // Get the chart
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.child('plots/'+pie_id);

  plotRef.once('value', function (snapshot) {
    // Firebase has a weird syntax / system. This is how we load the data in
    var refVal = snapshot.val();
    if (!refVal) {
      return res.redirect('/');
    }
    var pie_url = refVal.pie_url;

    // Check if the user just made this chart
    var report_is_new = req.session.lastCreated == pie_url;
    req.session.lastCreated = '';

    // If the pie_url is missing, we need to regenerate it
    if (!pie_url) {
      // Regenerate the URL
    }

    return res.render('share.html', {
      title: 'View Tally',
      is_share: true,
      pie: pie_url,
      pie_id: pie_id,
      session_text: refVal.session_text.replace(/\"/g, "'"),
      hashtag: refVal.hashtag.replace(/\"/g, "'"),
      total_count: refVal.women + refVal.men + refVal.other,
      total_women: refVal.women,
      total_womenofcolor: refVal.womenofcolor,
      report_is_new: report_is_new
    });
  })
});

app.get('/plot/:id', function (req, res, next) {
  var pie_id = req.params.id;
  res.redirect('/share/' + pie_id);
});

app.get('/thankyou/:id', function (req, res, next) {

  // Get the chart
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.child('plots/'+pie_id);

  plotRef.once('value', function (snapshot) {
    // Firebase has a weird syntax / system. This is how we load the data in
    var refVal = snapshot.val();
    if (!refVal) {
      return res.redirect('/');
    }
    var pie_url = refVal.pie_url;

    // Check if the user just made this chart
    var report_is_new = req.session.lastCreated == pie_url;
    req.session.lastCreated = '';

    // If the pie_url is missing, we need to regenerate it
    if (!pie_url) {
      // Regenerate the URL
    }

    return res.render('thankyou.html', {
      title: 'Thank You',
      pie_id: pie_id,
      hashtag: querystring.escape(refVal.hashtag),
    });
  })
});

app.post('/form', function (req, res, next) {

  // Validate input
  var men = parseInt(req.body.men, 10),
      women = parseInt(req.body.women, 10),
      womenofcolor = parseInt(req.body.womenofcolor, 10),
      session_text = req.body.session_text,
      hashtag = req.body.hashtag;

  var hashPattern = new RegExp(/^\#?\S{1,20}$/);
  var sessionPattern = new RegExp(/^.{0,30}$/);

  // TODO - make validation DRY
  if ((!isInt(men) || men < 0)
   || (!isInt(women) || women < 0)
   || (!isInt(womenofcolor) || womenofcolor < 0)
   || !_.isString(session_text)
   || session_text == ""
   || !session_text.match(sessionPattern)
   || !_.isString(hashtag)
   || (hashtag != ""
    && !hashtag.match(hashPattern))) {
    // Send the report page back down
    // This should also handled directly by javascript in the page
    // Put by posting to, the user at least doesn't see a URL change
    // if we need to, re-render it with errors
    return res.render('form.html', {
      title: 'Tally Form',
      men: req.body.men,
      women: req.body.women,
      womenofcolor: req.body.womenofcolor,
      hashtag: req.body.hashtag,
      session_text: req.body.session_text,
      error: {
        men: !isInt(men) || men < 0,
        women: !isInt(women) || women < 0 ,
        womenofcolor: !isInt(womenofcolor) || womenofcolor < 0 ,
        hashtag: !_.isString(session_text) || (hashtag != "" && !hashtag.match(hashPattern)),
        session_text: !_.isString(session_text) || !session_text.match(sessionPattern),
        no_session: session_text == ""
      }
    })
  }

  // Add a hash tag if there isn't one
  if(hashtag != ""
  && hashtag.charAt(0) != "#")
    hashtag = "#" + hashtag;

  // This data is valid, so store it to the session and move along
  req.session.men = men;
  req.session.women = women;
  req.session.womenofcolor = womenofcolor;
  req.session.session_text = session_text;
  req.session.hashtag = hashtag;

  return res.redirect('choice');
});

app.post('/talkschart', function (req, res, next) {
  var dude_time = req.session.dude_time;
  var not_dude_time = req.session.not_dude_time;
  var men = parseInt(req.body.dudecount, 10),
      women = parseInt(req.body.notdudecount, 10),
      session_text = req.body.session_text,
      hashtag = req.body.hashtag;

  var hashPattern = new RegExp(/^\#?\S{1,20}$/);
  var sessionPattern = new RegExp(/^.{0,30}$/);

  // TODO - make validation DRY
  if ((!isInt(men) || men < 0)
   || (!isInt(women) || women < 0)
   || !_.isString(session_text)
   || session_text == ""
   || !session_text.match(sessionPattern)
   || !_.isString(hashtag)
   || (hashtag != ""
    && !hashtag.match(hashPattern))) {
    // Send the report page back down
    // This should also handled directly by javascript in the page
    // Put by posting to, the user at least doesn't see a URL change
    // if we need to, re-render it with errors
    return res.render('whotalks-headcount.html', {
      title: 'Who Talks?',
      dudecount: men,
      notdudecount: women,
      hashtag: req.body.hashtag,
      session_text: req.body.session_text,
      error: {
        dudecount: !isInt(men) || men < 0,
        notdudecount: !isInt(women) || women < 0 ,
        hashtag: !_.isString(session_text) || (hashtag != "" && !hashtag.match(hashPattern)),
        session_text: !_.isString(session_text) || !session_text.match(sessionPattern),
        no_session: session_text == ""
      }
    })
  }

  // Add a hash tag if there isn't one
  if(hashtag != ""
  && hashtag.charAt(0) != "#")
    hashtag = "#" + hashtag;

  // Valid at this point, save
  req.session.men = men;
  req.session.women = women;
  req.session.session_text = session_text;
  req.session.hashtag = hashtag;

  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";

  var totalParticipants = men + women;
  var proportionWomen = women / totalParticipants;

  var totalTime = Math.max(1, (not_dude_time + dude_time));
  var proportionWomenTime = not_dude_time / totalTime;

  var image_parameters = [];
  image_parameters.push(
    '-gravity', 'NorthWest'
  );

  image_parameters.push('-page', '+0+0','assets/base_background.png');
  image_parameters.push('-page', '+0+0','assets/city_background_wire_logo.png');
  image_parameters.push('-page', '+0+130','assets/horizontal_bar.png');

  // Draw the chart
  // Start by assuming only men

  console.log(proportionWomenTime);
  console.log(proportionWomen * .8);
  console.log(proportionWomen);

  if(proportionWomenTime < (proportionWomen * .8)) {
    image_parameters.push(
      '-stroke', '#ff4820',
      '-fill', '#ff4820',
      '-tile', 'assets/stripes_talks.gif',
      '-draw', 'circle 450,500 450,675'
    );
    image_parameters.push(
      '+tile'
    );
  } else {
    image_parameters.push(
      '-stroke', '#ff4820',
      '-fill', '#ff4820',
      '-draw', 'circle 450,500 450,675'
    );
  }

  // Draw in the time women spoke
  if(proportionWomenTime == 1) {
    image_parameters.push(
      '-fill', '#edce63',
      '-stroke', '#edce63',
      '-draw', 'circle 450,500 450,675'
    );
  } else if(proportionWomenTime > 0) {
    var degrees = (proportionWomenTime * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 + 175 * Math.cos(radians);
    var y = 500 + 175 * Math.sin(radians);
    image_parameters.push(
      '-fill', '#edce63',
      '-stroke', '#edce63',
      '-draw', 'path \'M 450,500 L 450,675 A 175,175 0 ' + ((degrees > 270)?1:0) + ',1 ' + x + ',' + y + ' Z\''
    );
  }

  image_parameters.push(
    '-gravity', 'Center',
    '-stroke', '#ffffff',
    '-fill', '#ffffff',
    '-font', 'Arial',
    '-pointsize', '42',
    '-annotate', '+0-240', 'Men made up ' + Math.round((1 - proportionWomen) * 100,0) + '%% of the group.');

  image_parameters.push(
    '-gravity', 'Center',
    '-stroke', '#ff4820',
    '-fill', '#ff4820',
    '-font', 'Arial',
    '-pointsize', '42',
    '-annotate', '+0-190', 'Men spoke ' + Math.round((1 - proportionWomenTime) * 100,0) + '%% of the time.');

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', '#fff',
    '-fill', '#fff',
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+15', session_text);

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', '#fff',
    '-fill', '#fff',
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+65', hashtag);

  image_parameters.push(
    '-layers', 'flatten', card_filename
  );

  // Create the tally
  im.convert(image_parameters, function (err, stdout) {
    if(err)
      return next(err);

    // Upload this local file to imgur
    imgur.setClientID(process.env['IMGUR_API_KEY']);
    imgur.upload(path.join(__dirname, '../' + card_filename), function(error, response) {
      if(error || !response.data) {
        AWS.config.update({accessKeyId: process.env['AWS_ID'], secretAccessKey: process.env['AWS_SECRET']});
        var s3obj = new AWS.S3({params: {Bucket: 'app.genderavenger.org', Key: card_filename}});
        var body = fs.createReadStream(path.join(__dirname, '../' + card_filename));
        s3obj.upload({Body: body}, function(err, data) {
          if('Location' in data && 'ETag' in data) {

            pie_url = data.Location;
            pie_id = data.ETag.slice(1,-1);

            storeChart(pie_id, {
              "session_text": session_text,
              "hashtag": hashtag,
              "men": men,
              "women": women,
              "men_time": dude_time,
              "women_time": not_dude_time,
              "other": 0,
              "type": "whotalks",
              "pie_id": pie_id,
              "pie_url": pie_url
            });

            req.session.lastCreated = pie_url;
            fs.unlink(path.join(__dirname, '../' + card_filename));
            return res.redirect('/share/' + pie_id);
          }
          return next(error);
        });
      }
      else {
        pie_url = response.link;
        pie_id = response.id;
        storeChart(pie_id, {
          "session_text": session_text,
          "hashtag": hashtag,
          "men": dude_time,
          "women": not_dude_time,
          "other": 0,
          "type": "whotalks",
          "pie_id": pie_id,
          "pie_url": pie_url
        });
        fs.unlink(path.join(__dirname, '../' + card_filename));
        req.session.lastCreated = pie_url;
        return res.redirect('/share/' + pie_id);
      }
    });
  });
});


app.post('/chart', function (req, res, next) {

  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";


  if(req.session.womenofcolor > req.session.women) {
    req.session.women += req.session.womenofcolor;
  }
  var proportionWomen = req.session.women / (req.session.women + req.session.men);
  var proportionWomenOfColor = req.session.womenofcolor / (req.session.women + req.session.men);

  var image_parameters = [];
  image_parameters.push(
    '-gravity', 'NorthWest'
  );

  image_parameters.push('-page', '+0+0','assets/base_background.png');
  image_parameters.push('-page', '+0+0','assets/city_background_wire_logo.png');
  image_parameters.push('-page', '+0+130','assets/horizontal_bar.png');

  // Draw the chart
  image_parameters.push(
    '-fill', '#FF0000',
    '-stroke', '#FF0000',
    '-draw', 'circle 450,500 450,700'
  );

  if(proportionWomen > 0) {
    var degrees = (proportionWomen * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 + 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', '#edce63',
      '-stroke', '#edce63',
      '-draw', 'path \'M 450,500 L 450,700 A 200,200 0 ' + ((degrees > 270)?1:0) + ',1 ' + x + ',' + y + ' Z\''
    );
  }
  if(proportionWomenOfColor > 0) {
    var degrees = (proportionWomenOfColor * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 + 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-tile', 'assets/stripes.gif',
      '-draw', 'path \'M 450,500 L 450,700 A 200,200 0 ' + ((degrees > 270)?1:0) + ',1 ' + x + ',' + y + ' Z\''
    );
  }

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', '#edce63',
    '-fill', '#edce63',
    '+tile',
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+75+630', req.session.women + ((req.session.women == 1)?" Woman":" Women"));

  if(req.session.womenofcolor == 0) {
    image_parameters.push(
      '-stroke', '#000000',
      '-fill', '#d87111',
      '-draw', 'rectangle 65,665 360,707');

    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#ffffff',
      '-fill', '#ffffff',
      '-font', 'Arial',
      '-pointsize', '30',
      '-annotate', '+75+670', "No Women of Color!");
  } else {
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#d87111',
      '-fill', '#d87111',
      '-font', 'Arial',
      '-pointsize', '30',
      '-annotate', '+75+670', req.session.womenofcolor + ((req.session.womenofcolor == 1)?" Woman of Color":" Women of Color"));
  }
  image_parameters.push(
    '-gravity', 'NorthEast',
    '-stroke', '#FF0000',
    '-fill', '#FF0000',
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+125+630', req.session.men + ((req.session.men == 1)?" Man":" Men"));

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', '#fff',
    '-fill', '#fff',
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+160', req.session.session_text);

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', '#fff',
    '-fill', '#fff',
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+210', req.session.hashtag);

  if( proportionWomen > .4 ) {
    image_parameters.push('-page', '+620+40','assets/icon_sunny_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#fff',
      '-fill', '#fff',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "THE PRESENT AND FUTURE");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#fff',
      '-fill', '#fff',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "ARE");
    if(req.session.womenofcolor == 0) {
      image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#d87111',
          '-fill', '#d87111',
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+130+65', "ALMOST");
      image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#edce63',
          '-fill', '#edce63',
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+310+65', "BRIGHT");
    } else {
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', '#edce63',
        '-fill', '#edce63',
        '-font', 'ArialB',
        '-pointsize', '40',
        '-annotate', '+130+65', "BRIGHT");
    }
  } else if ( proportionWomen > .3 ) {
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');

    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#fff',
      '-fill', '#fff',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "CLOUDY WITH A");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#fff',
      '-fill', '#fff',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "CHANCE OF ");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#FF0000',
      '-fill', '#FF0000',
      '-font', 'ArialB',
      '-pointsize', '42',
      '-annotate', '+300+65', "PATRIARCHY");

  } else {
    image_parameters.push('-page', '+620+40','assets/icon_thunder_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#fff',
      '-fill', '#fff',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "A THUNDERSTORM OF");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#fff',
      '-fill', '#fff',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "GENDER");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', '#FF0000',
      '-fill', '#FF0000',
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+230+65', "INEQUALITY");
  }

  image_parameters.push(
    '-layers', 'flatten', card_filename
  );

  // Create the tally
  im.convert(image_parameters, function (err, stdout) {
    if(err)
      return next(err);

    // Upload this local file to imgur
    imgur.setClientID(process.env['IMGUR_API_KEY']);
    imgur.upload(path.join(__dirname, '../' + card_filename), function(error, response) {
      if(error || !response.data) {
        AWS.config.update({accessKeyId: process.env['AWS_ID'], secretAccessKey: process.env['AWS_SECRET']});
        var s3obj = new AWS.S3({params: {Bucket: 'app.genderavenger.org', Key: card_filename}});
        var body = fs.createReadStream(path.join(__dirname, '../' + card_filename));
        s3obj.upload({Body: body}, function(err, data) {
          if('Location' in data && 'ETag' in data) {

            pie_url = data.Location;
            pie_id = data.ETag.slice(1,-1);

            storeChart(pie_id, {
              "session_text": req.session.session_text,
              "hashtag": req.session.hashtag,
              "men": req.session.men,
              "women": req.session.women,
              "other": 0,
              "pie_id": pie_id,
              "pie_url": pie_url
            });

            req.session.lastCreated = pie_url;
            fs.unlink(path.join(__dirname, '../' + card_filename));
            return res.redirect('/share/' + pie_id);
          }
          return next(error);
        });
      }
      else {
        pie_url = response.link;
        pie_id = response.id;
        storeChart(pie_id, {
          "session_text": req.session.session_text,
          "hashtag": req.session.hashtag,
          "men": req.session.men,
          "women": req.session.women,
          "other": 0,
          "pie_id": pie_id,
          "pie_url": pie_url
        });
        fs.unlink(path.join(__dirname, '../' + card_filename));
        req.session.lastCreated = pie_url;
        return res.redirect('/share/' + pie_id);
      }
    });
  });
});

app.post('/photo', upload.single('photo'), function (req, res, next) {

  // Prep the output files
  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";

  // Set up the image pieces
  im.convert([
    '-auto-orient',
    req.file.path,
    '-resize',
    '900',
    req.file.path
  ], function(err, stdout, stderr) {
    if (err) throw err;

    if(req.session.womenofcolor > req.session.women) {
      req.session.women += req.session.womenofcolor;
    }
    var proportionWomen = req.session.women / (req.session.women + req.session.men);
    var proportionWomenOfColor = req.session.womenofcolor / (req.session.women + req.session.men);

      var image_parameters = [];
      image_parameters.push(
        '-gravity', 'NorthWest'
      );

      image_parameters.push('-page', '+0+0','assets/base_background.png');
      image_parameters.push('-page', '+0+0',req.file.path);
      image_parameters.push('-page', '+0+0','assets/photo_logo.png');
      image_parameters.push('-page', '+0+0','assets/photo_background.png');

      // Draw the chart
      image_parameters.push(
        '-fill', '#ff4820',
        '-stroke', '#ff4820',
        '-draw', 'rectangle 50,790 850,840'
      );

      if(proportionWomen > 0) {
        var right = 50 + 800 * proportionWomen;
        image_parameters.push(
          '-fill', '#edce63',
          '-stroke', '#edce63',
          '-draw', 'rectangle 50,790 ' + right + ',840'
        );
      }
      if(proportionWomenOfColor > 0) {
        var right = 50 + 800 * proportionWomenOfColor;
        image_parameters.push(
          '-fill', '#d87111',
          '-stroke', '#d87111',
          '-draw', 'rectangle 50,790 ' + right + ',840'
        );
      }
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', '#edce63',
        '-fill', '#edce63',
        '-font', 'Arial',
        '-pointsize', '24',
        '-annotate', '+50+845', req.session.women + ((req.session.women == 1)?" Woman":" Women"));

      if(req.session.womenofcolor == 0) {
        image_parameters.push(
          '-stroke', '#000000',
          '-fill', '#d87111',
          '-draw', 'rectangle 40,871 280,900');

        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#ffffff',
          '-fill', '#ffffff',
          '-font', 'Arial',
          '-pointsize', '24',
          '-annotate', '+50+873', "No Women of Color!");
      } else {
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#d87111',
          '-fill', '#d87111',
          '-font', 'Arial',
          '-pointsize', '24',
          '-annotate', '+50+875', req.session.womenofcolor + ((req.session.womenofcolor == 1)?" Woman of Color":" Women of Color"));
      }
      image_parameters.push(
        '-gravity', 'NorthEast',
        '-stroke', '#ff4820',
        '-fill', '#ff4820',
        '-font', 'Arial',
        '-pointsize', '24',
        '-annotate', '+50+845', req.session.men + ((req.session.men == 1)?" Man":" Men"));

      var text = req.session.session_text + " " + req.session.hashtag;

      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', '#fff',
        '-fill', '#fff',
        '-font', 'Arial',
        '-pointsize', '40',
        '-annotate', '+50+735', text);

      if( proportionWomen > .4 ) {
        image_parameters.push('-page', '+620+470','assets/icon_sunny.png');
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#fff',
          '-fill', '#fff',
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+50+640', "THE PRESENT AND FUTURE");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#fff',
          '-fill', '#fff',
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+50+685', "ARE");
        if(req.session.womenofcolor == 0) {
          image_parameters.push(
              '-gravity', 'NorthWest',
              '-stroke', '#d87111',
              '-fill', '#d87111',
              '-font', 'ArialB',
              '-pointsize', '40',
              '-annotate', '+145+685', "ALMOST");
          image_parameters.push(
              '-gravity', 'NorthWest',
              '-stroke', '#edce63',
              '-fill', '#edce63',
              '-font', 'ArialB',
              '-pointsize', '40',
              '-annotate', '+325+685', "BRIGHT");
        } else {
          image_parameters.push(
            '-gravity', 'NorthWest',
            '-stroke', '#edce63',
            '-fill', '#edce63',
            '-font', 'ArialB',
            '-pointsize', '40',
            '-annotate', '+145+685', "BRIGHT");
        }
      } else if ( proportionWomen > .3 ) {
        image_parameters.push('-page', '+620+470','assets/icon_cloudy.png');

        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#fff',
          '-fill', '#fff',
          '-font', 'ArialB',
          '-pointsize', '42',
          '-annotate', '+50+640', "CLOUDY WITH A");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#fff',
          '-fill', '#fff',
          '-font', 'ArialB',
          '-pointsize', '42',
          '-annotate', '+50+685', "CHANCE OF ");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#FF0000',
          '-fill', '#FF0000',
          '-font', 'ArialB',
          '-pointsize', '42',
          '-annotate', '+310+685', "PATRIARCHY");

      } else {
        image_parameters.push('-page', '+620+470','assets/icon_thunder.png');
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#fff',
          '-fill', '#fff',
          '-font', 'ArialB',
          '-pointsize', '42',
          '-annotate', '+50+640', "A THUNDERSTORM OF");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#fff',
          '-fill', '#fff',
          '-font', 'ArialB',
          '-pointsize', '42',
          '-annotate', '+50+685', "GENDER");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', '#FF0000',
          '-fill', '#FF0000',
          '-font', 'ArialB',
          '-pointsize', '42',
          '-annotate', '+245+685', "INEQUALITY");
      }

      image_parameters.push(
        '-layers', 'flatten', card_filename
      );

      // Create the tally
      im.convert(image_parameters, function (err, stdout) {
        if(err) {
          return next(err);
        } else {

          // Upload this local file to imgur
          imgur.setClientID(process.env['IMGUR_API_KEY']);
          imgur.upload(path.join(__dirname, '../' + card_filename), function(error, response) {
            if(error || !response.data) {
              AWS.config.update({accessKeyId: process.env['AWS_ID'], secretAccessKey: process.env['AWS_SECRET']});
              var s3obj = new AWS.S3({params: {Bucket: 'app.genderavenger.org', Key: card_filename}});
              var body = fs.createReadStream(path.join(__dirname, '../' + card_filename));
              s3obj.upload({Body: body}, function(err, data) {
                if('Location' in data && 'ETag' in data) {

                  pie_url = data.Location;
                  pie_id = data.ETag.slice(1,-1);

                  storeChart(pie_id, {
                    "session_text": req.session.session_text,
                    "hashtag": req.session.hashtag,
                    "men": req.session.men,
                    "women": req.session.women,
                    "other": 0,
                    "pie_id": pie_id,
                    "pie_url": pie_url
                  });

                  fs.unlink(req.file.path);
                  fs.unlink(path.join(__dirname, '../' + card_filename));
                  req.session.lastCreated = pie_url;
                  return res.redirect('/share/' + pie_id);
                }
                return next(error,null);
              });
            }
            else {
              pie_url = response.link;
              pie_id = response.id;
              storeChart(pie_id, {
                "session_text": req.session.session_text,
                "hashtag": req.session.hashtag,
                "men": req.session.men,
                "women": req.session.women,
                "other": 0,
                "pie_id": pie_id,
                "pie_url": pie_url
              });
              fs.unlink(req.file.path);
              fs.unlink(path.join(__dirname, '../' + card_filename));
              req.session.lastCreated = pie_url;
              return res.redirect('/share/' + pie_id);
            }
          });
        }
      });
  });
});

function storeChart(pie_id, data) {

    // Create a database entry for this pie_id
    var plotRef = firebaseDatastore.child('plots/' + pie_id);

    // And a timestamp
    var timestamp = new Date();
    data.timestamp = timestamp.toString();
    data["unicode-timestamp"] = timestamp.getTime();

    // Save the data
    plotRef.set(data);
    plotRef.setPriority(timestamp.getTime());

    return plotRef;
}

app.post('/anonymous/:id', function (req, res, next) {
  // Route that will generate an email request to submit things anonymously

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
    var fullUrl = req.protocol + '://' + req.get('host') + "/share/" + pie_id;

    // Send an anonymous submit alert
    var data = {
      text: 'A new anonymous GA Tally request: ' + fullUrl,
    };

    request({
      url: process.env['SLACK_WEBHOOK'],
      method: "POST",
      json: true,
      body: data
    });

    return res.redirect('/thankyou/'+pie_id);
  });
});

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
