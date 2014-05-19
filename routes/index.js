var quiche = require('quiche'),
    http   = require('http'),
    fs     = require('fs'),
    imgur  = require('imgur-upload'),
    path   = require('path'),
    im     = require('node-imagemagick'),
    uuid   = require('node-uuid');

exports.index = function (req, res) {
  res.render('report.html', {title: 'Report'});
};

exports.report = function (req, res) {
  res.render('report.html', { title: 'Report'});
};

exports.pie = function (req, res, next) {
  var pie_url = req.query.pie_url;
  res.render('submit.html', {
    title: 'Submit',
    pie: pie_url
  });
};

///// SUBMIT FORM TO THIS PAGE
exports.submit = function (req, res) {
 var men        = req.body.men,
     women      = req.body.women,
     label_text = req.body.label_text;
 
  // TODO: Add Validation and response

  //generate UUID for filenames
  file_id = uuid.v4();

  // generate pie chart from google charts API
  var pie = new quiche('pie');
  pie.setTransparentBackground(); // Make background transparent
  pie.setLegendSize(40);
  pie.setLegendColor("444444");
  pie.setWidth(600);
  pie.setHeight(400);
  pie.addData(women, women + ' women', 'f44820');
  pie.addData(men, men + ' men', '7fc8b4');
  pie.addData(2, '2 cats', '444444');

  var uploaded=false;

  // set initial pie url for redundancy's sake
  var pie_url = pie.getUrl(true).replace("https","http");

/*      res.render('submit', { title: 'Submit',
                             pie: pie_url});*/
  //download the pie chart to a local file
  var chart_filename = "assets/chartgen/" + file_id + "_chart.png";
  var card_filename = "assets/chartgen/" + file_id + "_card.png";
  var file = fs.createWriteStream(chart_filename);
  var request = http.get(pie.getUrl(true).replace("https","http"), function(response) {
    try{
      response.pipe(file);
    }catch(e){
      console.log(e);
    }

    // ONCE THE IMAGE IS DOWNLOADED
    response.on('end', function () {

      //ADD OUR BRANDING TO DOWNLOADED IMAGE
     // convert -gravity north -stroke '#4444' -font Helvetica-bold -pointsize 60 -strokewidth 2 -annotate +0+55 'Faerie Dragon' -page +0+0 assets/genderavenger_sample_template.png -page +100+150 assets/chartgen/da6cf241-feeb-4730-90b8-f36755a2028a_chart.png -layers flatten card.png
      im.convert(['-gravity', 'north', '-stroke', '#444444', '-font', 'Helvetica-bold', '-pointsize', '60', '-strokewidth', '2', '-annotate', '+0+55', label_text, '-page', '+0+0', 'assets/genderavenger_sample_template.png', '-page', '+100+150', chart_filename, '-layers', 'flatten', card_filename], 
      function(err, stdout){
        if (err){
          throw err;
        }else{
          //upload that local file to  imgur
          imgur.setClientID(process.env['IMGUR_API_KEY']);
          if(uploaded==false){
            imgur.upload(path.join(__dirname, '../' + card_filename),function(error, response){
              uploaded=true;
              pie_url = response.data.link
              res.redirect('/plot?pie_url='+pie_url);
            });
          }
        }
      });
    });
  });
};
