$(function(){
    console.log("Loading pets to adopt");

    function loadPets(){
        $.getJSON("/api/students/", function(pets) {
            console.log(pets);
            var msg = "Nobody is here";
            
            if(pets.length > 0){
                msg = pets[0].animal + " "+ pets[0].color; 
            }
        $(".skills").text(msg);
        });
    };

    loadPets();
    setInterval(loadPets, 2000);
});