var quiche = require('quiche'),
    http   = require('http'),
    fs     = require('fs'),
    imgur  = require('imgur-upload'),
    path   = require('path'),
    im     = require('node-imagemagick'),
    uuid   = require('node-uuid'),
    Firebase = require('firebase');

var firebaseDatastore = new Firebase('https://even-steven.firebaseio.com/');

exports.index = function (req, res) {
  res.render('report.html', {title: 'Report'});
};

exports.report = function (req, res) {
  res.render('report.html', { title: 'Report'});
};

exports.pie = function (req, res, next) {
  // Get the param
  var pie_id = req.params.id;
  var plotRef = firebaseDatastore.child('plots/'+pie_id);
  // Load the data from firebase
  plotRef.once('value', function (snapshot) {
    var refVal = snapshot.val();
    var pie_url = refVal.pie_url;

    // If the pie_url is missing (meaning we need to regenerate it), generate teh pie chart and re-upload to imgur
    if (!pie_url) {
      var pie = generatePieChart(refVal.men, refVal.women, refVal.other);
      getMagickedImage(pie, refVal.label_text, function (error, data) {
        if (error) {
          return next(error);
        }
        // Update the pie_url to the newly created plot
        var pie_url = data.link;
        plotRef.child('pie_url').set(pie_url);
        return res.render('submit.html', {
          title: 'Submit',
          pie: pie_url
        })
      });
    } else {
      return res.render('submit.html', {
        title: 'Submit',
        pie: pie_url
      });
    }
  })
};

///// SUBMIT FORM TO THIS PAGE
exports.submit = function (req, res, next) {
 var men        = req.body.men,
     women      = req.body.women,
     label_text = req.body.label_text;
 
  // TODO: Add Validation and response

  // Default to zero individuals with a non-binary gender
  var pie = generatePieChart(men, women, 0);

  // set initial pie url for redundancy's sake
  var pie_url = pie.getUrl(true).replace("https","http");
  getMagickedImage(pie, label_text, function (error, data) {
    if (error) {
      return next(error);
    }

    pie_id = data.id;
    pie_url = data.link;
    var plotRef = firebaseDatastore.child('plots/'+pie_id);
    plotRef.set({label_text: label_text, men: men, women: women, other: 0, pie_id: pie_id, pie_url: pie_url});
    return res.redirect('/plot/' + pie_id);  
  });
};

function generatePieChart (men, women, other) {
  // generate pie chart from google charts API
  var pie = new quiche('pie');
  pie.setTransparentBackground(); // Make background transparent
  pie.setLegendSize(40);
  pie.setLegendColor("444444");
  pie.setWidth(600);
  pie.setHeight(400);
  pie.addData(women, women + ' women', 'f44820');
  pie.addData(men, men + ' men', '7fc8b4');
  if (other > 0) {
    pie.addData(other, other + ' other', '444444');
  }
  return pie;
};

function getMagickedImage (pie, label_text, callback) {
  // Callback parameters are (error, data)
  callback = callback || function () {}; // Null callback
  //generate UUID for filenames
  var file_id = uuid.v4();
  //download the pie chart to a local file
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var file = fs.createWriteStream(chart_filename);
  var request = http.get(pie.getUrl(true).replace("https","http"), function(response) {
    try{
      response.pipe(file);
    }catch(e){
      return callback(e, null);
    }

    // ONCE THE IMAGE IS DOWNLOADED
    response.on('end', function () {
      //ADD OUR BRANDING TO DOWNLOADED IMAGE
      // convert -gravity north -stroke '#4444' -font Helvetica-bold -pointsize 60 -strokewidth 2 -annotate +0+55 'Faerie Dragon' -page +0+0 assets/genderavenger_sample_template.png -page +100+150 assets/chartgen/da6cf241-feeb-4730-90b8-f36755a2028a_chart.png -layers flatten card.png
      im.convert(['-gravity', 'north', '-stroke', '#444444', '-font', 'Helvetica-bold', '-pointsize', '60', '-strokewidth', '2', '-annotate', '+0+55', label_text, '-page', '+0+0', 'assets/genderavenger_sample_template.png', '-page', '+100+150', chart_filename, '-layers', 'flatten', card_filename], 
        function (err, stdout) {
          if (err) {
            return callback(err, null);
          } else {
            //upload that local file to imgur
            imgur.setClientID(process.env['IMGUR_API_KEY']);
            imgur.upload(path.join(__dirname, '../' + card_filename),function(error, response){
              return callback(null, response.data);
            });
          }
        });
    });
  });
}
