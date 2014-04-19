 var Quiche = require('quiche');

 var pie = new Quiche('pie');
 pie.setTransparentBackground(); // Make background transparent
 pie.setWidth(400);
 pie.setHeight(265);
 pie.addData(3000, 'Foo', 'FF0000');
 pie.addData(2900, 'Bas', '0000FF');
 pie.addData(1500, 'Bar', '00FF00');

 console.log(pie.getUrl(true));
