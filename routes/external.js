var http   = require('http'),
    https   = require('https'),
    fs     = require('fs'),
    imgur  = require('imgur'),
    path   = require('path'),
    im     = require('node-imagemagick'),
    uuid   = require('uuid'),
    app = require('../server').app,
    querystring = require('querystring'),
    nodemailer = require('nodemailer'),
    firebaseDatastore = require('../server').firebaseDatastore,
    AWS = require('aws-sdk'),
    multer  = require('multer'),
    request = require('request'),
    BallotLookup = require('../lib/BallotLookup');

var upload = multer({ dest: 'uploads/' })


const red = '#ef4035';
const gold = '#edce63';
const blue = '#041e42';
const white = '#ffffff';
const black = '#222222';
const purple = '#9E84CB';
const orange = '#d87111';

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

  // Is a version being passed?
  var version = parseInt(req.query.version);
  if(version) {
    res.cookie('version', version);
  }

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
  res.render('core/intro.html', {
    title: 'Introduction',
  });
});

app.get('/toolselect', function (req, res, next) {
  res.render('core/tool_select.html', {
    title: 'What do you want to do?',
  });
});

app.get('/tally', function (req, res, next) {
  res.render('tally/headcount.html', {
    title: 'GA Tally',
    men: req.session.men,
    women: req.session.women,
    womenofcolor: req.session.womenofcolor,
    nonbinary: req.session.nonbinary,
  });
});

app.get('/tally/details', function (req, res, next) {
  res.render('tally/details.html', {
    title: 'Event Details',
    hashtag: req.session.hashtag,
    session_text: req.session.session_text
  });
});

app.get('/tally/photochoice', function (req, res, next) {
  res.render('tally/photo_choice.html', {
    title: 'Photo or Chart?'
  });
});

app.get('/tally/photo', function (req, res, next) {
  res.render('tally/photo.html', {
    title: 'Use a Photo',
  });
});

app.get('/whotalks/choice', function (req, res, next) {
  res.render('whotalks/choice.html', {
    title: 'Who Talks?'
  });
});

app.get('/whotalks', function (req, res, next) {
  // It's OK to use || since falsy values *should* default to 0
  var not_dude_of_color_time = req.session.not_dude_of_color_time || 0;
  var not_dude_time = req.session.not_dude_time || 0;
  var dude_time = req.session.dude_time || 0;

  res.render('whotalks/timer.html', {
    title: 'Who Talks?',
    dude_time: dude_time,
    not_dude_time: not_dude_time,
    not_dude_of_color_time: not_dude_of_color_time,
    manual_mode: req.query.manual
  });
});

app.get('/ballotmania', function (req, res, next) {
  var zip = req.session.zip || '';

  res.render('ballotmania/zip.html', {
    zip: zip,
  })
});

app.get('/ballotmania/tutorial', function (req, res, next) {
  res.render('ballotmania/tutorial.html')
});

app.post('/ballotmania', function (req, res, next) {
  var zip = req.body.zip;
  req.session.zip = zip;
  var zipPattern = new RegExp(/^\d{5}$/);
  if (!zip.match(zipPattern)) {
    return res.render('ballotmania/zip.html', {
      title: 'Zip Entry',
      zip: zip,
      error: {
        zip: !zip.match(zipPattern),
      }
    })
  }

  var ballotLookup = new BallotLookup(zip);
  ballotLookup.run(function(offices) {
    req.session.offices = offices;
    res.redirect('ballotmania/ballot');
  })
});

app.get('/votes/1', function (req, res, next) {
  res.render('votes/1.html')
})
app.get('/votes/2', function (req, res, next) {
  res.render('votes/2.html')
})
app.get('/votes/3', function (req, res, next) {
  res.render('votes/3.html')
})
app.get('/votes/4', function (req, res, next) {
  res.render('votes/4.html')
})

app.get('/ballotmania/ballot', function (req, res, next) {
  var offices = req.session.offices || [];
  res.render('ballotmania/ballot.html', {
    offices: offices,
    noCandidates: offices.length === 0,
  })
})

app.post('/ballotmania/ballot', function (req, res, next) {
  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var social_share_text = "";
  req.session.women = parseInt(req.body.women, 10);
  req.session.men = parseInt(req.body.men, 10);
  req.session.nonbinary = parseInt(req.body.nonbinary, 10);
  req.session.hashtag = "#ballotmania";

  req.session.session_text = "Candidates on the ballot";
  if (req.session.zip) {
    req.session.session_text = "Candidates in " + req.session.zip;
  }

  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";

  var proportionWomen = req.session.women / (req.session.women + req.session.men + req.session.nonbinary);
  var proportionNonbinary = req.session.nonbinary / (req.session.women + req.session.men + req.session.nonbinary);

  var image_parameters = [];
  image_parameters.push(
    '-gravity', 'NorthWest'
  );

  image_parameters.push('-page', '+0+0','assets/base_background.png');
  image_parameters.push('-page', '+0+10','assets/city_background_ballotmania.png');
  image_parameters.push('-page', '+0+130','assets/horizontal_bar.png');

  // Draw the chart
  if(req.session.men == 0) {
    image_parameters.push(
      '-fill', red,
      '-stroke', red,
      '-draw', 'circle 450,500 450,700'
    );
  } else {
    image_parameters.push(
      '-fill', red,
      '-stroke', red,
      '-draw', 'circle 450,500 450,700'
    );
  }
  if(proportionWomen > 0) {
    var degrees = (proportionWomen * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 + 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', gold,
      '-stroke', gold,
      '-draw', 'path \'M 450,500 L 450,700 A 200,200 0 ' + ((degrees > 270)?1:0) + ',1 ' + x + ',' + y + ' Z\''
    );
  }

  if(proportionNonbinary > 0) {
    var degrees = (proportionNonbinary * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 - 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', purple,
      '-stroke', purple,
      '-draw', 'path \'M 450,500 L 450,700 A 200,200 0 ' + ((degrees > 270)?1:0) + ',' + ((degrees > 270)?0:0)  + ' ' + x + ',' + y + ' Z\''
    );
  }
  if(proportionNonbinary == 1) {
    var degrees = (proportionNonbinary * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 - 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', purple,
      '-stroke', purple,
      '-draw', 'circle 450,500 450,700'
    );
  }

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+75+630', req.session.women + ((req.session.women == 1)?" Woman":" Women"));

  if(req.session.nonbinary > 0) {
    image_parameters.push(
      '-gravity', 'Center',
      '-stroke', purple,
      '-fill', purple,
      '-font', 'Arial',
      '-pointsize', '30',
      '-annotate', '+0+280', req.session.nonbinary + ((req.session.nonbinary == 1)?" Nonbinary Person":" Nonbinary Persons"));
  }

  image_parameters.push(
    '-gravity', 'NorthEast',
    '-stroke', red,
    '-fill', red,
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+125+630', req.session.men + ((req.session.men == 1)?" Man":" Men"));

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+160', req.session.session_text);

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+210', req.session.hashtag);

  if( proportionWomen + proportionNonbinary >= .35 ) {
    image_parameters.push('-page', '+620+40','assets/ballotmania_icons_positive.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "THERE ARE WOMEN");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "ON MY BALLOT");
    social_share_text = "There are women on my ballot. Keep it this way: https://www.genderavenger.com/ballotmania#partners"
  } else if ( proportionWomen + proportionNonbinary > .3 ) {
    image_parameters.push('-page', '+620+40','assets/ballotmania_icons_neutral.png');

    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "NOT ENOUGH WOMEN");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "ON MY BALLOT");
    social_share_text = "There are not enough women on the ballot! Make change: https://www.genderavenger.com/ballotmania#partners"
  } else if (proportionWomen === 0){
    image_parameters.push('-page', '+620+40','assets/ballotmania_icons_negative.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "WHERE ARE THE WOMEN");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "ON MY BALLOT?");
    social_share_text = "Where are the women on my ballot? Help find some: https://www.genderavenger.com/ballotmania#partners"
  } else {
    image_parameters.push('-page', '+620+40','assets/ballotmania_icons_negative.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "BARELY ANY WOMEN");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "ON MY BALLOT");
    social_share_text = "Barely any women on my ballot. Encourage more: https://www.genderavenger.com/ballotmania#partners"
  }

  image_parameters.push(
    '-layers', 'flatten', card_filename
  );

  // Create the tally
  im.convert(image_parameters, function (err, stdout) {
    if(err)
      return next(err);

    // Upload this local file to imgur
    imgur.setClientId(process.env['IMGUR_API_KEY']);
    imgur.uploadFile(path.join(__dirname, '../' + card_filename))
      .then(function(error, response) {
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
              "pie_url": pie_url,
              "social_share_text": social_share_text,
            });

            req.session.lastCreated = pie_url;
            fs.unlinkSync(path.join(__dirname, '../' + card_filename));
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
          "pie_url": pie_url,
          "social_share_text": social_share_text,
        });
        fs.unlinkSync(path.join(__dirname, '../' + card_filename));
        req.session.lastCreated = pie_url;
        return res.redirect('/share/' + pie_id);
      }
    });
  });
});

// Helper function
var isInt = function (n) {
  return typeof n === 'number' && n % 1 == 0;
}

app.post('/whotalks', function (req, res, next) {
  // Validate input
  var dude_time = parseInt(req.body.dude_time, 10),
      not_dude_time = parseInt(req.body.not_dude_time, 10),
      not_dude_of_color_time = parseInt(req.body.not_dude_of_color_time, 10);

  // This data is valid, so store it to the session and move along
  req.session.dude_time = dude_time;
  req.session.not_dude_time = not_dude_time;
  req.session.not_dude_of_color_time = not_dude_of_color_time;

  if(dude_time + not_dude_time == 0) {
    return res.redirect('whotalks');
  } else {
    return res.redirect('whotalks/headcount');
  }
});

app.get('/whotalks/headcount', function (req, res, next) {
  res.render('whotalks/headcount.html', {
    title: 'Who Talks?',
  });
});

app.get('/share/:id', function (req, res, next) {

  // Get the chart
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.ref('plots/'+pie_id);

  plotRef.once('value', function (snapshot) {
    // Firebase has a weird syntax / system. This is how we load the data in
    var refVal = snapshot.val();
    if (!refVal) {
      return res.redirect('/');
    }
    var pie_url = refVal.pie_url;
    social_share_text = refVal.social_share_text || "";
    if(social_share_text != "") {
      social_share_text = social_share_text + " ";
    }

    // Check if the user just made this chart
    var report_is_new = req.session.lastCreated == pie_url;
    req.session.lastCreated = '';

    // If the pie_url is missing, we need to regenerate it
    if (!pie_url) {
      // Regenerate the URL
    }

    return res.render('core/share.html', {
      title: 'View Tally',
      is_share: true,
      pie: pie_url,
      pie_id: pie_id,
      session_text: refVal.session_text.replace(/\"/g, "'"),
      hashtag: querystring.escape(refVal.hashtag.replace(/\"/g, "'")),
      total_count: refVal.women + refVal.men + refVal.other,
      total_women: refVal.women,
      total_womenofcolor: refVal.womenofcolor,
      report_is_new: report_is_new,
      version: req.cookies['version'],
      social_share_text: social_share_text,
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
  var plotRef = firebaseDatastore.ref('plots/'+pie_id);

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

    return res.render('core/thanks.html', {
      title: 'Thank You',
      pie_id: pie_id,
      hashtag: querystring.escape(refVal.hashtag),
    });
  })
});

app.post('/tally', function (req, res, next) {

  // Validate input
  var men = parseInt(req.body.men, 10),
      women = parseInt(req.body.women, 10),
      womenofcolor = parseInt(req.body.womenofcolor, 10),
      nonbinary = parseInt(req.body.nonbinary, 10);

  // TODO - make validation DRY
  if ((!isInt(men) || men < 0)
   || (!isInt(women) || women < 0)
   || (!isInt(womenofcolor) || womenofcolor < 0)
   || (!isInt(nonbinary) || nonbinary < 0)) {
    return res.render('tally/headcount.html', {
      title: 'Tally Form',
      men: req.body.men,
      women: req.body.women,
      womenofcolor: req.body.womenofcolor,
      nonbinary: req.body.nonbinary,
      error: {
        men: !isInt(men) || men < 0,
        women: !isInt(women) || women < 0 ,
        womenofcolor: !isInt(womenofcolor) || womenofcolor < 0 ,
        nonbinary: !isInt(nonbinary) || nonbinary < 0
      }
    })
  }

  // This data is valid, so store it to the session and move along
  req.session.men = men;
  req.session.women = women;
  req.session.womenofcolor = womenofcolor;
  req.session.nonbinary = nonbinary;
  return res.redirect('tally/details');
});

app.post('/tally/details', function (req, res, next) {

  // Validate input
  var session_text = req.body.session_text,
      hashtag = req.body.hashtag;

  var hashPattern = new RegExp(/^\#?\S{1,20}$/);
  var sessionPattern = new RegExp(/^.{0,30}$/);

  // TODO - make validation DRY
  if (typeof session_text !== "string"
   || session_text == ""
   || !session_text.match(sessionPattern)
   || typeof hashtag !== "string"
   || (hashtag != ""
    && !hashtag.match(hashPattern))) {
    return res.render('tally/details.html', {
      title: 'Event Details',
      hashtag: req.body.hashtag,
      session_text: req.body.session_text,
      error: {
        hashtag: (typeof session_text !== "string") || (hashtag != "" && !hashtag.match(hashPattern)),
        session_text: (typeof session_text !== "string") || !session_text.match(sessionPattern),
        no_session: session_text == ""
      }
    })
  }

  // Add a hash tag if there isn't one
  if(hashtag != ""
  && hashtag.charAt(0) != "#")
    hashtag = "#" + hashtag;

  // This data is valid, so store it to the session and move along
  req.session.session_text = session_text;
  req.session.hashtag = hashtag;

  return res.redirect('/tally/photochoice');
});

app.post('/whotalks/chart', function (req, res, next) {
  var dude_time = req.session.dude_time;
  var not_dude_time = req.session.not_dude_time;
  var not_dude_of_color_time = req.session.not_dude_of_color_time;
  var men = parseInt(req.body.dudecount, 10),
      women_white = parseInt(req.body.notdudecount, 10),
      women_of_color = parseInt(req.body.notdudeofcolorcount, 10),
      women = women_white + women_of_color,
      session_text = req.body.session_text,
      hashtag = req.body.hashtag;

  var hashPattern = new RegExp(/^\#?\S{1,20}$/);
  var sessionPattern = new RegExp(/^.{0,30}$/);

  // TODO - make validation DRY
  if ((!isInt(men) || men < 0)
   || (!isInt(women_white) || women_white < 0)
   || (!isInt(women_of_color) || women_of_color < 0)
   || (typeof session_text !== "string")
   || session_text == ""
   || !session_text.match(sessionPattern)
   || (typeof hashtag !== "string")
   || (hashtag != ""
    && !hashtag.match(hashPattern))) {
    // Send the report page back down
    // This should also handled directly by javascript in the page
    // Put by posting to, the user at least doesn't see a URL change
    // if we need to, re-render it with errors
    return res.render('whotalks/headcount.html', {
      title: 'Who Talks?',
      dudecount: men,
      notdudecount: women_white,
      notdudeofcolorcount: women_of_color,
      hashtag: req.body.hashtag,
      session_text: req.body.session_text,
      error: {
        dudecount: !isInt(men) || men < 0,
        notdudecount: !isInt(women_white) || women_white < 0 ,
        notdudeofcolorcount: !isInt(women_of_color) || women_of_color < 0 ,
        hashtag: (typeof session_text !== "string") || (hashtag != "" && !hashtag.match(hashPattern)),
        session_text: (typeof session_text !== "string") || !session_text.match(sessionPattern),
        no_session: session_text == ""
      }
    })
  }

  // Add a hash tag if there isn't one
  if(hashtag != ""
  && hashtag.charAt(0) != "#")
    hashtag = "#" + hashtag;

  // Valid at this point, save
  req.session.not_dude_time = 0;
  req.session.not_dude_of_color_time = 0;
  req.session.dude_time = 0;
  req.session.men = men;
  req.session.women_white = women_white;
  req.session.women_of_color = women_of_color;
  req.session.session_text = session_text;
  req.session.hashtag = hashtag;

  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var social_share_text = "";

  var totalParticipants = men + women;
  var proportionWomen = Math.round(women / totalParticipants * 100) / 100;
  var proportionWhiteWomen = Math.round(women_white / totalParticipants * 100) / 100;
  var proportionWomenOfColor = Math.round(women_of_color / totalParticipants * 100) / 100;

  var totalTime = Math.max(1, (not_dude_time + not_dude_of_color_time + dude_time));
  var totalWomenTime = not_dude_time + not_dude_of_color_time;
  var proportionWomenTime = Math.round((not_dude_time + not_dude_of_color_time) / totalTime * 100) / 100;
  var proportionWhiteWomenTime = Math.round(not_dude_time / totalTime * 100) / 100;
  var proportionWomenOfColorTime = Math.round(not_dude_of_color_time / totalTime * 100) / 100;

  var image_parameters = [];
  image_parameters.push(
    '-gravity', 'NorthWest'
  );

  image_parameters.push('-page', '+0+0','assets/base_background.png');
  image_parameters.push('-page', '+0+0','assets/city_background_wire_logo.png');
  image_parameters.push('-page', '+0+130','assets/horizontal_bar.png');

  // Label categories...
  if (proportionWomen >= .5
  && proportionWomenOfColor >= .2
  && proportionWomenTime >= .9 * proportionWomen
  && proportionWomenOfColorTime >= .9 * proportionWomenOfColor) {
    // Sunny and bright
    image_parameters.push('-page', '+620+40','assets/icon_sunny_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+30+20', "THE PRESENT AND FUTURE");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+30+65', "ARE");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', gold,
      '-fill', gold,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+125+65', "BRIGHT");
  } else if (proportionWomen >= .5
  && proportionWomenTime < .9 * proportionWomen) {
    // Men talked too much
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+35+20', "WOMEN / NONBINARY PEOPLE");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', red,
      '-fill', red,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+35+65', "COULDN'T GET A WORD IN");
  } else if (proportionWomen < .5
  && proportionWomenTime >= .9 * proportionWomen
  && totalWomenTime > 0) {
    // Not enough women
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+30+20', "THERE WERE");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', red,
      '-fill', red,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+30+65', "TOO MANY MEN");
  } else if (proportionWomen >= .5
  && proportionWomenTime >= .9 * proportionWomen
  && totalWomenTime > 0
  && proportionWomenOfColor >= .2
  && proportionWomenOfColorTime < .9 * proportionWomenOfColor) {
    // Men and white people talked too much
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+35+20', "WOMEN / NONBINARY BIPOC");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', orange,
      '-fill', orange,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+35+65', "COULDN'T GET A WORD IN");
  } else if (proportionWomen >= .5
  && proportionWomenTime >= .9 * proportionWomen
  && totalWomenTime > 0
  && proportionWomenOfColor < .2
  && proportionWomenOfColorTime >= .9 * proportionWomenOfColor) {
    // Not enough women of color
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+35+20', "WE NEEDED MORE");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', orange,
      '-fill', orange,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+35+65', "WOMEN / NONBINARY BIPOC");
  } else if (proportionWomen >= .5
  && proportionWomenTime >= .9 * proportionWomen
  && totalWomenTime > 0
  && proportionWomenOfColor < .2
  && proportionWomenOfColorTime <= .9 * proportionWomenOfColor) {
    // Not enough women of color
    image_parameters.push('-page', '+620+40','assets/icon_thunder_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+30+30', "A THUNDERSTORM OF");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '36',
      '-annotate', '+30+80', "INTERSECTIONAL INEQUALITY");
  } else {
    // Thunderstorm
    image_parameters.push('-page', '+620+40','assets/icon_thunder_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "A THUNDERSTORM OF");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "GENDER");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', red,
      '-fill', red,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+230+65', "INEQUALITY");
  }

  ///////////////////////////
  // Draw the talk time chart
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'ArialB',
    '-pointsize', '32',
    '-annotate', '+70+310', "Talk Time");

  // Bars
  // Men bars
  if(proportionWomenTime < (proportionWomen * .9)) {
    image_parameters.push(
      '-stroke', red,
      '-fill', red,
      '-tile', 'assets/stripes_talks.gif',
      '-draw', 'rectangle 70,350 170,700'
    );
    image_parameters.push(
      '+tile'
    );
  } else {
    image_parameters.push(
      '-stroke', red,
      '-fill', red,
      '-draw', 'rectangle 70,350 170,700'
    );
  }

  // Not-men bars (white)
  womenBarHeight = proportionWomenTime * 350
  womenBarY = 700 - womenBarHeight
  image_parameters.push(
    '-stroke', gold,
    '-fill', gold,
    '-draw', `rectangle 70,${womenBarY} 170,700`
  );

  // Not-men bars (BIPOC)
  womenOfColorBarHeight = proportionWomenOfColorTime * 350
  womenOfColorBarY = 700 - womenOfColorBarHeight
  image_parameters.push(
    '-stroke', orange,
    '-fill', orange,
    '-draw', `rectangle 70,${womenOfColorBarY} 170,700`
  );

  // Labels
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', red,
    '-fill', red,
    '-font', 'ArialB',
    '-pointsize', '40',
    '-annotate', '+200+360', `${Math.round((1 - proportionWomenTime) * 100)}%`);
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', red,
    '-fill', red,
    '-font', 'ArialB',
    '-pointsize', '24',
    '-annotate', '+200+400', "Men");

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'ArialB',
    '-pointsize', '40',
    '-annotate', '+200+475', `${Math.round(proportionWhiteWomenTime * 100)}%`);
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'ArialB',
    '-pointsize', '24',
    '-annotate', '+200+515', "Women / Nonbinary");
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'ArialB',
    '-pointsize', '18',
    '-annotate', '+200+540', "(White)");

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'ArialB',
    '-pointsize', '40',
    '-annotate', '+200+615', `${Math.round(proportionWomenOfColorTime * 100)}%`);
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'ArialB',
    '-pointsize', '24',
    '-annotate', '+200+655', "Women / Nonbinary");
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'ArialB',
    '-pointsize', '18',
    '-annotate', '+200+680', "(BIPOC)");

  ///////////////////////////
  // Draw the attendance chart
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'ArialB',
    '-pointsize', '32',
    '-annotate', '+490+310', "Attendance");

  // Bars
  // Men bars
  image_parameters.push(
    '-stroke', red,
    '-fill', red,
    '-draw', 'rectangle 490,350 590,700'
  );

  // Not-men bars (white)
  womenBarHeight = proportionWomen * 350
  womenBarY = 700 - womenBarHeight
  image_parameters.push(
    '-stroke', gold,
    '-fill', gold,
    '-draw', `rectangle 490,${womenBarY} 590,700`
  );

  // Not-men bars (BIPOC)
  womenOfColorBarHeight = proportionWomenOfColor * 350
  womenOfColorBarY = 700 - womenOfColorBarHeight
  image_parameters.push(
    '-stroke', orange,
    '-fill', orange,
    '-draw', `rectangle 490,${womenOfColorBarY} 590,700`
  );
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', red,
    '-fill', red,
    '-font', 'ArialB',
    '-pointsize', '40',
    '-annotate', '+620+360', `${Math.round((1 - proportionWomen) * 100)}%`);
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', red,
    '-fill', red,
    '-font', 'ArialB',
    '-pointsize', '24',
    '-annotate', '+620+400', "Men");

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'ArialB',
    '-pointsize', '40',
    '-annotate', '+620+475', `${Math.round(proportionWhiteWomen * 100)}%`);
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'ArialB',
    '-pointsize', '24',
    '-annotate', '+620+515', "Women / Nonbinary");
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'ArialB',
    '-pointsize', '18',
    '-annotate', '+620+540', "(White)");

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'ArialB',
    '-pointsize', '40',
    '-annotate', '+620+615', `${Math.round(proportionWomenOfColor * 100)}%`);
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'ArialB',
    '-pointsize', '24',
    '-annotate', '+620+655', "Women / Nonbinary");
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'ArialB',
    '-pointsize', '18',
    '-annotate', '+620+680', "(BIPOC)");

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+30+160', req.session.session_text);

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+30+210', req.session.hashtag);

  image_parameters.push(
    '-layers', 'flatten', card_filename
  );

  // Create the tally
  im.convert(image_parameters, function (err, stdout) {
    if(err)
      return next(err);

    // Upload this local file to imgur
    imgur.setClientId(process.env['IMGUR_API_KEY']);
    imgur.uploadFile(path.join(__dirname, '../' + card_filename))
      .then(function(error, response) {
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
              "pie_url": pie_url,
              "social_share_text": social_share_text,
            });

            req.session.lastCreated = pie_url;
            fs.unlinkSync(path.join(__dirname, '../' + card_filename));
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
          "pie_url": pie_url,
          "social_share_text": social_share_text,
        });
        fs.unlinkSync(path.join(__dirname, '../' + card_filename));
        req.session.lastCreated = pie_url;
        return res.redirect('/share/' + pie_id);
      }
    });
  });
});


app.post('/tally/chart', function (req, res, next) {

  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var social_share_text = "";

  if(req.session.womenofcolor > req.session.women) {
    req.session.women += req.session.womenofcolor;
  }
  var proportionWomen = req.session.women / (req.session.women + req.session.men + req.session.nonbinary);
  var proportionWomenOfColor = req.session.womenofcolor / (req.session.women + req.session.men + req.session.nonbinary);
  var proportionNonbinary = req.session.nonbinary / (req.session.women + req.session.men + req.session.nonbinary);

  var image_parameters = [];
  image_parameters.push(
    '-gravity', 'NorthWest'
  );

  image_parameters.push('-page', '+0+0','assets/base_background.png');
  image_parameters.push('-page', '+0+0','assets/city_background_wire_logo.png');
  image_parameters.push('-page', '+0+130','assets/horizontal_bar.png');

  // Draw the chart
  if(req.session.men == 0) {
    image_parameters.push(
      '-fill', gold,
      '-stroke', gold,
      '-draw', 'circle 450,500 450,700'
    );
  } else {
    image_parameters.push(
      '-fill', red,
      '-stroke', red,
      '-draw', 'circle 450,500 450,700'
    );
  }
  if(proportionWomen > 0) {
    var degrees = (proportionWomen * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 + 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', gold,
      '-stroke', gold,
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
      '-draw', 'path \'M 450,500 L 450,700 A 200,200 0 ' + ((degrees > 270)?1:0) + ',1 ' + x + ',' + y + ' Z\'',
      '+tile'
    );
  }

  if(proportionNonbinary > 0) {
    var degrees = (proportionNonbinary * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 - 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', purple,
      '-stroke', purple,
      '-draw', 'path \'M 450,500 L 450,700 A 200,200 0 ' + ((degrees > 270)?1:0) + ',' + ((degrees > 270)?0:0)  + ' ' + x + ',' + y + ' Z\''
    );
  }
  if(proportionNonbinary == 1) {
    var degrees = (proportionNonbinary * 360 + 90);
    var radians = degrees * Math.PI / 180;
    var x = 450 - 200 * Math.cos(radians);
    var y = 500 + 200 * Math.sin(radians);
    image_parameters.push(
      '-fill', purple,
      '-stroke', purple,
      '-draw', 'circle 450,500 450,700'
    );
  }

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', gold,
    '-fill', gold,
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+75+630', req.session.women + ((req.session.women == 1)?" Woman":" Women"));

  if(req.session.nonbinary > 0) {
    image_parameters.push(
      '-gravity', 'NorthEast',
      '-stroke', purple,
      '-fill', purple,
      '-font', 'Arial',
      '-pointsize', '30',
      '-annotate', '+25+670', req.session.nonbinary + ((req.session.nonbinary == 1)?" Nonbinary Person":" Nonbinary Persons"));
  }
  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', orange,
    '-fill', orange,
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+75+670', req.session.womenofcolor + ((req.session.womenofcolor == 1)?" Woman of Color":" Women of Color"));
  image_parameters.push(
    '-gravity', 'NorthEast',
    '-stroke', red,
    '-fill', red,
    '-font', 'Arial',
    '-pointsize', '30',
    '-annotate', '+125+630', req.session.men + ((req.session.men == 1)?" Man":" Men"));

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+160', req.session.session_text);

  image_parameters.push(
    '-gravity', 'NorthWest',
    '-stroke', white,
    '-fill', white,
    '-font', 'Arial',
    '-pointsize', '40',
    '-annotate', '+35+210', req.session.hashtag);

  if( proportionWomen + proportionNonbinary >= .5 ) {
    if(proportionWomenOfColor < .20) {
      image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '40',
        '-annotate', '+35+20', "OVERCAST WITHOUT ENOUGH");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', orange,
        '-fill', orange,
        '-font', 'ArialB',
        '-pointsize', '40',
        '-annotate', '+35+65', "WOMEN OF COLOR");
      social_share_text = "Overcast without enough women of color.";
    } else {
      image_parameters.push('-page', '+620+40','assets/icon_sunny_small.png');
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '40',
        '-annotate', '+35+20', "THE PRESENT AND FUTURE");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '40',
        '-annotate', '+35+65', "ARE");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', gold,
        '-fill', gold,
        '-font', 'ArialB',
        '-pointsize', '40',
        '-annotate', '+130+65', "BRIGHT");
      social_share_text = "The present and future are bright";
    }
  } else if ( proportionWomen + proportionNonbinary > .35 ) {
    image_parameters.push('-page', '+620+40','assets/icon_cloudy_small.png');

    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "CLOUDY WITH A");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "CHANCE OF ");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', red,
      '-fill', red,
      '-font', 'ArialB',
      '-pointsize', '42',
      '-annotate', '+300+65', "PATRIARCHY");
    social_share_text = "Cloudy with a chance of patriacrhy.";
  } else {
    image_parameters.push('-page', '+620+40','assets/icon_thunder_small.png');
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+20', "A THUNDERSTORM OF");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+35+65', "GENDER");
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', red,
      '-fill', red,
      '-font', 'ArialB',
      '-pointsize', '40',
      '-annotate', '+230+65', "INEQUALITY");
    social_share_text = "A thunderstorm of gender inequality.";
  }

  image_parameters.push(
    '-layers', 'flatten', card_filename
  );

  // Create the tally
  im.convert(image_parameters, function (err, stdout) {
    if(err)
      return next(err);

    // Upload this local file to imgur
    imgur.setClientId(process.env['IMGUR_API_KEY']);
    imgur.uploadFile(path.join(__dirname, '../' + card_filename))
      .then(function(error, response) {
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
              "women_of_color": req.session.womenofcolor,
              "nonbinary": req.session.nonbinary,
              "other": 0,
              "pie_id": pie_id,
              "pie_url": pie_url,
              "social_share_text": social_share_text,
            });

            req.session.lastCreated = pie_url;
            fs.unlinkSync(path.join(__dirname, '../' + card_filename));
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
          "women_of_color": req.session.womenofcolor,
          "nonbinary": req.session.nonbinary,
          "other": 0,
          "pie_id": pie_id,
          "pie_url": pie_url,
          "social_share_text": social_share_text,
        });
        fs.unlinkSync(path.join(__dirname, '../' + card_filename));
        req.session.lastCreated = pie_url;
        return res.redirect('/share/' + pie_id);
      }
    });
  });
});

app.post('/tally/photo', upload.single('photo'), function (req, res, next) {

  // Prep the output files
  var file_id = uuid.v4();
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var social_share_text = "";

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
    var totalCount = req.session.women + req.session.men + req.session.nonbinary;
    var proportionWomen = req.session.women / totalCount;
    var proportionWomenOfColor = req.session.womenofcolor / totalCount;
    var proportionNonbinary = req.session.nonbinary / totalCount;

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
      '-fill', red,
      '-stroke', red,
      '-draw', 'rectangle 50,790 850,840'
    );

    if(proportionWomen > 0) {
      var right = 50 + 800 * proportionWomen;
      image_parameters.push(
        '-fill', gold,
        '-stroke', gold,
        '-draw', 'rectangle 50,790 ' + right + ',840'
      );
    }
    if(proportionWomenOfColor > 0) {
      var right = 50 + 800 * proportionWomenOfColor;
      image_parameters.push(
        '-fill', orange,
        '-stroke', orange,
        '-draw', 'rectangle 50,790 ' + right + ',840'
      );
    }
    if(proportionNonbinary > 0) {
      var left = 850 - 800 * proportionNonbinary
      image_parameters.push(
        '-fill', purple,
        '-stroke', purple,
        '-draw', 'rectangle ' + left + ',790 850,840'
      );
    }
    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', gold,
      '-fill', gold,
      '-font', 'Arial',
      '-pointsize', '24',
      '-annotate', '+50+845', req.session.women + ((req.session.women == 1)?" Woman":" Women"));

    if(req.session.womenofcolor == 0) {
      image_parameters.push(
        '-stroke', black,
        '-fill', orange,
        '-draw', 'rectangle 40,871 280,900');

      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'Arial',
        '-pointsize', '24',
        '-annotate', '+50+873', "No Women of Color!");
    } else {
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', orange,
        '-fill', orange,
        '-font', 'Arial',
        '-pointsize', '24',
        '-annotate', '+50+870', req.session.womenofcolor + ((req.session.womenofcolor == 1)?" Woman of Color":" Women of Color"));
    }
    image_parameters.push(
      '-gravity', 'NorthEast',
      '-stroke', red,
      '-fill', red,
      '-font', 'Arial',
      '-pointsize', '24',
      '-annotate', '+50+845', req.session.men + ((req.session.men == 1)?" Man":" Men"));

    if(req.session.nonbinary > 0) {
      image_parameters.push(
        '-gravity', 'NorthEast',
        '-stroke', purple,
        '-fill', purple,
        '-font', 'Arial',
        '-pointsize', '24',
        '-annotate', '+50+870', req.session.nonbinary + ((req.session.nonbinary == 1)?" Nonbinary Person":" Nonbinary Persons"));
    }

    var text = req.session.session_text + " " + req.session.hashtag;

    image_parameters.push(
      '-gravity', 'NorthWest',
      '-stroke', white,
      '-fill', white,
      '-font', 'Arial',
      '-pointsize', '40',
      '-annotate', '+50+735', text);

    if( proportionWomen + proportionNonbinary >= .5 ) {
      if(proportionWomenOfColor < .20) {
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', white,
          '-fill', white,
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+50+640', "OVERCAST WITHOUT ENOUGH");
        image_parameters.push(
            '-gravity', 'NorthWest',
            '-stroke', orange,
            '-fill', orange,
            '-font', 'ArialB',
            '-pointsize', '40',
            '-annotate', '+50+685', "WOMEN OF COLOR");
        social_share_text = "Overcast without enough women of color.";
      } else {
        image_parameters.push('-page', '+620+470','assets/icon_sunny.png');
          image_parameters.push(
            '-gravity', 'NorthWest',
            '-stroke', white,
            '-fill', white,
            '-font', 'ArialB',
            '-pointsize', '40',
            '-annotate', '+50+640', "THE PRESENT AND FUTURE");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', white,
          '-fill', white,
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+50+685', "ARE");
        image_parameters.push(
          '-gravity', 'NorthWest',
          '-stroke', gold,
          '-fill', gold,
          '-font', 'ArialB',
          '-pointsize', '40',
          '-annotate', '+145+685', "BRIGHT");
        social_share_text = "The present and future are bright!";
      }
    } else if ( proportionWomen + proportionNonbinary > .35 ) {
      image_parameters.push('-page', '+620+470','assets/icon_cloudy.png');

      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '42',
        '-annotate', '+50+640', "CLOUDY WITH A");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '42',
        '-annotate', '+50+685', "CHANCE OF ");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', red,
        '-fill', red,
        '-font', 'ArialB',
        '-pointsize', '42',
        '-annotate', '+310+685', "PATRIARCHY");
        social_share_text = "Cloudy with a chance of patriarchy.";
    } else {
      image_parameters.push('-page', '+620+470','assets/icon_thunder.png');
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '42',
        '-annotate', '+50+640', "A THUNDERSTORM OF");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', white,
        '-fill', white,
        '-font', 'ArialB',
        '-pointsize', '42',
        '-annotate', '+50+685', "GENDER");
      image_parameters.push(
        '-gravity', 'NorthWest',
        '-stroke', red,
        '-fill', red,
        '-font', 'ArialB',
        '-pointsize', '42',
        '-annotate', '+245+685', "INEQUALITY");
        social_share_text = "A thunderstorm of gender inequality.";
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
        imgur.setClientId(process.env['IMGUR_API_KEY']);
        imgur.uploadFile(path.join(__dirname, '../' + card_filename))
          .then(function(error, response) {
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
                  "women_of_color": req.session.womenofcolor,
                  "nonbinary": req.session.nonbinary,
                  "other": 0,
                  "pie_id": pie_id,
                  "pie_url": pie_url,
                  "social_share_text": social_share_text,
                });

                fs.unlinkSync(req.file.path);
                fs.unlinkSync(path.join(__dirname, '../' + card_filename));
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
              "women_of_color": req.session.womenofcolor,
              "nonbinary": req.session.nonbinary,
              "other": 0,
              "pie_id": pie_id,
              "pie_url": pie_url,
              "social_share_text": social_share_text,
            });
            fs.unlinkSync(req.file.path);
            fs.unlinkSync(path.join(__dirname, '../' + card_filename));
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
    var plotRef = firebaseDatastore.ref('plots/' + pie_id);

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
  var plotRef = firebaseDatastore.ref('plots/'+pie_id);

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
