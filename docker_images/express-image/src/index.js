var Chance = require('chance');
var chance = new Chance();

var express = require('express');
var app = express();

app.get('/', function(req,res){
    res.send(generatePets());
});

app.listen(3000, function(){
    console.log('Accepting HTTP requests on port 3000.');
});

function generatePets(){

    var numberOfPets = chance.integer({
        min: 0,
        max: 10
    });

    console.log(numberOfPets);

    var pets = [];
    for(var i = 0; i < numberOfPets; i++){
        var name = chance.animal();
        var color = chance.color({format: 'hex'});

        pets.push({
            animal: name,
            color: color,
        });
    };
    console.log(pets);

    return pets;
}

