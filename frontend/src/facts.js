const button = document.getElementById("modeButton");

button.addEventListener("click", function(){

document.body.classList.toggle("dark-mode");

if(document.body.classList.contains("dark-mode"))
button.textContent = "Light Mode";
else
button.textContent = "Dark Mode";

});