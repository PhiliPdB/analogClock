// Analog Clock
// By: Philip de Bruin
// Last edit: 12/03/2015

// Abstract browser differences with requestAnimationFrame, with a fallback to setTimeout
window.requestAnimationFrame = window.requestAnimationFrame
							   || window.mozRequestAnimationFrame
							   || window.webkitRequestAnimationFrame
							   || window.msRequestAnimationFrame
							   || function(callback){setTimeout(callback, 60)};

var clock = document.getElementById("clock"),
	hour = document.getElementsByClassName("hour"),
	minute = document.getElementsByClassName("minute"),
	second = document.getElementsByClassName("second");

window.onload = resizeClock;
window.onresize = resizeClock;

function resizeClock() {
	if (window.innerWidth <= window.innerHeight) {
		clock.style.width = window.innerWidth - 16 + "px";
		clock.style.height = window.innerWidth - 16 + "px";
	} else if (window.innerWidth >= window.innerHeight) {
		clock.style.width = window.innerHeight - 16 + "px";
		clock.style.height = window.innerHeight - 16 + "px";
	}
}

function updateClock() {
	var time = new Date(),
		hourDeg = (time.getHours() + time.getMinutes() / 60) / 12 * 360,
		minuteDeg = (time.getMinutes() + time.getSeconds() / 60) / 60 * 360,
		secondDeg = (time.getSeconds() + time.getMilliseconds() / 1000) / 60 * 360;
	hour[0].style.transform = "rotate(" + hourDeg + "deg)";
	minute[0].style.transform = "rotate(" + minuteDeg + "deg)";
	second[0].style.transform = "rotate(" + secondDeg + "deg)";
	requestAnimationFrame(updateClock);
};

requestAnimationFrame(updateClock);