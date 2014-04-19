var imgur = require('imgur-upload'),
path = require('path');

imgur.setClientID("d8a3def561ac68f");
imgur.upload(path.join(__dirname, 'pie.png'),function(err, res){
    console.log(res.data.link); //log the imgur url
});
