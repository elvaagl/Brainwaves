const slider = document.querySelector(".slider");

let position = 0;

function animate() {

    position += 0.5;   // speed

    slider.style.transform =
        "translateX(" + position + "px)";

    // Reset position when half passed
    if(position > slider.scrollWidth / 2){
        position = 0;
    }

    requestAnimationFrame(animate);
}

animate();