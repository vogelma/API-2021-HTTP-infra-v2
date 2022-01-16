$(function(){
    console.log("Loading pets to adopt");

    function loadPets(){
        $.getJSON("/pets/", function(pets) {
            console.log(pets);
            var msg = "Nobody is here";
            var color = "black";
            
            if(pets.length > 0){
                msg = pets[0].animal;
                color = pets[0].color;
            }
        $(".pets").text(msg);
        $(".pets").css('color', color);
        });
    };

    loadPets();
    setInterval(loadPets, 2000);
});