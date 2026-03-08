function login() {

let user = document.getElementById("userid").value;
let pass = document.getElementById("password").value;

if(user === "labour1" && pass === "1234"){

localStorage.setItem("username", user);

window.location.href = "dashboard.html";

}

else{

document.getElementById("message").innerText = "Invalid Login";

}

}
