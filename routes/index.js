var quiche = require('quiche'),
    http = require('http'),
    //https = require('https'),
    fs = require('fs'),
    imgur = require('imgur-upload'),
    path = require('path');

exports.index = function (req, res) {
  res.render('index', { title: 'Homepage'});
};

exports.report = function (req, res) {
  res.render('report', { title: 'Report'});
};

///// SUBMIT FORM TO THIS PAGE
exports.submit = function (req, res) {
 var men = req.body.men,
     women = req.body.women;

  // generate pie chart from google charts API
  var pie = new quiche('pie');
  pie.setTransparentBackground(); // Make background transparent
  pie.setWidth(400);
  pie.setHeight(265);
  pie.addData(men, 'men', 'FF0000');
  pie.addData(women, 'women', '0000FF');
  pie.addData(2, 'cats', '00FF00');

  var uploaded=false;

  // set initial pie url for redundancy's sake
  var pie_url = pie.getUrl(true).replace("https","http");

/*      res.render('submit', { title: 'Submit',
                             pie: pie_url});*/
  //download the pie chart to a local file
  var file = fs.createWriteStream("tmp.png");
  var request = http.get(pie.getUrl(true).replace("https","http"), function(response) {
    try{
      response.pipe(file);
    }catch(e){
      console.log(e);
    }

    // ONCE THE IMAGE IS DOWNLOADED
    response.on('end', function () {

      //TODO: ADD OUR BRANDING TO DOWNLOADED IMAGE


      //upload that local file to  imgur
      imgur.setClientID("");
      if(uploaded==false){
        imgur.upload(path.join(__dirname, '../tmp.png'),function(error, response){
          uploaded=true;
          pie_url = response.data.link
          console.log("YEP");
          console.log(pie_url);
          res.render('submit', { title: 'Submit',
                                 pie: pie_url});
        });
      }
    });
  });
};
